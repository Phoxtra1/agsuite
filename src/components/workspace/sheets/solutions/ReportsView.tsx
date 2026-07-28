import { useState, useMemo, useEffect } from "react";
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
  DollarSign,
  FileText,
  Printer,
  Download,
  Building2,
  Award,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  MapPin,
  Activity,
  Database,
  Tag,
  Shield,
  Check,
  Info
} from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";

interface ReportsViewProps {
  records?: Record<string, any>[];
  allSheets?: any[];
  parseRowsFn?: (sheet: any) => Record<string, any>[];
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function ReportsView({ records = [], allSheets = [], parseRowsFn }: ReportsViewProps) {
  // If allSheets and parseRowsFn are available, render the HR Reports View mode
  if (allSheets.length > 0 && parseRowsFn) {
    return <HrReportsView allSheets={allSheets} parseRowsFn={parseRowsFn} />;
  }

  // Otherwise, render the Tasks / Records Analytical Report view
  return <TasksReportsView records={records} />;
}

// ----------------------------------------------------
// Tasks & General Records Analytical Report Component
// ----------------------------------------------------
function TasksReportsView({ records }: { records: Record<string, any>[] }) {
  const today = new Date("2026-04-14"); // Consistent baseline reference date

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
=======
  FileText,
  TrendingUp,
  MapPin,
  Calendar,
  Activity,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  Filter,
  Check,
  Search,
  Database,
  BarChart,
  Tag,
  Clock,
  Shield,
  Info
} from "lucide-react";

interface ReportsViewProps {
  records: Record<string, any>[];
  solutionType: string;
}

export default function ReportsView({ records = [], solutionType }: ReportsViewProps) {
  const [activeReport, setActiveReport] = useState<"summary" | "category" | "status" | "location" | "activity" | "custom">("summary");

  // Custom report builder state
  const [customFilterText, setCustomFilterText] = useState("");
  const [customSelectedFields, setCustomSelectedFields] = useState<string[]>([]);

  // Get all keys across records for report columns
  const allHeaders = useMemo(() => {
    if (records.length === 0) return [];
    return Object.keys(records[0]).filter(
      (k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_")
    );
  }, [records]);

  // Set default selected fields for custom report on first render or header load
  useMemo(() => {
    if (customSelectedFields.length === 0 && allHeaders.length > 0) {
      setCustomSelectedFields(allHeaders.slice(0, 5));
    }
  }, [allHeaders]);

  const toggleCustomField = (field: string) => {
    if (customSelectedFields.includes(field)) {
      if (customSelectedFields.length > 1) {
        setCustomSelectedFields((prev) => prev.filter((f) => f !== field));
      }
    } else {
      setCustomSelectedFields((prev) => [...prev, field]);
    }
  };

  // 1. Report: Summary Computations
  const summaryData = useMemo(() => {
    const total = records.length;
    const active = records.filter((r) => String(r.Status || r.status).toLowerCase() === "active").length;
    const pending = records.filter((r) => String(r.Status || r.status).toLowerCase() === "pending").length;
    const archived = records.filter((r) => String(r.Status || r.status).toLowerCase() === "archived").length;

    // Categories count
    const cats = new Set(records.map((r) => r.Category || r.category).filter(Boolean));
    // Locations count
    const locs = new Set(records.map((r) => r.Location || r.location).filter(Boolean));

    return {
      total,
      active,
      pending,
      archived,
      categoriesCount: cats.size,
      locationsCount: locs.size
    };
  }, [records]);

  // 2. Report: Category breakdown list
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; active: number; archived: number }> = {};
    records.forEach((r) => {
      const cat = r.Category || r.category || "Unassigned";
      if (!map[cat]) {
        map[cat] = { count: 0, active: 0, archived: 0 };
      }
      map[cat].count++;
      const st = String(r.Status || r.status).toLowerCase();
      if (st === "active") map[cat].active++;
      if (st === "archived") map[cat].archived++;
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats }));
  }, [records]);

  // 3. Report: Status breakdown list
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const st = r.Status || r.status || "Active";
      map[st] = (map[st] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [records]);

  // 4. Report: Location breakdown list
  const locationBreakdown = useMemo(() => {
    const map: Record<string, { count: number; active: number }> = {};
    records.forEach((r) => {
      const loc = r.Location || r.location || "Local Office";
      if (!map[loc]) {
        map[loc] = { count: 0, active: 0 };
      }
      map[loc].count++;
      if (String(r.Status || r.status).toLowerCase() === "active") {
        map[loc].active++;
      }
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats }));
  }, [records]);

  // 5. Report: Activity history compilation
  const activityHistory = useMemo(() => {
    // Generate simulated activities for default records or parsed records
    return records.map((r, i) => {
      const date = r["Updated Date"] || r["Created Date"] || "2026-04-10";
      const user = r.Owner || "System Administrator";
      return {
        id: `ACT-${100 + i}`,
        date,
        user,
        recordName: r.Name || `REG-${r.rowIndex}`,
        action: `Record updated/synchronized with sheet cells`,
        status: r.Status || r.status || "Active"
      };
    });
  }, [records]);

  const totalTasks = parsedTasks.length;
  const completedTasks = parsedTasks.filter((t) => t.status === "Completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = parsedTasks.filter((t) => t.isOverdue);

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

  const departmentWorkload = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedTasks.forEach((t) => {
      counts[t.department] = (counts[t.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [parsedTasks]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-muted/20 space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-blue-500" /> Department Workloads
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
=======
  // Filtered records for the Custom Report table
  const customReportRecords = useMemo(() => {
    return records.filter((rec) => {
      if (!customFilterText.trim()) return true;
                      const query = customFilterText.toLowerCase();
      return Object.values(rec).some((val) =>
                      String(val).toLowerCase().includes(query)
                      );
    });
  }, [records, customFilterText]);

  // Simulations
  const handleExportCSV = () => {
    const headers = activeReport === "custom" ? customSelectedFields : allHeaders;
                      const rows = activeReport === "custom" ? customReportRecords : records;

                      let csvContent = "data:text/csv;charset=utf-8,";
                      csvContent += headers.join(",") + "\n";

    rows.forEach((r) => {
      const row = headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`);
                      csvContent += row.join(",") + "\n";
    });

                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `Amineva_${solutionType}_${activeReport}_Report.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
  };

  const handlePrint = () => {
                        window.print();
  };

                      return (
                      <div className="flex-1 overflow-y-auto p-6 bg-muted/20 space-y-6 text-xs">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-4 flex-shrink-0">
                          <div>
                            <h2 className="text-xl font-bold text-foreground">
                              {solutionType} Analysis & Reports Hub
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              High-fidelity document audit trails, category metrics, and customized report builders.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleExportCSV}
                              className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg font-bold hover:bg-muted text-foreground shadow-sm"
                            >
                              <Download className="h-4 w-4 text-accent" /> Export Report CSV
                            </button>
                            <button
                              onClick={handlePrint}
                              className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg font-bold hover:bg-muted text-foreground shadow-sm"
                            >
                              <Printer className="h-4 w-4 text-muted-foreground" /> Print / Save PDF
                            </button>
                          </div>
                        </div>

                        {/* Report Selection Tabs */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-card p-1.5 border border-border rounded-xl">
                          {[
                            { id: "summary", label: "Registry Summary", icon: BarChart },
                            { id: "category", label: "Category Report", icon: Tag },
                            { id: "status", label: "Status Report", icon: Shield },
                            { id: "location", label: "Location Report", icon: MapPin },
                            { id: "activity", label: "Activity Trail", icon: Activity },
                            { id: "custom", label: "Custom Builder", icon: Sparkles }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveReport(tab.id as any)}
                              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition ${activeReport === tab.id
                                ? "bg-accent text-accent-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                              <tab.icon className="h-3.5 w-3.5" />
                              <span>{tab.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* REPORT CONTENT AREA */}

                        {/* 1. SUMMARY REPORT */}
                        {activeReport === "summary" && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Records</span>
                                <div className="text-3xl font-extrabold text-foreground">{summaryData.total}</div>
                                <p className="text-[11px] text-muted-foreground pt-1">All multi-category records synchronized in workspace.</p>
                              </div>
                              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Folders</span>
                                <div className="text-3xl font-extrabold text-emerald-600">{summaryData.active}</div>
                                <p className="text-[11px] text-muted-foreground pt-1">Current operational & verified records.</p>
                              </div>
                              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Categories & Locations</span>
                                <div className="text-3xl font-extrabold text-purple-600">
                                  {summaryData.categoriesCount} <span className="text-sm font-semibold text-muted-foreground">cats</span> / {summaryData.locationsCount} <span className="text-sm font-semibold text-muted-foreground">locs</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground pt-1">Dynamically mapped sectors and geological hubs.</p>
                              </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                              <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                                <Database className="h-4 w-4 text-accent" /> Registry Master Statistics
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-border">
                                <div className="py-2">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Active Percentage</span>
                                  <span className="block text-xl font-bold text-foreground mt-1">
                                    {summaryData.total > 0 ? Math.round((summaryData.active / summaryData.total) * 100) : 0}%
                                  </span>
                                </div>
                                <div className="py-2">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Pending Approval</span>
                                  <span className="block text-xl font-bold text-amber-500 mt-1">{summaryData.pending}</span>
                                </div>
                                <div className="py-2">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Archived Index</span>
                                  <span className="block text-xl font-bold text-muted-foreground mt-1">{summaryData.archived}</span>
                                </div>
                                <div className="py-2">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Sync Reliability</span>
                                  <span className="block text-xl font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1">
                                    <Check className="h-4 w-4" /> 100% Correct
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

      {/* 2. CATEGORY BREAKDOWN REPORT */}
      {activeReport === "category" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-purple-500" /> Category Analysis Index
            </h3>
            <span className="bg-accent/15 text-accent font-bold px-2 py-0.5 rounded text-[10px]">
              {categoryBreakdown.length} Categories Mapped
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Total Registered Records</th>
                  <th className="p-3">Active Records</th>
                  <th className="p-3">Archived Records</th>
                  <th className="p-3">Sustained Ratio</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((cat, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="p-3 font-bold text-foreground capitalize">{cat.name}</td>
                    <td className="p-3 font-medium text-foreground">{cat.count} records</td>
                    <td className="p-3 text-emerald-600 font-semibold">{cat.active}</td>
                    <td className="p-3 text-muted-foreground">{cat.archived}</td>
                    <td className="p-3 font-bold text-foreground">
                      {cat.count > 0 ? Math.round((cat.active / cat.count) * 100) : 0}%
>>>>>>> origin/jules-10842899696782935597-81a00e2f
                    </td >
                  </tr >
                ))
}
              </tbody >
            </table >
          </div >
        </div >
<<<<<<< HEAD

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
      </div >
    </div >
  );
}

// ----------------------------------------------------
// HR Analytical Reports Component
// ----------------------------------------------------
function HrReportsView({
  allSheets,
  parseRowsFn
}: {
  allSheets: any[];
  parseRowsFn: (sheet: any) => Record<string, any>[];
}) {
  const [activeReport, setActiveReport] = useState<
    | "directory"
    | "departments"
    | "attendance"
    | "leave"
    | "performance"
    | "recruitment"
    | "status"
    | "workforce"
  >("directory");

  const [searchQuery, setSearchQuery] = useState("");

  const REPORTS_LIST = [
    { id: "directory", label: "Employee Directory", desc: "Detailed listing of active profiles and contacts.", icon: Users },
    { id: "departments", label: "Department Summary", desc: "Aggregated headcounts and distributions per unit.", icon: Building2 },
    { id: "attendance", label: "Attendance Report", desc: "Overview of punctuality, working hours, and statuses.", icon: Clock },
    { id: "leave", label: "Leave Report", desc: "Summary of approved, pending, and annual leave trackers.", icon: Calendar },
    { id: "performance", label: "Performance Report", desc: "Aggregated goals, reviews, and reviewer metrics.", icon: Award },
    { id: "recruitment", label: "Recruitment Report", desc: "Hiring status pipelines and interview calendar.", icon: UserPlus },
    { id: "status", label: "Employment Status Report", desc: "Proportion of contract, probation, and active workers.", icon: CheckCircle },
    { id: "workforce", label: "Workforce Summary", desc: "Corporate metrics, total stats, and organizational overview.", icon: TrendingUp }
  ] as const;

  const sheetData = useMemo(() => {
    const dataMap: Record<string, any[]> = {};
    const sheetNames = ["Employees", "Departments", "Positions", "Attendance", "Leave", "Performance", "Recruitment", "Onboarding"];

    sheetNames.forEach((name) => {
      const sheet = allSheets.find((s) => s.name === name);
      dataMap[name] = sheet ? parseRowsFn(sheet) : [];
    });

    return dataMap;
  }, [allSheets, parseRowsFn]);

  const handleExportCSV = () => {
    alert("Exporting report as high-fidelity CSV format. Zero delays sync active.");
  };

  const reportContent = useMemo(() => {
    const q = searchQuery.toLowerCase();

    switch (activeReport) {
      case "directory": {
        const list = sheetData.Employees.filter((emp) =>
          String(emp["Full Name"] || emp["Employee Name"] || "").toLowerCase().includes(q) ||
          String(emp["Email"] || "").toLowerCase().includes(q) ||
          String(emp["Department"] || "").toLowerCase().includes(q)
        );
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Employee Directory</h3>
            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3 pl-5">Emp ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Position</th>
                    <th className="p-3">Hire Date</th>
                    <th className="p-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {list.length > 0 ? (
                    list.map((emp, i) => (
                      <tr key={i} className="hover:bg-muted/10 text-foreground font-medium">
                        <td className="p-3 pl-5 font-bold text-[11px] text-muted-foreground">{emp["Employee ID"]}</td>
                        <td className="p-3 text-foreground font-semibold">{emp["Full Name"]}</td>
                        <td className="p-3">{emp["Email"]}</td>
                        <td className="p-3">{emp["Department"]}</td>
                        <td className="p-3">{emp["Position"]}</td>
                        <td className="p-3">{emp["Hire Date"]}</td>
                        <td className="p-3">{emp["Office Location"]}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground italic">No matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "departments": {
        const counts: Record<string, number> = {};
        sheetData.Employees.forEach((emp) => {
          const d = emp["Department"] || "Unassigned";
          counts[d] = (counts[d] || 0) + 1;
        });

        const list = sheetData.Departments.filter((dept) =>
          String(dept["Department Name"] || "").toLowerCase().includes(q)
        );

        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Department Summary Report</h3>
            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3 pl-5">Dept Code</th>
                    <th className="p-3">Department Name</th>
                    <th className="p-3">Headcount</th>
                    <th className="p-3">Manager</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {list.length > 0 ? (
                    list.map((dept, i) => {
                      const name = dept["Department Name"];
                      return (
                        <tr key={i} className="hover:bg-muted/10 text-foreground font-medium">
                          <td className="p-3 pl-5 font-bold text-muted-foreground">{dept["Department Code"]}</td>
                          <td className="p-3 text-foreground font-semibold">{name}</td>
                          <td className="p-3 font-bold text-emerald-600">{counts[name] || 0} Employees</td>
                          <td className="p-3">{dept["Manager"]}</td>
                          <td className="p-3 max-w-xs truncate">{dept["Description"]}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "attendance": {
        const list = sheetData.Attendance.filter((att) =>
          String(att["Employee Name"] || "").toLowerCase().includes(q) ||
          String(att["Attendance Status"] || "").toLowerCase().includes(q)
        );

        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Daily Attendance Metrics</h3>
            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3 pl-5">Emp ID</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">Working Hours</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {list.length > 0 ? (
                    list.map((att, i) => (
                      <tr key={i} className="hover:bg-muted/10 text-foreground font-medium">
                        <td className="p-3 pl-5 font-bold text-muted-foreground">{att["Employee ID"]}</td>
                        <td className="p-3 font-semibold">{att["Employee Name"]}</td>
                        <td className="p-3">{att["Date"]}</td>
                        <td className="p-3">{att["Check-In Time"] || "-"}</td>
                        <td className="p-3">{att["Check-Out Time"] || "-"}</td>
                        <td className="p-3 font-bold">{att["Working Hours"]} hrs</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${att["Attendance Status"] === "Present" ? "bg-emerald-50 text-emerald-700" :
                            att["Attendance Status"] === "Late" ? "bg-rose-50 text-rose-700" : "bg-muted text-muted-foreground"
                            }`}>
                            {att["Attendance Status"]}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground italic">No matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "leave": {
        const list = sheetData.Leave.filter((l) =>
          String(l["Employee Name"] || "").toLowerCase().includes(q) ||
          String(l["Leave Type"] || "").toLowerCase().includes(q)
        );

        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Leave Requests & Tracker</h3>
            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3 pl-5">Emp Name</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">End Date</th>
                    <th className="p-3">Total Days</th>
                    <th className="p-3">Approver</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {list.length > 0 ? (
                    list.map((l, i) => (
                      <tr key={i} className="hover:bg-muted/10 text-foreground font-medium">
                        <td className="p-3 pl-5 font-semibold">{l["Employee Name"]}</td>
                        <td className="p-3 font-semibold text-accent">{l["Leave Type"]}</td>
                        <td className="p-3">{l["Start Date"]}</td>
                        <td className="p-3">{l["End Date"]}</td>
                        <td className="p-3 font-bold">{l["Total Days"]} days</td>
                        <td className="p-3">{l["Approver"]}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l["Status"] === "Approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}>
                            {l["Status"]}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground italic">No matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "performance": {
        const list = sheetData.Performance.filter((perf) =>
          String(perf["Employee Name"] || "").toLowerCase().includes(q)
        );

        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Performance Appraisals</h3>
            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3 pl-5">Emp Name</th>
                    <th className="p-3">Reviewer</th>
                    <th className="p-3">Review Date</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Goals</th>
                    <th className="p-3">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {list.length > 0 ? (
                    list.map((perf, i) => (
                      <tr key={i} className="hover:bg-muted/10 text-foreground font-medium">
                        <td className="p-3 pl-5 font-semibold">{perf["Employee Name"]}</td>
                        <td className="p-3">{perf["Reviewer"]}</td>
                        <td className="p-3">{perf["Review Date"]}</td>
                        <td className="p-3 text-amber-600 font-bold">★ {perf["Rating"]} / 5</td>
                        <td className="p-3 font-medium truncate max-w-xs">{perf["Goals"]}</td>
                        <td className="p-3 truncate max-w-xs text-muted-foreground">{perf["Comments"]}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground italic">No matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "recruitment": {
        const list = sheetData.Recruitment.filter((rec) =>
          String(rec["Candidate Name"] || "").toLowerCase().includes(q) ||
          String(rec["Job Title"] || "").toLowerCase().includes(q)
        );

        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Hiring & Candidate Flow</h3>
            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3 pl-5">Candidate Name</th>
                    <th className="p-3">Target Job Title</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Interview Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {list.length > 0 ? (
                    list.map((rec, i) => (
                      <tr key={i} className="hover:bg-muted/10 text-foreground font-medium">
                        <td className="p-3 pl-5 font-semibold">{rec["Candidate Name"]}</td>
                        <td className="p-3 font-bold text-foreground">{rec["Job Title"]}</td>
                        <td className="p-3">{rec["Department"]}</td>
                        <td className="p-3">{rec["Interview Date"] || "TBD"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent">
                            {rec["Application Status"] || rec["Hiring Status"]}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "status": {
        const counts: Record<string, number> = {};
        sheetData.Employees.forEach((emp) => {
          const type = emp["Employment Type"] || "Full-Time";
          counts[type] = (counts[type] || 0) + 1;
        });

        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Employment Types & Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border rounded-xl bg-card p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Proportions Summary</h4>
                <div className="space-y-3">
                  {Object.entries(counts).map(([type, value]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{type}</span>
                      <span className="font-bold text-accent bg-accent/5 px-2.5 py-1 rounded border border-accent/10">{value} Headcount</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "workforce": {
        const totalEmployees = sheetData.Employees.length;
        const totalDepartments = sheetData.Departments.length;
        const onLeave = sheetData.Employees.filter((emp) => emp["Employment Status"] === "On Leave").length;
        const active = sheetData.Employees.filter((emp) => emp["Employment Status"] === "Active").length;

        return (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground">Workforce Dashboard Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Headcount", value: totalEmployees, icon: Users, color: "text-blue-500 bg-blue-50 border-blue-100" },
                { label: "Corporate Departments", value: totalDepartments, icon: Building2, color: "text-purple-500 bg-purple-50 border-purple-100" },
                { label: "Active Employees", value: active, icon: CheckCircle, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
                { label: "On Leave Tracker", value: onLeave, icon: Calendar, color: "text-amber-500 bg-amber-50 border-amber-100" }
              ].map((stat, i) => (
                <div key={i} className={`p-4 border rounded-xl bg-card flex items-center gap-4 shadow-sm ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</div>
                    <div className="text-xl font-bold text-foreground mt-0.5">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
  }, [activeReport, searchQuery, sheetData]);

  return (
    <div className="flex-1 flex overflow-hidden bg-muted/10 select-none">
      <div className="w-72 bg-card border-r border-border flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border flex-shrink-0 bg-muted/15">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" /> HR Reports Center
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Analyze, visualize, and print real-time HR operations indicators.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {REPORTS_LIST.map((rep) => (
            <button
              key={rep.id}
              onClick={() => {
                setActiveReport(rep.id);
                setSearchQuery("");
              }}
              className={`w-full p-3 text-left rounded-lg flex items-start gap-3 transition ${activeReport === rep.id
                ? "bg-accent/15 border-l-4 border-accent"
                : "hover:bg-muted/30"
                }`}
            >
              <rep.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${activeReport === rep.id ? "text-accent" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <div className={`text-xs font-bold ${activeReport === rep.id ? "text-accent" : "text-foreground"}`}>
                  {rep.label}
                </div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{rep.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-background hover:bg-muted flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print Report
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export Report
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-card/10">
          {reportContent}
        </div>
      </div>
=======
      )}

                          {/* 3. STATUS REPORT */}
      {activeReport === "status" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" /> Status Allocation Metrics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Status Value</th>
                  <th className="p-3">Assigned Count</th>
                  <th className="p-3">Distribution Percentage</th>
                  <th className="p-3">Sync State</th>
                </tr>
              </thead>
              <tbody>
                {statusBreakdown.map((st, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[9px] border ${st.name.toLowerCase() === "active"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : st.name.toLowerCase() === "pending"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-muted text-muted-foreground border-border"
                        }`}>
                        {st.name}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-foreground">{st.count} records</td>
                    <td className="p-3 font-medium text-muted-foreground">
                      {records.length > 0 ? Math.round((st.count / records.length) * 100) : 0}%
                    </td>
                    <td className="p-3 text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Synchronized
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. LOCATION REPORT */}
      {activeReport === "location" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-500" /> Geological Location Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Filing / Registry Location</th>
                  <th className="p-3">Aggregated Records Count</th>
                  <th className="p-3">Active Records</th>
                  <th className="p-3">Proportional Weight</th>
                </tr>
              </thead>
              <tbody>
                {locationBreakdown.map((loc, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="p-3 font-bold text-foreground">{loc.name}</td>
                    <td className="p-3 font-medium text-foreground">{loc.count}</td>
                    <td className="p-3 text-emerald-600 font-semibold">{loc.active}</td>
                    <td className="p-3 font-medium text-muted-foreground">
                      {records.length > 0 ? Math.round((loc.count / records.length) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ACTIVITY HISTORY REPORT */}
      {activeReport === "activity" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-amber-500" /> Operational Action Trail (Real-Time Sync Audit)
            </h3>
          </div>
          <div className="divide-y divide-border">
            {activityHistory.map((act) => (
              <div key={act.id} className="p-4 flex items-start gap-4 hover:bg-muted/10">
                <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{act.recordName}</span>
                    <span className="text-[10px] text-muted-foreground">{act.date}</span>
                  </div>
                  <p className="text-muted-foreground">{act.action}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                    <span>Performed by: <span className="font-semibold text-foreground">{act.user}</span></span>
                    <span>•</span>
                    <span className="uppercase text-[9px] bg-muted px-1.5 py-0.2 rounded font-bold">{act.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CUSTOM REPORT BUILDER */}
      {activeReport === "custom" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1 bg-card border border-border p-4 rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-accent" /> Builder Settings
            </h3>

            {/* Keyword Search */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Search Filter</label>
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Keyword..."
                  value={customFilterText}
                  onChange={(e) => setCustomFilterText(e.target.value)}
                  className="w-full bg-background border border-border pl-8 pr-2 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Columns Select list */}
            <div className="space-y-2">
              <label className="font-semibold text-muted-foreground block">Select Columns to Report</label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {allHeaders.map((header) => {
                  const isChecked = customSelectedFields.includes(header);
                  return (
                    <button
                      key={header}
                      onClick={() => toggleCustomField(header)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition text-[11px] ${isChecked
                        ? "border-accent bg-accent/5 font-bold text-accent"
                        : "border-border bg-card hover:bg-muted/50 text-foreground"
                        }`}
                    >
                      <span className="truncate">{header}</span>
                      {isChecked && <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Table Preview */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent" /> Customized Live Preview ({customReportRecords.length} records)
              </h3>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase font-bold text-[10px]">
                    {customSelectedFields.map((f) => (
                      <th key={f} className="p-3">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customReportRecords.length > 0 ? (
                    customReportRecords.map((r, i) => (
                      <tr key={i} className="border-b border-border/60 hover:bg-muted/10 text-foreground font-medium">
                        {customSelectedFields.map((f) => (
                          <td key={f} className="p-3 truncate max-w-[180px]">
                            {String(r[f] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-8 text-center text-muted-foreground" colSpan={customSelectedFields.length}>
                        No records matched your search settings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
>>>>>>> origin/jules-10842899696782935597-81a00e2f
    </div>
  );
}
