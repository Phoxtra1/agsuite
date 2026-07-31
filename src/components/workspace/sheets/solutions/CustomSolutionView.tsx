import { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Clock,
  TrendingUp,
  Settings,
  Share2,
  Users,
  Video,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Copy,
  FolderHeart,
  Save,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  GitBranch,
  Table,
  Sparkles
} from "lucide-react";

interface CustomSolutionViewProps {
  records: Record<string, any>[];
  customConfig: {
    solutionName: string;
    solutionType: string;
    headers: string[];
    forms: string[];
    metrics: any[];
    charts: any[];
    automations: any[];
    statusCol?: string;
    dateCol?: string;
    primaryCol?: string;
    version?: number;
    editHistory?: any[];
  };
  onUpdateConfig: (nextConfig: any) => void;
  onUpdateRecord: (rowIndex: number, field: string, value: any) => void;
  onAddRecord: (record: Record<string, any>) => void;
  onOpenMeetingModal: (prefilled: { title: string; participants: string }) => void;
}

export default function CustomSolutionView({
  records = [],
  customConfig,
  onUpdateConfig,
  onUpdateRecord,
  onAddRecord,
  onOpenMeetingModal
}: CustomSolutionViewProps) {
  // Identify Kanban status columns & date columns dynamically from config
  const statusField = customConfig.statusCol || "Status";
  const dateField = customConfig.dateCol;
  const primaryField = customConfig.primaryCol || customConfig.headers[0];

  const [activeTab, setActiveTab] = useState<"kanban" | "records" | "scheduler" | "forms" | "config">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Side Drawer state for adding/editing record
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [drawerForm, setDrawerForm] = useState<Record<string, any>>({});

  // Dynamic state for adding fields/rules inside configuration
  const [newHeaderName, setNewHeaderName] = useState("");
  const [newRuleTrigger, setNewRuleTrigger] = useState("");
  const [newRuleAction, setNewRuleAction] = useState("");

  const headers = customConfig.headers || [];

  // Unique Status values found in the status column of dataset (dynamic Kanban columns)
  const kanbanStatuses = useMemo(() => {
    const statuses = new Set<string>();
    records.forEach((r) => {
      const val = r[statusField];
      if (val) statuses.add(String(val).trim());
    });
    // Fallbacks if dataset has no rows
    if (statuses.size === 0) {
      if (customConfig.solutionType === "accounting") {
        return ["Cleared", "Pending", "Void"];
      } else if (customConfig.solutionType === "audit") {
        return ["Planned", "In Progress", "Completed"];
      } else if (customConfig.solutionType === "compliance") {
        return ["Compliant", "Non-Compliant", "Under Review"];
      }
      return ["To Do", "In Progress", "Done"];
    }
    return Array.from(statuses);
  }, [records, statusField, customConfig.solutionType]);

  // Kanban groups mapping
  const kanbanGroups = useMemo(() => {
    const groups: Record<string, typeof records> = {};
    kanbanStatuses.forEach((status) => {
      groups[status] = [];
    });
    records.forEach((rec) => {
      const val = String(rec[statusField] || "").trim();
      if (groups[val]) {
        groups[val].push(rec);
      } else if (kanbanStatuses.length > 0) {
        // fallback to first column
        groups[kanbanStatuses[0]].push(rec);
      }
    });
    return groups;
  }, [records, statusField, kanbanStatuses]);

  // Handle Pipeline status transition (Two-way sync)
  const moveKanbanCard = (rowIndex: number, nextStatus: string) => {
    onUpdateRecord(rowIndex, statusField, nextStatus);
  };

  // 1. Records Filtering & Search
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const query = search.toLowerCase();
      const matchSearch = Object.entries(rec).some(([key, val]) => {
        if (key.startsWith("_") || key === "rowIndex") return false;
        return String(val).toLowerCase().includes(query);
      });

      if (statusFilter === "all") return matchSearch;

      const statusVal = String(rec[statusField] || "");
      return matchSearch && statusVal.toLowerCase() === statusFilter.toLowerCase();
    });
  }, [records, search, statusField, statusFilter]);

  // Open Record Form inside Drawer
  const openAddDrawer = () => {
    const initialForm: Record<string, any> = {};
    headers.forEach((h) => {
      initialForm[h] = "";
    });
    setDrawerForm(initialForm);
    setDrawerMode("add");
    setEditingRowIndex(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (rec: Record<string, any>) => {
    const form: Record<string, any> = {};
    headers.forEach((h) => {
      form[h] = rec[h] ?? "";
    });
    setDrawerForm(form);
    setDrawerMode("edit");
    setEditingRowIndex(rec.rowIndex);
    setIsDrawerOpen(true);
  };

  const handleSaveDrawerRecord = () => {
    if (drawerMode === "add") {
      onAddRecord(drawerForm);
    } else if (drawerMode === "edit" && editingRowIndex !== null) {
      headers.forEach((h) => {
        onUpdateRecord(editingRowIndex, h, drawerForm[h]);
      });
    }
    setIsDrawerOpen(false);
  };

  // Dynamic Schema Config modification handlers (ON-THE-FLY editing without rebuild!)
  const handleAddHeader = () => {
    if (newHeaderName.trim() && !headers.includes(newHeaderName.trim())) {
      const updatedHeaders = [...headers, newHeaderName.trim()];
      onUpdateConfig({
        ...customConfig,
        headers: updatedHeaders,
        forms: [...(customConfig.forms || []), newHeaderName.trim()]
      });
      setNewHeaderName("");
    }
  };

  const handleRemoveHeader = (h: string) => {
    onUpdateConfig({
      ...customConfig,
      headers: headers.filter((x) => x !== h),
      forms: (customConfig.forms || []).filter((x) => x !== h)
    });
  };

  const handleAddMetric = () => {
    const updatedMetrics = [
      ...(customConfig.metrics || []),
      { label: "Custom Metric", formula: "COUNT", column: headers[0] || "Record ID" }
    ];
    onUpdateConfig({ ...customConfig, metrics: updatedMetrics });
  };

  const handleRemoveMetric = (idx: number) => {
    onUpdateConfig({
      ...customConfig,
      metrics: (customConfig.metrics || []).filter((_, i) => i !== idx)
    });
  };

  const handleUpdateMetric = (idx: number, key: string, val: any) => {
    const updated = [...(customConfig.metrics || [])];
    updated[idx] = { ...updated[idx], [key]: val };
    onUpdateConfig({ ...customConfig, metrics: updated });
  };

  const handleAddChart = () => {
    const updatedCharts = [
      ...(customConfig.charts || []),
      { title: "Custom Trend Chart", type: "bar", xKey: headers[0] || "", yKey: headers[1] || "" }
    ];
    onUpdateConfig({ ...customConfig, charts: updatedCharts });
  };

  const handleRemoveChart = (idx: number) => {
    onUpdateConfig({
      ...customConfig,
      charts: (customConfig.charts || []).filter((_, i) => i !== idx)
    });
  };

  const handleUpdateChart = (idx: number, key: string, val: any) => {
    const updated = [...(customConfig.charts || [])];
    updated[idx] = { ...updated[idx], [key]: val };
    onUpdateConfig({ ...customConfig, charts: updated });
  };

  const handleAddRule = () => {
    if (newRuleTrigger.trim() && newRuleAction.trim()) {
      const updatedAutomations = [
        ...(customConfig.automations || []),
        { trigger: newRuleTrigger.trim(), action: newRuleAction.trim(), enabled: true }
      ];
      onUpdateConfig({ ...customConfig, automations: updatedAutomations });
      setNewRuleTrigger("");
      setNewRuleAction("");
    }
  };

  const handleRemoveRule = (idx: number) => {
    onUpdateConfig({
      ...customConfig,
      automations: (customConfig.automations || []).filter((_, i) => i !== idx)
    });
  };

  const handleScheduleReview = (rec: any) => {
    onOpenMeetingModal({
      title: `Contextual Review: ${rec[primaryField]}`,
      participants: rec.Auditor || rec["Responsible Person"] || rec.Owner || ""
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden text-xs">

      {/* Top Banner & Tab Selectors */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderHeart className="h-4.5 w-4.5 text-accent" />
          <h2 className="font-bold text-foreground text-sm truncate max-w-[240px]">
            {customConfig.solutionName} <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded uppercase font-black tracking-wider ml-1.5">Connected</span>
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
              activeTab === "kanban" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" /> Pipeline (Kanban)
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
              activeTab === "records" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Table className="h-3.5 w-3.5" /> Registry Explorer
          </button>
          {dateField && (
            <button
              onClick={() => setActiveTab("scheduler")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                activeTab === "scheduler" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Event Schedules
            </button>
          )}
          <button
            onClick={() => setActiveTab("forms")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
              activeTab === "forms" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Public Input Form
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
              activeTab === "config" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Settings className="h-3.5 w-3.5" /> App Configurator
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Kanban Board View */}
        {activeTab === "kanban" && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-foreground capitalize">{statusField} Flow Control</h3>
                <p className="text-[11px] text-muted-foreground">Synchronized Kanban pipeline columns generated directly from spreadsheet records.</p>
              </div>
              <button
                onClick={openAddDrawer}
                className="bg-accent text-accent-foreground font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-accent/90"
              >
                <Plus className="h-3.5 w-3.5" /> New Card
              </button>
            </div>

            {/* Kanban Columns Grid */}
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start select-none">
              {kanbanStatuses.map((status) => (
                <div key={status} className="w-72 bg-muted/30 border border-border rounded-xl flex flex-col max-h-full flex-shrink-0 shadow-xs">
                  <div className="p-3 border-b flex items-center justify-between font-bold text-foreground bg-card rounded-t-xl">
                    <span className="truncate max-w-[180px]">{status}</span>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {kanbanGroups[status]?.length || 0}
                    </span>
                  </div>

                  <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[calc(70vh-140px)]">
                    {kanbanGroups[status]?.map((card) => (
                      <div
                        key={card.rowIndex}
                        onClick={() => openEditDrawer(card)}
                        className="p-3 rounded-lg border border-border bg-card shadow-xs hover:shadow-md transition cursor-pointer space-y-2 group"
                      >
                        <div className="font-bold text-foreground text-xs line-clamp-1">
                          {String(card[primaryField] || `Record #${card.rowIndex}`)}
                        </div>

                        {/* Display other metadata fields dynamically */}
                        <div className="text-[10px] text-muted-foreground space-y-1">
                          {headers.slice(0, 3).map((h) => {
                            if (h === primaryField || h === statusField) return null;
                            return (
                              <div key={h} className="truncate">
                                <span className="font-semibold">{h}:</span> {String(card[h] ?? "")}
                              </div>
                            );
                          })}
                        </div>

                        {/* Drag triggers simulated via fast-click status move dropdown */}
                        <div className="pt-2 border-t flex justify-between items-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-muted-foreground font-bold">Move:</span>
                          <div className="flex gap-1">
                            {kanbanStatuses.filter((s) => s !== status).slice(0, 2).map((nextS) => (
                              <button
                                key={nextS}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveKanbanCard(card.rowIndex, nextS);
                                }}
                                className="px-1.5 py-0.5 rounded bg-accent/10 hover:bg-accent/20 text-accent font-semibold"
                              >
                                {nextS}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!kanbanGroups[status] || kanbanGroups[status].length === 0) && (
                      <div className="text-center text-[10px] text-muted-foreground py-8 border-2 border-dashed border-border/40 rounded-lg">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Records Explorer */}
        {activeTab === "records" && (
          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
            {/* Search Header */}
            <div className="flex items-center justify-between gap-4 bg-card border border-border p-3.5 rounded-xl shadow-xs flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 max-w-md relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search synchronized ${customConfig.solutionType} records...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-1.5 border border-border rounded-lg bg-background font-semibold text-xs"
                >
                  <option value="all">All Statuses</option>
                  {kanbanStatuses.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <button
                  onClick={openAddDrawer}
                  className="bg-accent text-accent-foreground font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-accent/90 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase sticky top-0 bg-card">
                      {headers.map((h) => (
                        <th key={h} className="p-3.5">{h}</th>
                      ))}
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((rec, i) => (
                        <tr key={i} className="border-b border-border/60 hover:bg-muted/15 transition">
                          {headers.map((h) => (
                            <td key={h} className="p-3.5 text-foreground font-medium truncate max-w-[200px]">
                              {String(rec[h] ?? "")}
                            </td>
                          ))}
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => openEditDrawer(rec)}
                              className="text-accent hover:bg-accent/10 px-2 py-1 rounded transition inline-flex items-center gap-1 font-bold"
                            >
                              <Edit2 className="h-3 w-3" /> Edit Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={headers.length + 1} className="p-12 text-center text-muted-foreground">
                          No synchronized rows found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Contextual Scheduler Tab */}
        {activeTab === "scheduler" && dateField && (
          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
            <div className="border-b pb-3 flex-shrink-0">
              <h3 className="text-sm font-bold text-foreground">Schedules & Timeline Reviews</h3>
              <p className="text-[11px] text-muted-foreground">Dynamic date timelines gathered from `{dateField}` values mapped with context reviews.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {records.filter(r => r[dateField]).map((rec, i) => (
                <div key={i} className="p-4 border rounded-xl bg-card hover:border-accent/40 shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-xs">{rec[primaryField]}</span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold bg-muted text-muted-foreground">
                        {String(rec[statusField] || "Active")}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled: {String(rec[dateField])}</span>
                      {rec.Auditor && <span>Auditor: {rec.Auditor}</span>}
                      {rec["Responsible Person"] && <span>Responsible: {rec["Responsible Person"]}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleScheduleReview(rec)}
                    className="border border-border hover:border-accent hover:bg-accent/5 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold"
                  >
                    <Video className="h-3.5 w-3.5 text-accent" /> Schedule Context Meeting
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Forms Tab */}
        {activeTab === "forms" && (
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-sm p-6 space-y-6 h-fit">
              <div className="text-center space-y-1.5 border-b pb-4">
                <h3 className="font-bold text-foreground text-sm flex items-center justify-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-accent" /> {customConfig.solutionName} Public Entry Form
                </h3>
                <p className="text-[11px] text-muted-foreground">This interactive respondent form inserts rows directly into the connected spreadsheet view.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onAddRecord(drawerForm);
                  alert("Form entry submitted! record synchronized back to spreadsheet cells.");
                  const fresh: Record<string, any> = {};
                  headers.forEach((h) => { fresh[h] = ""; });
                  setDrawerForm(fresh);
                }}
                className="space-y-4"
              >
                {headers.map((h) => (
                  <div key={h} className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground block">{h}</label>
                    <input
                      type="text"
                      value={drawerForm[h] ?? ""}
                      onChange={(e) => setDrawerForm({ ...drawerForm, [h]: e.target.value })}
                      className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none"
                      placeholder={`Enter value for ${h}...`}
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground font-bold py-2 rounded-lg hover:bg-accent/90 flex items-center justify-center gap-1 shadow-sm"
                >
                  Submit Record <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dynamic Configurator Tab */}
        {activeTab === "config" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Fields Modifiers */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-4 text-xs">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-muted-foreground" /> Modify Spreadsheet Columns
                </h4>
                <p className="text-[11px] text-muted-foreground">Directly modify spreadsheet headers dynamically without losing cell records data.</p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New header name..."
                    value={newHeaderName}
                    onChange={(e) => setNewHeaderName(e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background focus:outline-none"
                  />
                  <button
                    onClick={handleAddHeader}
                    className="bg-accent text-accent-foreground px-3.5 py-1.5 rounded-lg font-bold hover:bg-accent/90"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {headers.map((h) => (
                    <div key={h} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border">
                      <span className="font-medium text-foreground">{h}</span>
                      <button onClick={() => handleRemoveHeader(h)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI Metrics Modifiers */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <TrendingUp className="h-4.5 w-4.5 text-muted-foreground" /> Configured KPIs
                  </h4>
                  <button onClick={handleAddMetric} className="text-accent hover:underline font-bold text-[11px] flex items-center gap-0.5">
                    <Plus className="h-3 w-3" /> Add KPI Metric
                  </button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {(customConfig.metrics || []).map((m, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={m.label}
                          onChange={(e) => handleUpdateMetric(idx, "label", e.target.value)}
                          className="font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-accent outline-none px-1"
                        />
                        <button onClick={() => handleRemoveMetric(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground font-semibold">Aggregation Formula</span>
                          <select
                            value={m.formula}
                            onChange={(e) => handleUpdateMetric(idx, "formula", e.target.value)}
                            className="w-full p-1 border rounded bg-background"
                          >
                            <option value="COUNT">COUNT ROWS</option>
                            <option value="SUM">SUM COLUMN</option>
                            <option value="AVG">AVERAGE COLUMN</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground font-semibold">Sheet Column</span>
                          <select
                            value={m.column}
                            onChange={(e) => handleUpdateMetric(idx, "column", e.target.value)}
                            className="w-full p-1 border rounded bg-background"
                          >
                            {headers.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts Modifiers */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <TrendingUp className="h-4.5 w-4.5 text-muted-foreground" /> Configured Charts
                  </h4>
                  <button onClick={handleAddChart} className="text-accent hover:underline font-bold text-[11px] flex items-center gap-0.5">
                    <Plus className="h-3 w-3" /> Add Chart
                  </button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {(customConfig.charts || []).map((c, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) => handleUpdateChart(idx, "title", e.target.value)}
                          className="font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-accent outline-none px-1"
                        />
                        <button onClick={() => handleRemoveChart(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground font-semibold">Chart Type</span>
                          <select
                            value={c.type}
                            onChange={(e) => handleUpdateChart(idx, "type", e.target.value)}
                            className="w-full p-1 border rounded bg-background"
                          >
                            <option value="bar">Bar Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="line">Line Chart</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground font-semibold">X Key (Dimension)</span>
                          <select
                            value={c.xKey}
                            onChange={(e) => handleUpdateChart(idx, "xKey", e.target.value)}
                            className="w-full p-1 border rounded bg-background"
                          >
                            {headers.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground font-semibold">Y Key (Value)</span>
                          <select
                            value={c.yKey}
                            onChange={(e) => handleUpdateChart(idx, "yKey", e.target.value)}
                            className="w-full p-1 border rounded bg-background"
                          >
                            {headers.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automations Rules Modifiers */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-4 text-xs">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-muted-foreground" /> Alert Automation triggers
                </h4>
                <p className="text-[11px] text-muted-foreground">Setup alerts, review triggers, or email reminders on status updates.</p>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Trigger keyword..."
                      value={newRuleTrigger}
                      onChange={(e) => setNewRuleTrigger(e.target.value)}
                      className="text-xs p-1.5 border rounded-lg bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Alert Action..."
                      value={newRuleAction}
                      onChange={(e) => setNewRuleAction(e.target.value)}
                      className="text-xs p-1.5 border rounded-lg bg-background"
                    />
                  </div>
                  <button
                    onClick={handleAddRule}
                    className="w-full bg-accent text-accent-foreground font-bold py-1.5 rounded-lg hover:bg-accent/90"
                  >
                    Add Automation Rule
                  </button>
                </div>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {(customConfig.automations || []).map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 text-[11px]">
                      <div>
                        <div className="font-bold text-foreground">Trigger: {a.trigger}</div>
                        <div className="text-muted-foreground">Action: {a.action}</div>
                      </div>
                      <button onClick={() => handleRemoveRule(idx)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Side Drawer details editor */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="fixed inset-0 bg-background/60 backdrop-blur-xs" onClick={() => setIsDrawerOpen(false)} />

          <div className="relative w-96 bg-card border-l border-border h-full shadow-2xl flex flex-col z-[160] text-xs p-6 overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4 flex-shrink-0">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                {drawerMode === "add" ? <Plus className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                {drawerMode === "add" ? "Add New Record" : "Edit Record Profile"}
              </h4>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {headers.map((h) => (
                <div key={h} className="space-y-1">
                  <label className="font-semibold text-muted-foreground uppercase text-[10px]">{h}</label>
                  <input
                    type="text"
                    value={drawerForm[h] ?? ""}
                    onChange={(e) => setDrawerForm({ ...drawerForm, [h]: e.target.value })}
                    className="w-full p-2 border border-border bg-background rounded-lg focus:outline-none"
                    placeholder={`Enter ${h}`}
                  />
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-end gap-2.5 flex-shrink-0">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 border border-border rounded-lg font-bold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDrawerRecord}
                className="px-5 py-2 bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
