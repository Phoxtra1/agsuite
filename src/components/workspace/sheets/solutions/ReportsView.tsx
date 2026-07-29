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

interface ReportsViewProps {
  records?: Record<string, any>[];
  solutionType?: string;
  solutionName?: string;
  allSheets?: any[];
  parseRowsFn?: (sheet: any) => Record<string, any>[];
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function ReportsView({ records = [], solutionType = "General", solutionName, allSheets = [], parseRowsFn }: ReportsViewProps) {
  if (allSheets.length > 0 && parseRowsFn) {
    return <HrReportsView allSheets={allSheets} parseRowsFn={parseRowsFn} />;
  }
  return <GeneralReportsView records={records} solutionType={solutionName || solutionType} />;
}

function GeneralReportsView({ records = [], solutionType }: { records: Record<string, any>[]; solutionType: string }) {
  const [activeReport, setActiveReport] = useState<"summary" | "category">("summary");
  const [customSelectedFields, setCustomSelectedFields] = useState<string[]>([]);

  const allHeaders = useMemo(() => {
    if (records.length === 0) return [];
    return Object.keys(records[0]).filter(
      (k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_")
    );
  }, [records]);

  useEffect(() => {
    if (customSelectedFields.length === 0 && allHeaders.length > 0) {
      setCustomSelectedFields(allHeaders.slice(0, 5));
    }
  }, [allHeaders]);

  const summaryData = useMemo(() => {
    const total = records.length;
    const active = records.filter((r) => String(r.Status || r.status).toLowerCase() === "active").length;
    const pending = records.filter((r) => String(r.Status || r.status).toLowerCase() === "pending").length;
    const archived = records.filter((r) => String(r.Status || r.status).toLowerCase() === "archived").length;

    const cats = new Set(records.map((r) => r.Category || r.category).filter(Boolean));
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

  const handleExportCSV = () => {
    const headers = customSelectedFields.length > 0 ? customSelectedFields : allHeaders;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    records.forEach((r) => {
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-card p-1.5 border border-border rounded-xl">
        {[
          { id: "summary", label: "Registry Summary", icon: BarChart },
          { id: "category", label: "Category Report", icon: Tag },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition ${
              activeReport === tab.id
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

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
        </div>
      )}

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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function HrReportsView({
  allSheets,
  parseRowsFn
}: {
  allSheets: any[];
  parseRowsFn: (sheet: any) => Record<string, any>[];
}) {
  const [activeReport, setActiveReport] = useState<"directory" | "departments" | "attendance">("directory");
  const [searchQuery, setSearchQuery] = useState("");

  const REPORTS_LIST = [
    { id: "directory", label: "Employee Directory", desc: "Detailed listing of active profiles and contacts.", icon: Users },
    { id: "departments", label: "Department Summary", desc: "Aggregated headcounts and distributions per unit.", icon: Building2 },
    { id: "attendance", label: "Attendance Report", desc: "Overview of punctuality, working hours, and statuses.", icon: Clock },
  ] as const;

  const sheetData = useMemo(() => {
    const dataMap: Record<string, any[]> = {};
    const sheetNames = ["Employees", "Departments", "Attendance"];

    sheetNames.forEach((name) => {
      const sheet = allSheets.find((s) => s.name === name);
      dataMap[name] = sheet ? parseRowsFn(sheet) : [];
    });

    return dataMap;
  }, [allSheets, parseRowsFn]);

  const reportContent = useMemo(() => {
    const q = searchQuery.toLowerCase();

    switch (activeReport) {
      case "directory": {
        const list = (sheetData.Employees || []).filter((emp) =>
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground italic">No matches.</td>
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
        (sheetData.Employees || []).forEach((emp) => {
          const d = emp["Department"] || "Unassigned";
          counts[d] = (counts[d] || 0) + 1;
        });

        const list = (sheetData.Departments || []).filter((dept) =>
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
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground italic">No matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "attendance": {
        const list = (sheetData.Attendance || []).filter((att) =>
          String(att["Employee Name"] || "").toLowerCase().includes(q)
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {list.length > 0 ? (
                    list.map((att, i) => (
                      <tr key={i} className="hover:bg-muted/10 text-foreground font-medium">
                        <td className="p-3 pl-5 font-bold text-muted-foreground">{att["Employee ID"]}</td>
                        <td className="p-3 font-semibold">{att["Employee Name"]}</td>
                        <td className="p-3">{att["Date"]}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground italic">No matches.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
            Analyze and visualize real-time HR operations indicators.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {REPORTS_LIST.map((rep) => (
            <button
              key={rep.id}
              onClick={() => {
                setActiveReport(rep.id as any);
                setSearchQuery("");
              }}
              className={`w-full p-3 text-left rounded-lg flex items-start gap-3 transition ${
                activeReport === rep.id
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
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-background hover:bg-muted flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print Report
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-card/10">
          {reportContent}
        </div>
      </div>
    </div>
  );
}
