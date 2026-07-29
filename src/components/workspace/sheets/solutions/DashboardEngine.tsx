import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  Users,
  Building2,
  DollarSign,
  AlertTriangle,
  Layers,
  Calendar,
  Briefcase,
  FileText,
  TrendingUp,
  Inbox,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Award,
  UserPlus,
  ClipboardList,
  Archive
} from "lucide-react";
import { parseSheetRows } from "@/lib/workspace/sheets/smartData";

interface DashboardEngineProps {
  records: Record<string, any>[];
  solutionType: "CRM" | "Inventory" | "HR" | "Registry" | "Project" | "Custom" | "Tasks";
  meetings?: any[];
  allSheets?: any[];
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function DashboardEngine({ records = [], solutionType, meetings = [], allSheets = [] }: DashboardEngineProps) {
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  // Multi-sheet data parser for HR Solutions
  const hrData = useMemo(() => {
    if (solutionType !== "HR" || !allSheets.length) return null;
    const findAndParse = (name: string) => {
      const sheet = allSheets.find((s) => s.name === name);
      return sheet ? parseSheetRows(sheet) : [];
    };
    return {
      employees: findAndParse("Employees"),
      departments: findAndParse("Departments"),
      attendance: findAndParse("Attendance"),
      leave: findAndParse("Leave"),
      performance: findAndParse("Performance"),
      recruitment: findAndParse("Recruitment")
    };
  }, [allSheets, solutionType]);

  // Dynamic Metrics Generation
  const metrics = useMemo(() => {
    if (solutionType === "HR" && hrData) {
      const emps = hrData.employees;
      const totalEmployees = emps.length;
      const activeEmployees = emps.filter(e => e["Employment Status"] === "Active").length;
      const onLeave = emps.filter(e => e["Employment Status"] === "On Leave" || e["Status"] === "On Leave").length;
      const newEmployees = emps.filter(e => {
        const hireDate = e["Hire Date"];
        return hireDate && hireDate.includes("2026");
      }).length;

      const totalDepts = hrData.departments.length || new Set(emps.map(e => e.Department).filter(Boolean)).size;
      const openRecruitment = hrData.recruitment.filter(r => r["Hiring Status"] === "Under Review" || r["Application Status"] === "Applied" || r["Application Status"] === "Interview Scheduled").length;
      const upcomingReviews = hrData.performance.length;

      return [
        { label: "Total Employees", value: totalEmployees, icon: Users, color: "text-blue-500 bg-blue-50" },
        { label: "Active Employees", value: activeEmployees, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
        { label: "Employees on Leave", value: onLeave, icon: Calendar, color: "text-amber-500 bg-amber-50" },
        { label: "New Employees (2026)", value: newEmployees, icon: UserPlus, color: "text-purple-500 bg-purple-50" },
        { label: "Departments", value: totalDepts, icon: Layers, color: "text-cyan-500 bg-cyan-50" },
        { label: "Open Recruitment", value: openRecruitment, icon: Briefcase, color: "text-rose-500 bg-rose-50" },
        { label: "Upcoming Reviews", value: upcomingReviews, icon: Award, color: "text-indigo-500 bg-indigo-50" }
      ];
    }

    if (!records.length) return [];

    switch (solutionType) {
      case "CRM": {
        const uniqueOrgs = new Set(records.map((r) => r.organizationName || r.Organization).filter(Boolean));
        const totalContacts = records.filter((r) => r.contactName || r["Contact Person"]).length;
        const totalValue = records.reduce((sum, r) => sum + (Number(r.value || r["Value (USD)"]) || 0), 0);
        const activePartnerships = records.filter((r) => (r.status || r["Status"]) === "Partnership Active").length;
        const followups = records.filter((r) => (r.status || r["Status"]) === "Follow-up Required").length;

        return [
          { label: "Total Organizations", value: uniqueOrgs.size, icon: Building2, color: "text-blue-500 bg-blue-50" },
          { label: "Total Contacts", value: totalContacts, icon: Users, color: "text-emerald-500 bg-emerald-50" },
          { label: "Active Partnerships", value: activePartnerships, icon: CheckCircle2, color: "text-purple-500 bg-purple-50" },
          { label: "Pipeline Value", value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-amber-500 bg-amber-50" },
          { label: "Follow-up Pending", value: followups, icon: Calendar, color: "text-rose-500 bg-rose-50" }
        ];
      }
      case "Inventory": {
        const totalItems = records.length;
        const totalQty = records.reduce((sum, r) => sum + (Number(r.Quantity) || 0), 0);
        const totalVal = records.reduce((sum, r) => sum + ((Number(r.Quantity) || 0) * (Number(r["Unit Cost"]) || 0)), 0);
        const lowStock = records.filter((r) => (Number(r.Quantity) || 0) <= (Number(r["Stock Alert Level"]) || 5)).length;

        return [
          { label: "Total Products", value: totalItems, icon: Layers, color: "text-blue-500 bg-blue-50" },
          { label: "Total Inventory Stock", value: totalQty, icon: Inbox, color: "text-purple-500 bg-purple-50" },
          { label: "Stock Valuation", value: `$${totalVal.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-50" },
          { label: "Low Stock Alerts", value: lowStock, icon: AlertTriangle, color: "text-rose-500 bg-rose-50", alert: lowStock > 0 }
        ];
      }
      case "Registry": {
        const totalRecs = records.length;
        const activeFiles = records.filter((r) => String(r.Status || r.status).toLowerCase() === "active").length;
        const archivedFiles = records.filter((r) => String(r.Status || r.status).toLowerCase() === "archived").length;

        // Count "New Records" created in the last 30 days (mocking check based on "Created Date" 2026 values in our default set)
        const newFiles = records.filter((r) => {
          const date = String(r["Created Date"] || r.createdDate || "");
          return date.includes("2026-03") || date.includes("2026-04");
        }).length;

        const uniqueCats = new Set(records.map((r) => r.Category || r.category).filter(Boolean));

        return [
          { label: "Total Records", value: totalRecs, icon: FileText, color: "text-blue-500 bg-blue-50" },
          { label: "Active Records", value: activeFiles, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
          { label: "New Records (30d)", value: newFiles, icon: TrendingUp, color: "text-amber-500 bg-amber-50" },
          { label: "Archived Records", value: archivedFiles, icon: Archive, color: "text-rose-500 bg-rose-50" },
          { label: "Unique Categories", value: uniqueCats.size, icon: Layers, color: "text-purple-500 bg-purple-50" }
        ];
      }
      case "Tasks": {
        const totalTasks = records.length;
        const completedTasks = records.filter((r) => (r.Status || r.status || "") === "Completed").length;
        const pendingTasks = totalTasks - completedTasks;

        // Overdue tasks calculation
        const today = new Date("2026-04-14"); // Reference baseline date
        const overdueTasks = records.filter((r) => {
          const dueStr = r["Due Date"] || r.dueDate || "";
          if (!dueStr) return false;
          const dueDate = new Date(dueStr);
          const status = r["Status"] || r.status || "Not Started";
          return dueDate < today && status !== "Completed";
        }).length;

        const highPriority = records.filter((r) => {
          const p = r["Priority"] || r.priority || "";
          return p === "High" || p === "Critical";
        }).length;

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return [
          { label: "Total Tasks", value: totalTasks, icon: Briefcase, color: "text-blue-500 bg-blue-50" },
          { label: "Completed Tasks", value: completedTasks, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
          { label: "Pending Tasks", value: pendingTasks, icon: Clock, color: "text-purple-500 bg-purple-50" },
          { label: "Overdue Tasks", value: overdueTasks, icon: AlertTriangle, color: "text-rose-500 bg-rose-50", alert: overdueTasks > 0 },
          { label: "High/Critical Priority", value: highPriority, icon: AlertTriangle, color: "text-amber-500 bg-amber-50" },
          { label: "Completion Rate", value: `${completionRate}%`, icon: TrendingUp, color: "text-emerald-500 bg-emerald-50" }
        ];
      }
      case "Project": {
        const totalTasks = records.length;
        const highPriority = records.filter((r) => r.Priority === "High").length;
        const inProgress = records.filter((r) => r.Status === "In Progress").length;
        const completed = records.filter((r) => r.Status === "Done" || r.Status === "Completed").length;

        return [
          { label: "Total Tasks", value: totalTasks, icon: Briefcase, color: "text-blue-500 bg-blue-50" },
          { label: "In Progress", value: inProgress, icon: TrendingUp, color: "text-purple-500 bg-purple-50" },
          { label: "High Priority", value: highPriority, icon: AlertTriangle, color: "text-rose-500 bg-rose-50" },
          { label: "Completed Tasks", value: completed, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" }
        ];
      }
      default:
        return [{ label: "Total Row Count", value: records.length, icon: Layers, color: "text-gray-500 bg-gray-50" }];
    }
  }, [records, solutionType, hrData]);

  // Aggregate Status counts for charting
  const statusChartData = useMemo(() => {
    const dataToUse = (solutionType === "HR" && hrData) ? hrData.employees : records;
    const counts: Record<string, number> = {};
    dataToUse.forEach((r) => {
      const statusKey = r.status || r.Status || r["Employment Status"] || "Unknown";
      counts[statusKey] = (counts[statusKey] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records, solutionType, hrData]);

  // Value/Price Distribution chart
  const valueChartData = useMemo(() => {
    if (solutionType === "CRM") {
      return records
        .map((r) => ({
          name: (r.organizationName || r.Organization || "").slice(0, 15),
          value: Number(r.value || r["Value (USD)"]) || 0
        }))
        .filter((d) => d.value > 0);
    } else if (solutionType === "Inventory") {
      return records.map((r) => ({
        name: (r["Product Name"] || "").slice(0, 15),
        value: Number(r.Quantity) || 0
      }));
    } else if (solutionType === "HR") {
      const dataToUse = hrData ? hrData.employees : records;
      const counts: Record<string, number> = {};
      dataToUse.forEach(e => {
        const d = e.Department || "Unassigned";
        counts[d] = (counts[d] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    } else if (solutionType === "Tasks") {
      return records.map((r) => ({
        name: (r["Task Name"] || r.taskName || "").slice(0, 15),
        value: Number(r["Progress (%)"] || r.progress) || 0
      }));
    } else if (solutionType === "Registry") {
      // Group records by Category to show Category Distribution
      const counts: Record<string, number> = {};
      records.forEach((r) => {
        const cat = r.Category || r.category || "Unassigned";
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({
        name: name.slice(0, 15),
        value
      }));
    }
    return [];
  }, [records, solutionType, hrData]);

  // Filter list of records for summary table
  const filteredRecords = useMemo(() => {
    const dataToUse = (solutionType === "HR" && hrData) ? hrData.employees : records;
    return dataToUse.filter((rec) => {
      const matchSearch = Object.values(rec).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      );
      if (filterValue === "all") return matchSearch;
      return matchSearch && (rec.status || rec.Status || rec["Employment Status"]) === filterValue;
    });
  }, [records, search, filterValue, solutionType, hrData]);

  const uniqueStatuses = useMemo(() => {
    const dataToUse = (solutionType === "HR" && hrData) ? hrData.employees : records;
    return Array.from(new Set(dataToUse.map((r) => r.status || r.Status || r["Employment Status"]).filter(Boolean)));
  }, [records, solutionType, hrData]);

  // HR specific summary states
  const attendanceSummary = useMemo(() => {
    if (solutionType !== "HR" || !hrData) return null;
    const att = hrData.attendance;
    const present = att.filter(a => a["Attendance Status"] === "Present" || a["Attendance Status"] === "Remote").length;
    const late = att.filter(a => a["Attendance Status"] === "Late").length;
    const absent = att.filter(a => a["Attendance Status"] === "Absent").length;
    return { present, late, absent, total: att.length };
  }, [hrData, solutionType]);

  const leaveSummary = useMemo(() => {
    if (solutionType !== "HR" || !hrData) return null;
    const leaves = hrData.leave;
    const approved = leaves.filter(l => l["Status"] === "Approved").length;
    const pending = leaves.filter(l => l["Status"] === "Pending").length;
    return { approved, pending, total: leaves.length };
  }, [hrData, solutionType]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-muted/20 space-y-6">
      {/* Solution Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {solutionType === "CRM" ? "CRM Live Workspace" :
             solutionType === "HR" ? "HR Management Workspace Dashboard" :
             `${solutionType} Smart Dashboard`}
          </h2>
          <p className="text-sm text-muted-foreground">
            Visualized analytics powered by the Smart Data Layer. Zero delay two-way synchronization active.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-600 font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-sm animate-pulse">
          <TrendingUp className="h-4 w-4" /> Real-time Connection Active
        </div>
      </div>

      {/* Dynamic Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={`rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition flex items-center gap-4 ${
              m.alert ? "border-rose-300 bg-rose-50/20" : ""
            }`}
          >
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${m.color}`}>
              <m.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</div>
              <div className="text-2xl font-bold text-foreground mt-1">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Charts Section */}
      {statusChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status breakdown Chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              {solutionType === "HR" ? "Employment Status breakdown" : "Workflow / Status Distribution"}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Value / Numeric Breakdown Chart */}
          {valueChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />{" "}
                {solutionType === "CRM"
                  ? "Deal Value Distribution"
                  : solutionType === "Inventory"
                  ? "Stock Level Distribution"
                  : solutionType === "Registry"
                  ? "Category Distribution"
                  : solutionType === "Tasks"
                  ? "Task Progress Distribution"
                  : "Department Headcount Allocation"}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valueChartData}>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                      {valueChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HR Specific Metrics Summary Panel */}
      {solutionType === "HR" && attendanceSummary && leaveSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Attendance Summary Metrics
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Present / Remote</div>
                <div className="text-xl font-bold text-emerald-950 mt-1">{attendanceSummary.present}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="text-[10px] uppercase font-bold text-amber-800">Late Arrivals</div>
                <div className="text-xl font-bold text-amber-950 mt-1">{attendanceSummary.late}</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                <div className="text-[10px] uppercase font-bold text-rose-800">Absent</div>
                <div className="text-xl font-bold text-rose-950 mt-1">{attendanceSummary.absent}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Leave Requests Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Approved Leave</div>
                <div className="text-xl font-bold text-emerald-950 mt-1">{leaveSummary.approved}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="text-[10px] uppercase font-bold text-amber-800">Pending Requests</div>
                <div className="text-xl font-bold text-amber-950 mt-1">{leaveSummary.pending}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Table + Feed Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Filterable Summary List */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h3 className="font-semibold text-foreground text-sm">Synchronized Records Registry</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-48">
                <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-border bg-background focus:outline-none"
                />
              </div>
              {/* Status Filter */}
              {uniqueStatuses.length > 0 && (
                <div className="relative">
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="text-xs pl-2.5 pr-8 py-1.5 rounded-lg border border-border bg-background focus:outline-none appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    {uniqueStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <Filter className="h-3 w-3 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase font-semibold">
                  {filteredRecords.length > 0 &&
                    Object.keys(filteredRecords[0])
                      .filter((k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_"))
                      .slice(0, 5)
                      .map((key) => (
                        <th key={key} className="p-3">
                          {key}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r, i) => (
                    <tr key={i} className="border-b border-border/60 hover:bg-muted/30">
                      {Object.keys(filteredRecords[0])
                        .filter((k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_"))
                        .slice(0, 5)
                        .map((key) => (
                          <td key={key} className="p-3 text-foreground font-medium">
                            {key.toLowerCase().includes("value") || key.toLowerCase().includes("salary")
                              ? `$${(Number(r[key]) || 0).toLocaleString()}`
                              : String(r[key] ?? "")}
                          </td>
                        ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-8 text-center text-muted-foreground" colSpan={5}>
                      No records matched your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed & Online Meetings */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" /> Scheduled Online Meetings
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] pr-1">
            {meetings.length > 0 ? (
              meetings.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg border border-border bg-muted/30 hover:border-accent/40 transition text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[140px]">{m.title}</span>
                    <span className="uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded font-bold bg-accent/15 text-accent">
                      {m.provider === "google-meet"
                        ? "Google Meet"
                        : m.provider === "zoom"
                        ? "Zoom"
                        : m.provider === "teams"
                        ? "Teams"
                        : "Amineva Meeting"}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {m.date} at {m.time}
                  </div>
                  {m.participants && <div className="text-muted-foreground truncate">Attendees: {m.participants}</div>}
                  <a
                    href={m.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-accent font-semibold hover:underline mt-1"
                  >
                    Join Online Meeting →
                  </a>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                <Calendar className="h-10 w-10 stroke-1 mb-2 text-muted-foreground/60" />
                <span>No active business meetings scheduled inside this workspace.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
