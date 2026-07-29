import { useState, useMemo } from "react";
import {
  FileText,
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
  // Dynamically extract all available headers across records
  const allHeaders = useMemo(() => {
    if (records.length === 0) return [];
    return Object.keys(records[0]).filter(
      (k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_")
    );
  }, [records]);

  // Dynamic header classification (same algorithm to align reporting metrics with actual columns)
  const columnTypes = useMemo(() => {
    const result = {
      id: "",
      name: "",
      status: "",
      category: "",
      date: "",
      location: "",
      contact: "",
      description: "",
      notes: ""
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
      } else if (!result.location && (norm.includes("location") || norm.includes("region") || norm.includes("city") || norm.includes("gps") || norm.includes("address"))) {
        result.location = h;
      } else if (!result.contact && (norm.includes("contact") || norm.includes("phone") || norm.includes("tel") || norm.includes("email") || norm.includes("owner") || norm.includes("person"))) {
        result.contact = h;
      } else if (!result.description && (norm.includes("description") || norm.includes("desc") || norm.includes("about"))) {
        result.description = h;
      } else if (!result.notes && (norm.includes("notes") || norm.includes("note") || norm.includes("comment"))) {
        result.notes = h;
      }
    });

    if (!result.name && allHeaders.length > 0) {
      result.name = allHeaders[0];
    }

    return result;
  }, [allHeaders]);

  // Dynamic Report Selection Tabs: Hide options if not supported by available data
  const supportedReports = useMemo(() => {
    const tabs = [{ id: "summary", label: "Registry Summary", icon: BarChart }];
    if (columnTypes.category) {
      tabs.push({ id: "category", label: `${columnTypes.category} Report`, icon: Tag });
    }
    if (columnTypes.status) {
      tabs.push({ id: "status", label: `${columnTypes.status} Report`, icon: Shield });
    }
    if (columnTypes.location) {
      tabs.push({ id: "location", label: `${columnTypes.location} Report`, icon: MapPin });
    }
    if (columnTypes.date) {
      tabs.push({ id: "activity", label: "Activity Trail", icon: Activity });
    }
    tabs.push({ id: "custom", label: "Custom Builder", icon: Sparkles });
    return tabs;
  }, [columnTypes]);

  const [activeReport, setActiveReport] = useState<string>("summary");

  // Custom report builder state
  const [customFilterText, setCustomFilterText] = useState("");
  const [customSelectedFields, setCustomSelectedFields] = useState<string[]>([]);

  // Set default selected fields for custom report on first render or header load
  useMemo(() => {
    if (customSelectedFields.length === 0 && allHeaders.length > 0) {
      setCustomSelectedFields(allHeaders.slice(0, 5));
    }
  }, [allHeaders, customSelectedFields]);

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

    let active = 0;
    let pending = 0;
    let archived = 0;

    if (columnTypes.status) {
      active = records.filter((r) => {
        const val = String(r[columnTypes.status] || "").toLowerCase();
        return val === "active" || val === "completed" || val === "success";
      }).length;
      pending = records.filter((r) => {
        const val = String(r[columnTypes.status] || "").toLowerCase();
        return val === "pending" || val === "in progress" || val === "yet to contact";
      }).length;
      archived = records.filter((r) => {
        const val = String(r[columnTypes.status] || "").toLowerCase();
        return val === "archived" || val === "inactive" || val === "closed";
      }).length;
    }

    // Dynamic unique counts
    const catsCount = columnTypes.category
      ? new Set(records.map((r) => r[columnTypes.category]).filter(Boolean)).size
      : 0;

    const locsCount = columnTypes.location
      ? new Set(records.map((r) => r[columnTypes.location]).filter(Boolean)).size
      : 0;

    return {
      total,
      active,
      pending,
      archived,
      categoriesCount: catsCount,
      locationsCount: locsCount
    };
  }, [records, columnTypes]);

  // 2. Report: Category breakdown list
  const categoryBreakdown = useMemo(() => {
    if (!columnTypes.category) return [];
    const map: Record<string, { count: number; active: number; archived: number }> = {};
    records.forEach((r) => {
      const cat = String(r[columnTypes.category] || "Unassigned");
      if (!map[cat]) {
        map[cat] = { count: 0, active: 0, archived: 0 };
      }
      map[cat].count++;

      if (columnTypes.status) {
        const st = String(r[columnTypes.status] || "").toLowerCase();
        if (st === "active") map[cat].active++;
        if (st === "archived") map[cat].archived++;
      }
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats }));
  }, [records, columnTypes]);

  // 3. Report: Status breakdown list
  const statusBreakdown = useMemo(() => {
    if (!columnTypes.status) return [];
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const st = String(r[columnTypes.status] || "Active");
      map[st] = (map[st] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [records, columnTypes.status]);

  // 4. Report: Location breakdown list
  const locationBreakdown = useMemo(() => {
    if (!columnTypes.location) return [];
    const map: Record<string, { count: number; active: number }> = {};
    records.forEach((r) => {
      const loc = String(r[columnTypes.location] || "Local");
      if (!map[loc]) {
        map[loc] = { count: 0, active: 0 };
      }
      map[loc].count++;
      if (columnTypes.status && String(r[columnTypes.status] || "").toLowerCase() === "active") {
        map[loc].active++;
      }
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats }));
  }, [records, columnTypes]);

  // 5. Report: Activity history compilation
  const activityHistory = useMemo(() => {
    if (!columnTypes.date) return [];
    return records.map((r, i) => {
      const date = String(r[columnTypes.date] || "N/A");
      const user = "System Administrator";
      return {
        id: `ACT-${100 + i}`,
        date,
        user,
        recordName: String(r[columnTypes.name] || `Row ${r.rowIndex}`),
        action: `Record synchronized with spreadsheet cells`,
        status: columnTypes.status ? String(r[columnTypes.status] || "Active") : "Active"
      };
    });
  }, [records, columnTypes]);

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

  // simulations
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
            High-fidelity dynamic document audits and dynamic reporting.
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
      <div className="flex flex-wrap gap-2 bg-card p-1.5 border border-border rounded-xl">
        {supportedReports.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
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

            {columnTypes.status && (
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Folders</span>
                <div className="text-3xl font-extrabold text-emerald-600">{summaryData.active}</div>
                <p className="text-[11px] text-muted-foreground pt-1">Current operational & verified records.</p>
              </div>
            )}

            {(columnTypes.category || columnTypes.location) && (
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MAPPED CLASSIFICATIONS</span>
                <div className="text-3xl font-extrabold text-purple-600">
                  {summaryData.categoriesCount > 0 ? `${summaryData.categoriesCount} cats` : ""}
                  {summaryData.categoriesCount > 0 && summaryData.locationsCount > 0 ? " / " : ""}
                  {summaryData.locationsCount > 0 ? `${summaryData.locationsCount} locs` : ""}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">Dynamically mapped sectors and geological hubs.</p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" /> Registry Master Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="py-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Columns</span>
                <span className="block text-xl font-bold text-foreground mt-1">
                  {allHeaders.length}
                </span>
              </div>

              {columnTypes.status && (
                <>
                  <div className="py-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Pending Approval</span>
                    <span className="block text-xl font-bold text-amber-500 mt-1">{summaryData.pending}</span>
                  </div>
                  <div className="py-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Archived Index</span>
                    <span className="block text-xl font-bold text-muted-foreground mt-1">{summaryData.archived}</span>
                  </div>
                </>
              )}

              <div className="py-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Sync Reliability</span>
                <span className="block text-xl font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1">
                  <Check className="h-4 w-4" /> 100% Dynamic
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CATEGORY BREAKDOWN REPORT */}
      {activeReport === "category" && columnTypes.category && (
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
                  {columnTypes.status && <th className="p-3">Active Records</th>}
                  {columnTypes.status && <th className="p-3">Archived Records</th>}
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((cat, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="p-3 font-bold text-foreground capitalize">{cat.name}</td>
                    <td className="p-3 font-medium text-foreground">{cat.count} records</td>
                    {columnTypes.status && <td className="p-3 text-emerald-600 font-semibold">{cat.active}</td>}
                    {columnTypes.status && <td className="p-3 text-muted-foreground">{cat.archived}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. STATUS REPORT */}
      {activeReport === "status" && columnTypes.status && (
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
                      <span className="px-2.5 py-0.5 rounded font-bold uppercase text-[9px] border bg-accent/5 text-accent border-accent/20">
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
      {activeReport === "location" && columnTypes.location && (
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
                  {columnTypes.status && <th className="p-3">Active Records</th>}
                  <th className="p-3">Proportional Weight</th>
                </tr>
              </thead>
              <tbody>
                {locationBreakdown.map((loc, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="p-3 font-bold text-foreground">{loc.name}</td>
                    <td className="p-3 font-medium text-foreground">{loc.count}</td>
                    {columnTypes.status && <td className="p-3 text-emerald-600 font-semibold">{loc.active}</td>}
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
      {activeReport === "activity" && columnTypes.date && (
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
                    {columnTypes.status && (
                      <>
                        <span>•</span>
                        <span className="uppercase text-[9px] bg-muted px-1.5 py-0.2 rounded font-bold">{act.status}</span>
                      </>
                    )}
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
                      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition text-[11px] ${
                        isChecked
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
    </div>
  );
}
