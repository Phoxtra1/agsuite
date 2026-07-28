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
  UserPlus
} from "lucide-react";
import { analyzeSheetData, parseSheetRows } from "@/lib/workspace/sheets/smartData";

interface DashboardEngineProps {
  records: Record<string, any>[];
  solutionType: "CRM" | "Inventory" | "HR" | "Registry" | "Project" | "Custom";
  meetings?: any[];
  allSheets?: any[];
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function DashboardEngine({ records = [], solutionType, meetings = [], allSheets = [] }: DashboardEngineProps) {
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const activeSheetObj = allSheets[0] || { name: "Sheet1", cells: {} };

  // AI-powered analysis of active spreadsheet columns
  const analysis = useMemo(() => {
    return analyzeSheetData(activeSheetObj);
  }, [activeSheetObj]);

  // Dynamic Metrics Generation adapted to detected columns
  const metrics = useMemo(() => {
    const totalCount = records.length;
    const cards = [];

    // 1. Core Total count card (adapted to solution name)
    const totalLabel = solutionType === "HR" ? "Total Employees" :
                       solutionType === "CRM" ? "Total Deals" : "Total Registered Records";
    cards.push({ label: totalLabel, value: totalCount, icon: Users, color: "text-blue-500 bg-blue-50" });

    // 2. Active status tracker (if Status column is present)
    if (analysis.hasStatus) {
      const statusColName = analysis.statusCol || "Status";
      const activeCount = records.filter(r => String(r[statusColName]).toLowerCase() === "active").length;
      cards.push({ label: "Active Records", value: activeCount, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" });
    }

    // 3. Departments (if Department column is present)
    if (analysis.hasDepartments && analysis.departmentCol) {
      const depts = new Set(records.map(r => r[analysis.departmentCol!]).filter(Boolean));
      cards.push({ label: "Unique Departments", value: depts.size, icon: Building2, color: "text-purple-500 bg-purple-50" });
    }

    // 4. Payroll / Value summaries (if Salary or Value exists)
    if (analysis.hasSalary && analysis.salaryCol) {
      const payroll = records.reduce((sum, r) => sum + (Number(r[analysis.salaryCol!]) || 0), 0);
      cards.push({ label: "Total Payroll (Monthly)", value: `$${payroll.toLocaleString()}`, icon: DollarSign, color: "text-cyan-500 bg-cyan-50" });
    } else if (analysis.hasValue) {
      const valueCol = analysis.allColumns.find(col => col.toLowerCase().includes("value") || col.toLowerCase().includes("budget") || col.toLowerCase().includes("$"));
      if (valueCol) {
        const totalVal = records.reduce((sum, r) => sum + (Number(r[valueCol]) || 0), 0);
        cards.push({ label: "Total Valuation", value: `$${totalVal.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-50" });
      }
    }

    // 5. Attendance & Leave trackers (only if those sections exist)
    if (analysis.hasAttendance) {
      const present = records.filter(r => String(r[analysis.attendanceStatusCol || "Attendance Status"]).toLowerCase() === "present").length;
      cards.push({ label: "Present Staff Today", value: present, icon: Clock, color: "text-indigo-500 bg-indigo-50" });
    }

    if (analysis.hasLeave) {
      const onLeave = records.filter(r => String(r[analysis.leaveTypeCol || "Leave Type"]).toLowerCase().includes("leave") || String(r["Status"]).toLowerCase() === "on leave").length;
      cards.push({ label: "Employees on Leave", value: onLeave, icon: Calendar, color: "text-amber-500 bg-amber-50" });
    }

    // 6. Recruitment Tracker (if Recruitment data exists)
    if (analysis.hasRecruitment) {
      const openPositions = records.filter(r => String(r[analysis.jobTitleCol || "Application Status"]).toLowerCase() === "applied" || String(r["Hiring Status"]).toLowerCase() === "under review").length;
      cards.push({ label: "Open Recruitments", value: openPositions, icon: UserPlus, color: "text-rose-500 bg-rose-50" });
    }

    // 7. Performance reviews tracker
    if (analysis.hasPerformance) {
      const reviewsCount = records.length;
      cards.push({ label: "Reviews Completed", value: reviewsCount, icon: Award, color: "text-amber-600 bg-amber-50" });
    }

    return cards;
  }, [records, solutionType, analysis]);

  // Aggregate Status counts for charting (if status exists)
  const statusChartData = useMemo(() => {
    if (!analysis.hasStatus) return [];
    const statusColName = analysis.statusCol || "Status";
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const statusKey = r[statusColName] || "Unknown";
      counts[statusKey] = (counts[statusKey] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records, analysis]);

  // Department Allocation chart data (only if Departments exist)
  const departmentChartData = useMemo(() => {
    if (!analysis.hasDepartments || !analysis.departmentCol) return [];
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const deptKey = r[analysis.departmentCol!] || "Unassigned";
      counts[deptKey] = (counts[deptKey] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records, analysis]);

  // Custom Value allocation chart (dynamic custom numeric columns)
  const salaryAllocationData = useMemo(() => {
    if (!analysis.hasSalary || !analysis.salaryCol) return [];
    return records
      .map((r) => ({
        name: String(r[analysis.employeeNameCol || "Name"] || r[analysis.employeeIdCol || "ID"] || "").slice(0, 15),
        value: Number(r[analysis.salaryCol!]) || 0
      }))
      .filter((d) => d.value > 0);
  }, [records, analysis]);

  // Filter list of records for summary table
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch = Object.values(rec).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      );
      if (filterValue === "all") return matchSearch;
      const statusColName = analysis.statusCol || "Status";
      return matchSearch && String(rec[statusColName]) === filterValue;
    });
  }, [records, search, filterValue, analysis]);

  const uniqueStatuses = useMemo(() => {
    if (!analysis.hasStatus) return [];
    const statusColName = analysis.statusCol || "Status";
    return Array.from(new Set(records.map((r) => r[statusColName]).filter(Boolean)));
  }, [records, analysis]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-muted/20 space-y-6">
      {/* Solution Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {solutionType === "HR" ? "HR Management Smart Dashboard" : `${solutionType} Dynamic Dashboard`}
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-generated indicators adapted dynamically from your master spreadsheet.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-600 font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-sm animate-pulse">
          <TrendingUp className="h-4 w-4" /> Live Sync Connection Active
        </div>
      </div>

      {/* Dynamic Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition flex items-center gap-4"
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

      {/* Dynamic Charts Section (Strictly hides empty/meaningless charts) */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Status distribution (only if Status column exists) */}
          {analysis.hasStatus && statusChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" /> Status Distribution
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
          )}

          {/* 2. Department distribution (only if Department column exists) */}
          {analysis.hasDepartments && departmentChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" /> Headcount by Department
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {departmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 3. Salary / Numeric allocations (only if relevant numerical exists) */}
          {analysis.hasSalary && salaryAllocationData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
              <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" /> Monthly Salary Allocation
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaryAllocationData}>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                      {salaryAllocationData.map((entry, index) => (
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
                  {analysis.allColumns.slice(0, 5).map((key) => (
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
                      {analysis.allColumns.slice(0, 5).map((key) => (
                        <td key={key} className="p-3 text-foreground font-medium truncate max-w-[150px]">
                          {key.toLowerCase().includes("salary") || key.toLowerCase().includes("value")
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
