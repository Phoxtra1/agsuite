import { useMemo } from "react";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  Sparkles
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";

interface ReportsViewProps {
  records: Record<string, any>[];
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function ReportsView({ records = [] }: ReportsViewProps) {
  const today = new Date("2026-04-14"); // Consistent baseline reference date

  // Dynamic analysis of spreadsheet headers
  const sheetAnalysis = useMemo(() => {
    const headers = records.length > 0 ? Object.keys(records[0]).filter(k => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_")) : [];

    const findHeader = (matches: string[]) => {
      return headers.find(h => matches.some(m => h.toLowerCase().trim() === m || h.toLowerCase().trim().includes(m))) || null;
    };

    const taskNameHeader = findHeader(["task name", "task", "name", "title"]) || headers[1] || headers[0] || "Task Name";
    const statusHeader = findHeader(["status", "state", "pipeline"]);
    const priorityHeader = findHeader(["priority", "level", "urgency"]);
    const assignedHeader = findHeader(["assigned to", "assignee", "owner", "assigned"]);
    const dueDateHeader = findHeader(["due date", "deadline", "ends", "end date"]);
    const startDateHeader = findHeader(["start date", "starts"]);
    const progressHeader = findHeader(["progress", "progress (%)", "completion"]);
    const departmentHeader = findHeader(["department", "dept"]);
    const teamHeader = findHeader(["team"]);

    return {
      headers,
      taskNameHeader,
      statusHeader,
      priorityHeader,
      assignedHeader,
      dueDateHeader,
      startDateHeader,
      progressHeader,
      departmentHeader,
      teamHeader,

      // Flags
      hasStatus: !!statusHeader,
      hasPriority: !!priorityHeader,
      hasAssigned: !!assignedHeader,
      hasDates: !!dueDateHeader,
      hasProgress: !!progressHeader,
      hasDepartment: !!departmentHeader,
      hasTeam: !!teamHeader
    };
  }, [records]);

  // Unified parsed tasks mapping
  const parsedTasks = useMemo(() => {
    return records.map((r) => {
      const taskName = String(r[sheetAnalysis.taskNameHeader] || "");
      const status = sheetAnalysis.statusHeader ? String(r[sheetAnalysis.statusHeader] || "Not Started") : "";
      const priority = sheetAnalysis.priorityHeader ? String(r[sheetAnalysis.priorityHeader] || "Medium") : "";
      const assignedTo = sheetAnalysis.assignedHeader ? String(r[sheetAnalysis.assignedHeader] || "Unassigned") : "";
      const dueDate = sheetAnalysis.dueDateHeader ? String(r[sheetAnalysis.dueDateHeader] || "") : "";
      const progress = sheetAnalysis.progressHeader ? (parseFloat(r[sheetAnalysis.progressHeader]) || 0) : 0;
      const department = sheetAnalysis.departmentHeader ? String(r[sheetAnalysis.departmentHeader] || "Unspecified") : "Unspecified";

      let isOverdue = false;
      if (dueDate && status !== "Completed") {
        const dueD = new Date(dueDate);
        isOverdue = dueD < today;
      }

      return {
        taskName,
        status,
        priority,
        assignedTo,
        dueDate,
        progress,
        department,
        isOverdue
      };
    });
  }, [records, sheetAnalysis]);

  // Metric: Task Completion
  const completionStats = useMemo(() => {
    if (!sheetAnalysis.hasStatus) return null;
    const total = parsedTasks.length;
    const completed = parsedTasks.filter((t) => t.status === "Completed").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdueCount = parsedTasks.filter((t) => t.isOverdue).length;

    return {
      total,
      completed,
      overdueCount,
      rate
    };
  }, [parsedTasks, sheetAnalysis]);

  // Metric: Team Workloads & Progress
  const teamPerformance = useMemo(() => {
    if (!sheetAnalysis.hasAssigned) return [];
    const perf: Record<string, { assigned: number; completed: number; progressSum: number }> = {};
    parsedTasks.forEach((t) => {
      const user = t.assignedTo;
      if (!perf[user]) perf[user] = { assigned: 0, completed: 0, progressSum: 0 };
      perf[user].assigned += 1;
      perf[user].progressSum += t.progress;
      if (t.status === "Completed") perf[user].completed += 1;
    });
    return Object.entries(perf).map(([name, stats]) => ({
      name,
      assigned: stats.assigned,
      completed: stats.completed,
      avgProgress: Math.round(stats.progressSum / stats.assigned)
    }));
  }, [parsedTasks, sheetAnalysis.hasAssigned]);

  // Metric: Priority Distribution chart data
  const priorityDistribution = useMemo(() => {
    if (!sheetAnalysis.hasPriority) return [];
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    parsedTasks.forEach((t) => {
      const p = t.priority;
      if (counts[p] !== undefined) {
        counts[p] += 1;
      } else {
        counts["Medium"] += 1;
      }
    });
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [parsedTasks, sheetAnalysis.hasPriority]);

  // Metric: Department Workload
  const departmentWorkload = useMemo(() => {
    if (!sheetAnalysis.hasDepartment) return [];
    const counts: Record<string, number> = {};
    parsedTasks.forEach((t) => {
      counts[t.department] = (counts[t.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [parsedTasks, sheetAnalysis.hasDepartment]);

  const overdueTasks = useMemo(() => {
    return parsedTasks.filter((t) => t.isOverdue);
  }, [parsedTasks]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-muted/20 space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tasks Analytical Report</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive audit tracking, workloads, and task completion intelligence.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-accent/10 text-accent font-semibold px-3 py-1.5 rounded-full border border-accent/20 shadow-sm">
          <Sparkles className="h-4 w-4 text-accent animate-spin" /> Live Sync Data Report
        </div>
      </div>

      {/* Grid of Dynamic Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Task Completion Meter */}
        {completionStats && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Task Completion Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-muted/40 rounded-lg p-3">
                <span className="text-muted-foreground font-medium block">Total Tasks</span>
                <span className="text-xl font-bold text-foreground mt-1 block">{completionStats.total}</span>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <span className="text-muted-foreground font-medium block">Completed</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">{completionStats.completed}</span>
              </div>
              {sheetAnalysis.hasDates && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <span className="text-muted-foreground font-medium block">Overdue</span>
                  <span className="text-xl font-bold text-rose-600 mt-1 block">{completionStats.overdueCount}</span>
                </div>
              )}
              <div className="bg-muted/40 rounded-lg p-3">
                <span className="text-muted-foreground font-medium block">Completion Rate</span>
                <span className="text-xl font-bold text-accent mt-1 block">{completionStats.rate}%</span>
              </div>
            </div>
            {/* Completion Rate visual meter */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                <span>Overall Completion Meter</span>
                <span className="text-emerald-600">{completionStats.rate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionStats.rate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Card 2: Priority Distribution */}
        {sheetAnalysis.hasPriority && priorityDistribution.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Priority Allocation
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Card 3: Department Workloads */}
        {sheetAnalysis.hasDepartment && departmentWorkload.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-blue-500" /> Department Workloads
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentWorkload}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {departmentWorkload.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Advanced dynamic listing reports */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Team Performance Workloads (only if assignedHeader is profiled) */}
        {sheetAnalysis.hasAssigned && teamPerformance.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-indigo-500" /> Team Performance & Progress Audits
            </h3>
            <div className="overflow-x-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/35 text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3">Team Member</th>
                    <th className="p-3 text-center">Assigned Tasks</th>
                    {sheetAnalysis.hasStatus && <th className="p-3 text-center">Completed Tasks</th>}
                    {sheetAnalysis.hasProgress && <th className="p-3 text-center">Average Progress</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {teamPerformance.map((user) => (
                    <tr key={user.name} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{user.name}</td>
                      <td className="p-3 text-center font-bold text-slate-600">{user.assigned}</td>
                      {sheetAnalysis.hasStatus && <td className="p-3 text-center font-bold text-emerald-600">{user.completed}</td>}
                      {sheetAnalysis.hasProgress && (
                        <td className="p-3 text-center">
                          <span className="font-bold text-accent">{user.avgProgress}%</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overdue deadliness alerts (only if dates is profiled) */}
        {sheetAnalysis.hasDates && (
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Critical Overdue Deadlines
            </h3>
            <div className="overflow-y-auto max-h-[250px] space-y-2 text-xs pr-1">
              {overdueTasks.map((t) => (
                <div
                  key={t.taskName}
                  className="p-3 rounded-lg border border-rose-200 bg-rose-50/30 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-rose-950 leading-snug">{t.taskName}</div>
                    {sheetAnalysis.hasAssigned && (
                      <div className="text-rose-700/80 font-medium text-[11px] mt-1">
                        Assigned: {t.assignedTo} {sheetAnalysis.hasDepartment ? `• Dept: ${t.department}` : ""}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-rose-300">
                      Overdue: {t.dueDate}
                    </span>
                  </div>
                </div>
              ))}
              {overdueTasks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground italic">
                  Awesome! There are no overdue tasks in this solution database.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
