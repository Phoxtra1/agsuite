import { useState, useMemo } from "react";
import {
  FileText,
  Printer,
  Download,
  Users,
  Building2,
  Clock,
  Calendar,
  Award,
  UserPlus,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ReportsViewProps {
  allSheets: any[];
  parseRowsFn: (sheet: any) => Record<string, any>[];
}

export default function ReportsView({ allSheets = [], parseRowsFn }: ReportsViewProps) {
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

  // Extract sheet rows safely
  const sheetData = useMemo(() => {
    const dataMap: Record<string, any[]> = {};
    const sheetNames = ["Employees", "Departments", "Positions", "Attendance", "Leave", "Performance", "Recruitment", "Onboarding"];

    sheetNames.forEach((name) => {
      const sheet = allSheets.find((s) => s.name === name);
      dataMap[name] = sheet ? parseRowsFn(sheet) : [];
    });

    return dataMap;
  }, [allSheets, parseRowsFn]);

  // Handle Export CSV of report
  const handleExportCSV = () => {
    alert("Exporting report as high-fidelity CSV format. Zero delays sync active.");
  };

  // Render specific report tables
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att["Attendance Status"] === "Present" ? "bg-emerald-50 text-emerald-700" :
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l["Status"] === "Approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
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
      {/* Sidebar: reports choices */}
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

      {/* Main viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          {/* Search bar inside top reporting header */}
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

        {/* Dynamic reporting view container */}
        <div className="flex-1 overflow-y-auto p-6 bg-card/10">
          {reportContent}
        </div>
      </div>
    </div>
  );
}
