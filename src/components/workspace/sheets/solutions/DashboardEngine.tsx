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
  Line,
  CartesianGrid
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
  Archive,
  Info
} from "lucide-react";
import { parseSheetRows } from "@/lib/workspace/sheets/smartData";

interface DashboardEngineProps {
  records: Record<string, any>[];
  
  solutionType: "CRM" | "Task" | "HR" | "Registry" | "Project" | "ProjectManagement" | "Custom";
        
  meetings?: any[];
  allSheets?: any[];
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function DashboardEngine({ records = [], solutionType, meetings = [], allSheets = [] }: DashboardEngineProps) {
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const columns = useMemo(() => {
    if (!records.length) return [];
    return Object.keys(records[0]).filter(k => k !== "rowIndex" && !k.startsWith("_"));
  }, [records]);

  // Multi-sheet data parser for HR Solutions
  const hrData = useMemo(() => {
    if (solutionType !== "HR" || !allSheets.length) return null;
    const findAndParse = (name: string) => {
      const sheet = allSheets.find((s) => s.name === name);
      return sheet ? parseSheetRows(sheet) : [];
    };

    allHeaders.forEach((h) => {
      const norm = h.toLowerCase().trim();
      if (!result.id && (norm === "id" || norm.includes("id") || norm.includes("code") || norm.includes("key") || norm.includes("number"))) {
        result.id = h;
      } else if (!result.name && (norm === "name" || norm === "title" || norm === "label" || norm.includes("name") || norm.includes("title"))) {
        result.name = h;
      } else if (!result.status && (norm === "status" || norm === "stage" || norm === "state" || norm.includes("status"))) {
        result.status = h;
      } else if (!result.category && (norm === "category" || norm === "type" || norm === "class" || norm === "group" || norm.includes("category") || norm.includes("type") || norm.includes("group"))) {
        result.category = h;
      } else if (!result.date && (norm.includes("date") || norm.includes("time") || norm.includes("created") || norm.includes("updated"))) {
        result.date = h;
      }

      // Classify numeric value columns (e.g. quantity, costs, value, hours, salary)
      if (norm.includes("quantity") || norm.includes("qty") || norm.includes("value") || norm.includes("usd") || norm.includes("price") || norm.includes("cost") || norm.includes("salary") || norm.includes("hours") || norm.includes("amount")) {
        result.numeric.push(h);
      }
    });

    if (!result.name && allHeaders.length > 0) {
      result.name = allHeaders[0];
    }

    return result;
  }, [allHeaders]);

  // Dynamic KPI Card Metrics Generation: Generate 3-5 non-empty relevant KPIs from available data
  const metrics = useMemo(() => {
    if (!records.length) return [];

    // Common global KPI: Total Row Count
    const baseMetrics = [
      { label: "Total Records", value: records.length, icon: FileText, color: "text-blue-500 bg-blue-50" }
    ];

    if (solutionType === "CRM") {
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

    if (solutionType === "Inventory") {
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

    if (solutionType === "HR") {
      const totalEmp = records.length;
      const uniqueDept = new Set(records.map((r) => r.Department).filter(Boolean));
      const payroll = records.reduce((sum, r) => sum + (Number(r["Base Salary"]) || 0), 0);

      return [
        { label: "Total Employees", value: totalEmp, icon: Users, color: "text-blue-500 bg-blue-50" },
        { label: "Departments", value: uniqueDept.size, icon: Layers, color: "text-purple-500 bg-purple-50" },
        { label: "Monthly Payroll", value: `$${payroll.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-50" }
      ];
    }

    if (solutionType === "Project") {
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

    // Dynamic Registry Dashboards: Extract KPI indicators completely based on parsed columns
    if (solutionType === "Registry" || solutionType === "Custom") {
      // 1. Categories Metric
      if (columnTypes.category) {
        const uniqueCats = new Set(records.map((r) => String(r[columnTypes.category] || "")).filter(Boolean));
        const categoryLabel = columnTypes.category.toLowerCase().endsWith("y")
          ? `${columnTypes.category.slice(0, -1)}ies`
          : `${columnTypes.category}s`;
        baseMetrics.push({
          label: `Unique ${categoryLabel}`,
          value: uniqueCats.size,
          icon: Layers,
          color: "text-purple-500 bg-purple-50"
        });
      }

      // 2. Status Metric
      if (columnTypes.status) {
        const uniqueStats = new Set(records.map((r) => String(r[columnTypes.status] || "")).filter(Boolean));
        baseMetrics.push({
          label: `Distinct Status Stages`,
          value: uniqueStats.size,
          icon: CheckCircle2,
          color: "text-emerald-500 bg-emerald-50"
        });
      }
      case "Project":
      case "ProjectManagement": {
        // Dynamic detection of Project Columns
        const totalProj = records.length;
        const budgetCol = columns.find(c => c.toLowerCase().includes("budget") || c.toLowerCase().includes("cost") || c.toLowerCase().includes("value"));
        const progressCol = columns.find(c => c.toLowerCase().includes("progress") || c.toLowerCase().includes("percent") || c.toLowerCase().includes("%") || c.toLowerCase().includes("complete"));
        const statusCol = columns.find(c => c.toLowerCase().includes("status") || c.toLowerCase().includes("stage"));

        const accumulatedBudget = budgetCol ? records.reduce((sum, r) => sum + (Number(r[budgetCol]) || 0), 0) : 0;
        const completedCount = statusCol ? records.filter(r => String(r[statusCol]).toLowerCase() === "completed" || String(r[statusCol]).toLowerCase() === "active").length : 0;

        const results = [
          { label: "Total Project Records", value: totalProj, icon: Briefcase, color: "text-blue-500 bg-blue-50" }
        ];
        if (budgetCol) {
          results.push({ label: "Allocated Budgets", value: `$${accumulatedBudget.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-50" });
        }
        if (statusCol) {
          results.push({ label: "Ongoing/Completed", value: completedCount, icon: CheckCircle2, color: "text-purple-500 bg-purple-50" });
        }
        return results;
      }
    }

    return baseMetrics;
  }, [records, solutionType, columnTypes, allHeaders]);

  // Aggregate Status counts for charting (only if status column is present)
  const statusChartData = useMemo(() => {
    if (solutionType === "CRM") {
      const counts: Record<string, number> = {};
      records.forEach((r) => {
        const statusKey = r.status || r.Status || "Unknown";
        counts[statusKey] = (counts[statusKey] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    if (solutionType === "Registry" || solutionType === "Custom") {
      if (!columnTypes.status) return [];
      const counts: Record<string, number> = {};
      records.forEach((r) => {
        const statusKey = String(r[columnTypes.status] || "Unassigned");
        counts[statusKey] = (counts[statusKey] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    return [];
  }, [records, solutionType, columnTypes.status]);

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
    } else if (solutionType === "Registry" || solutionType === "Custom") {
      // Group records by Category to show Category Distribution
      if (!columnTypes.category) return [];
      const counts: Record<string, number> = {};
      records.forEach((r) => {
        const cat = String(r[columnTypes.category] || "Unassigned");
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({
        name: name.slice(0, 15),
        value
      }));
    } else if (solutionType === "Project" || solutionType === "ProjectManagement") {
      const budgetCol = columns.find(c => c.toLowerCase().includes("budget") || c.toLowerCase().includes("cost") || c.toLowerCase().includes("value"));
      const nameCol = columns.find(c => c.toLowerCase().includes("name") || c.toLowerCase().includes("title") || c.toLowerCase().includes("id")) || columns[0];
      if (budgetCol && nameCol) {
        return records.map(r => ({
          name: String(r[nameCol] || "").slice(0, 15),
          value: Number(r[budgetCol]) || 0
        })).filter(d => d.value > 0);
      }
    }
    return [];
  }, [records, solutionType, columnTypes.category]);

  // Filter list of records for summary table
  const filteredRecords = useMemo(() => {
    const dataToUse = (solutionType === "HR" && hrData) ? hrData.employees : records;
    return dataToUse.filter((rec) => {
      const matchSearch = Object.values(rec).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      );
      if (filterValue === "all") return matchSearch;

      const statusField = solutionType === "CRM" ? "status" : columnTypes.status;
      if (!statusField) return matchSearch;
      return matchSearch && String(rec[statusField] || "") === filterValue;
    });
  }, [records, search, filterValue, solutionType, columnTypes.status]);

  const uniqueStatuses = useMemo(() => {
    const statusField = solutionType === "CRM" ? "Status" : columnTypes.status;
    if (!statusField) return [];
    return Array.from(new Set(records.map((r) => r[statusField]).filter(Boolean)));
  }, [records, solutionType, columnTypes.status]);

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
      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition flex items-center gap-4`}
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
      ) : (
        <div className="text-center p-8 bg-card rounded-xl border border-border italic text-xs text-muted-foreground">
          No metrics could be dynamically parsed from your spreadsheet data. Complete and enrich columns to unlock insights.
        </div>
      )}

      {/* Dynamic Charts Section */}
      {records.length > 0 && (statusChartData.length > 0 || valueChartData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status breakdown Chart (Rendered only if status data is available) */}
          {statusChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" /> Workflow / Status Distribution
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

          {/* Value / Numeric / Category Breakdown Chart (Rendered only if category/value data exists) */}
          {valueChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />{" "}
                {solutionType === "CRM"
                  ? "Deal Value Distribution"
                  : solutionType === "Inventory"
                  ? "Stock Level Distribution"
                  : solutionType === "Registry" || solutionType === "Custom"
                  ? `${columnTypes.category || "Category"} Distribution`
                  : "Salary Allocation"}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
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
                    className="text-xs pl-2.5 pr-8 py-1.5 rounded-lg border border-border bg-background focus:outline-none appearance-none cursor-pointer"
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
