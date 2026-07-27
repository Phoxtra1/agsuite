import { useMemo } from "react";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  BarChart,
  Calendar,
  DollarSign
} from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend, PieChart, Pie } from "recharts";

interface ReportsViewProps {
  records: Record<string, any>[];
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function ReportsView({ records = [] }: ReportsViewProps) {
  const today = new Date("2026-04-14"); // Consistent baseline reference date

  // Helper: map fields safely
  const getTaskField = (task: Record<string, any>, fields: string[]): string => {
    for (const f of fields) {
      if (task[f] !== undefined) return String(task[f]);
    }
    return "";
  };

  const parsedTasks = useMemo(() => {
    return records.map((r) => {
      const taskName = getTaskField(r, ["Task Name", "Task", "Name", "Title"]);
      const status = getTaskField(r, ["Status", "status", "State"]) || "Not Started";
      const priority = getTaskField(r, ["Priority", "priority", "Level"]) || "Medium";
      const assignedTo = getTaskField(r, ["Assigned To", "assignedTo", "Owner"]) || "Unassigned";
      const dueDate = getTaskField(r, ["Due Date", "dueDate", "End Date"]);
      const startDate = getTaskField(r, ["Start Date", "startDate"]);
      const progress = parseFloat(getTaskField(r, ["Progress (%)", "Progress", "progress"])) || 0;
      const department = getTaskField(r, ["Department", "department"]) || "Unspecified";
      const team = getTaskField(r, ["Team", "team"]) || "Unspecified";
      const category = getTaskField(r, ["Category", "category"]) || "Unspecified";

      // Overdue check
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
        startDate,
        progress,
        department,
        team,
        category,
        isOverdue
      };
    });
  }, [records]);

  // Metric 1: Task Completion
  const totalTasks = parsedTasks.length;
  const completedTasks = parsedTasks.filter((t) => t.status === "Completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = parsedTasks.filter((t) => t.isOverdue);

  // Metric 2: Team Performance (tasks assigned and completed per user)
  const teamPerformance = useMemo(() => {
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
  }, [parsedTasks]);

  // Metric 3: Priority Distribution
  const priorityDistribution = useMemo(() => {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    parsedTasks.forEach((t) => {
      if (counts[t.priority] !== undefined) {
        counts[t.priority] += 1;
      } else {
        counts["Medium"] += 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [parsedTasks]);

  // Metric 4: Department Workload
  const departmentWorkload = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedTasks.forEach((t) => {
      counts[t.department] = (counts[t.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [parsedTasks]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-muted/20 space-y-6">
      {/* Header */}
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

      {/* Grid of Main Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Task Completion Metrics */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Task Completion Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-muted/40 rounded-lg p-3">
              <span className="text-muted-foreground font-medium block">Total Tasks</span>
              <span className="text-xl font-bold text-foreground mt-1 block">{totalTasks}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <span className="text-muted-foreground font-medium block">Completed</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">{completedTasks}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <span className="text-muted-foreground font-medium block">Overdue</span>
              <span className="text-xl font-bold text-rose-600 mt-1 block">{overdueTasks.length}</span>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <span className="text-muted-foreground font-medium block">Completion Rate</span>
              <span className="text-xl font-bold text-accent mt-1 block">{completionRate}%</span>
            </div>
          </div>
          {/* Visual completion meter */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
              <span>Overall Completion Meter</span>
              <span className="text-emerald-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Priority Distribution */}
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

        {/* Card 3: Department Workload Breakdown */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-blue-500" /> Department workloads
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={departmentWorkload}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {departmentWorkload.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* List 1: Team Performance Registry */}
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
                  <th className="p-3 text-center">Completed Tasks</th>
                  <th className="p-3 text-center">Average Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {teamPerformance.map((user) => (
                  <tr key={user.name} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">{user.name}</td>
                    <td className="p-3 text-center font-bold text-slate-600">{user.assigned}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{user.completed}</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-accent">{user.avgProgress}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* List 2: Overdue Tasks Critical Alerts */}
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
                  <div className="text-rose-700/80 font-medium text-[11px] mt-1">
                    Assigned: {t.assignedTo} &bull; Dept: {t.department}
                  </div>
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
      </div>
    </div>
  );
}
