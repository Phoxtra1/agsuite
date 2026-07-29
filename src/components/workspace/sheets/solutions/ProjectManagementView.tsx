import { useState, useMemo } from "react";
import {
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  Users,
  GitBranch,
  TrendingUp,
  Clock,
  Search,
  Plus,
  ArrowRight,
  User,
  DollarSign,
  MapPin,
  Edit2,
  AlertTriangle,
  FolderDot,
  FileText,
  Trash2,
  ChevronRight,
  ExternalLink,
  Milestone,
  CheckCircle,
  Video
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import type { Workbook } from "@/lib/workspace/sheets/documents";
import { parseSheetRows } from "@/lib/workspace/sheets/smartData";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

interface ProjectManagementViewProps {
  records: Record<string, any>[];
  sheetName: string;
  workbook: Workbook;
  onUpdateRecord: (rowIndex: number, field: string, value: any) => void;
  onAddRecord: (record: Record<string, any>) => void;
  onUpdateRecordByName: (sheetName: string, rowIndex: number, field: string, value: any) => void;
  onAddRecordByName: (sheetName: string, record: Record<string, any>) => void;
  onOpenMeetingModal: (prefilled: { title: string; participants: string }) => void;
  onScheduleEvent: (prefilled: { title: string; participants: string }) => void;
  onNotifyTeam: (message: string) => void;
}

export default function ProjectManagementView({
  records = [],
  sheetName,
  workbook,
  onUpdateRecord,
  onAddRecord,
  onUpdateRecordByName,
  onAddRecordByName,
  onOpenMeetingModal,
  onScheduleEvent,
  onNotifyTeam
}: ProjectManagementViewProps) {
  const [activeTab, setActiveTab] = useState<string>("projects");
  const [search, setSearch] = useState("");
  const [selectedProjectRow, setSelectedProjectRow] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  // Dynamic Column Analysis & Semantic Mapping
  const columns = useMemo(() => {
    if (!records.length) return [];
    return Object.keys(records[0]).filter(k => k !== "rowIndex" && !k.startsWith("_"));
  }, [records]);

  const mappings = useMemo(() => {
    const maps = {
      id: "",
      name: "",
      description: "",
      status: "",
      priority: "",
      progress: "",
      startDate: "",
      endDate: "",
      budget: "",
      manager: "",
      location: "",
      team: ""
    };

    columns.forEach(col => {
      const lower = col.toLowerCase();
      if (lower.includes("id") || lower === "code") {
        if (!maps.id) maps.id = col;
      } else if (lower.includes("name") || lower === "title" || lower === "project" || lower === "program") {
        if (!maps.name) maps.name = col;
      } else if (lower.includes("description") || lower === "desc" || lower === "summary" || lower === "notes") {
        if (!maps.description) maps.description = col;
      } else if (lower.includes("status") || lower === "stage" || lower === "state") {
        if (!maps.status) maps.status = col;
      } else if (lower.includes("priority") || lower === "urgency") {
        if (!maps.priority) maps.priority = col;
      } else if (lower.includes("progress") || lower.includes("percent") || lower.includes("%") || lower === "complete") {
        if (!maps.progress) maps.progress = col;
      } else if (lower.includes("start") || lower.includes("begin")) {
        if (!maps.startDate) maps.startDate = col;
      } else if (lower.includes("end") || lower.includes("due") || lower.includes("deadline") || lower.includes("finish")) {
        if (!maps.endDate) maps.endDate = col;
      } else if (lower.includes("budget") || lower.includes("cost") || lower.includes("value") || lower.includes("amount") || lower.includes("price") || lower.includes("$")) {
        if (!maps.budget) maps.budget = col;
      } else if (lower.includes("manager") || lower === "pm" || lower === "lead" || lower === "owner") {
        if (!maps.manager) maps.manager = col;
      } else if (lower.includes("location") || lower === "site" || lower === "region") {
        if (!maps.location) maps.location = col;
      } else if (lower.includes("team") || lower === "members") {
        if (!maps.team) maps.team = col;
      }
    });

    // Semantic Fallbacks if not uniquely matched
    if (!maps.name && columns.length > 0) maps.name = columns[0];
    if (!maps.id && columns.length > 1) {
      const candidate = columns.find(c => c.toLowerCase().includes("id") || c.toLowerCase().includes("num"));
      if (candidate) maps.id = candidate;
    }

    return maps;
  }, [columns]);

  // Determine features supported dynamically by actual spreadsheet data
  const supportedTabs = useMemo(() => {
    const tabs = [{ id: "projects", label: "Project Workspace", icon: Briefcase }];
    if (mappings.startDate || mappings.endDate) {
      tabs.push({ id: "timeline", label: "Timeline (Gantt)", icon: Clock });
    }
    if (mappings.status) {
      tabs.push({ id: "board", label: "Project Board", icon: FolderDot });
    }

    // Companion Sheets scan (Tasks, Milestones, Teams)
    const hasTasks = !!workbook.sheets.find(s => s.name === "Tasks" || s.name === "ProjectTasks") || columns.some(c => c.toLowerCase().includes("task"));
    if (hasTasks) {
      tabs.push({ id: "tasks", label: "Task Execution", icon: CheckCircle2 });
    }

    tabs.push({ id: "dashboard", label: "Dashboard", icon: TrendingUp });
    tabs.push({ id: "reports", label: "Reports", icon: FileText });
    return tabs;
  }, [mappings, workbook, columns]);

  // Guard active tab to fallback to projects if unsupported
  const verifiedActiveTab = useMemo(() => {
    if (supportedTabs.some(t => t.id === activeTab)) return activeTab;
    return "projects";
  }, [activeTab, supportedTabs]);

  // Query / Search Filter
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const query = search.toLowerCase();
      return columns.some(col => String(r[col] || "").toLowerCase().includes(query));
    });
  }, [records, columns, search]);

  const selectedProject = useMemo(() => {
    const row = selectedProjectRow !== null ? selectedProjectRow : records[0]?.rowIndex;
    if (row === undefined) return null;
    return records.find(r => r.rowIndex === row) || records[0] || null;
  }, [records, selectedProjectRow]);

  const openProjectProfile = (rowIdx: number) => {
    setSelectedProjectRow(rowIdx);
    const proj = records.find(r => r.rowIndex === rowIdx);
    if (proj) {
      setEditForm({ ...proj });
    }
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    if (!selectedProject) return;
    Object.entries(editForm).forEach(([key, val]) => {
      if (key !== "rowIndex" && !key.startsWith("_")) {
        onUpdateRecord(selectedProject.rowIndex, key, val);
      }
    });
    setIsEditing(false);
  };

  const handleAddNewProject = () => {
    const defaultNew: Record<string, any> = {};
    columns.forEach((col, idx) => {
      if (col === mappings.id) defaultNew[col] = `PRJ-0${records.length + 1}`;
      else if (col === mappings.name) defaultNew[col] = "New Project";
      else if (col === mappings.status) defaultNew[col] = "Planning";
      else if (col === mappings.priority) defaultNew[col] = "Medium";
      else if (col === mappings.progress) defaultNew[col] = 0;
      else if (col === mappings.budget) defaultNew[col] = 0;
      else defaultNew[col] = "";
    });
    if (Object.keys(defaultNew).length === 0) {
      defaultNew["Project Name"] = "New Project";
    }
    onAddRecord(defaultNew);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/5 font-sans select-none">
      {/* Dynamic Ribbon/Navigation Tabs */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {supportedTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                if (t.id === "projects") setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3.5 h-8 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                verifiedActiveTab === t.id
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Dynamic Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewProject}
            className="flex items-center gap-1.5 text-xs bg-accent text-accent-foreground font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-accent/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add Row
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 overflow-hidden flex">
        {/* VIEW 1: Project Workspace (Master-Detail List) */}
        {verifiedActiveTab === "projects" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left list of items */}
            <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-border space-y-3 flex-shrink-0">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {filteredRecords.map((r) => {
                  const idVal = mappings.id ? r[mappings.id] : `Row ${r.rowIndex}`;
                  const nameVal = r[mappings.name] || "Unnamed Project";
                  const statusVal = mappings.status ? r[mappings.status] : null;
                  const progressVal = mappings.progress ? Number(r[mappings.progress]) || 0 : null;

                  return (
                    <button
                      key={r.rowIndex}
                      onClick={() => openProjectProfile(r.rowIndex)}
                      className={`w-full p-4 text-left hover:bg-muted/25 transition flex flex-col gap-2 ${
                        selectedProject?.rowIndex === r.rowIndex ? "bg-accent/5 border-l-2 border-accent" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{idVal}</span>
                        {statusVal && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            statusVal === "Active" || statusVal === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {statusVal}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-foreground leading-tight truncate">{nameVal}</div>
                      {mappings.manager && r[mappings.manager] && (
                        <div className="text-[11px] text-muted-foreground truncate">Lead: {r[mappings.manager]}</div>
                      )}
                      {progressVal !== null && (
                        <div className="space-y-1 w-full pt-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Progress</span>
                            <span>{progressVal}%</span>
                          </div>
                          <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                            <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${progressVal}%` }} />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right details workspace */}
            <div className="flex-1 bg-card overflow-y-auto p-6">
              {selectedProject ? (
                <div className="max-w-3xl space-y-6">
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {mappings.id && (
                          <span className="text-xs bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded">
                            {selectedProject[mappings.id]}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-semibold">
                          Row ID: {selectedProject.rowIndex}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedProject[mappings.name] || "Unnamed Project"}
                      </h3>
                      {mappings.description && selectedProject[mappings.description] && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                          {selectedProject[mappings.description]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveProfile}
                            className="bg-emerald-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="bg-muted text-foreground font-semibold text-xs px-3.5 py-1.5 rounded-lg hover:bg-muted/80"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditForm({ ...selectedProject });
                            setIsEditing(true);
                          }}
                          className="flex items-center gap-1.5 border border-border text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-muted"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit Fields
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fully Dynamic Form Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {columns.map(col => {
                      const isId = col === mappings.id;
                      const val = selectedProject[col];

                      return (
                        <div key={col} className="p-3 border border-border/80 bg-muted/10 rounded-lg flex flex-col justify-center min-h-[55px]">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">{col}</span>
                          {isEditing && !isId ? (
                            col === mappings.progress ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="range" min="0" max="100"
                                  value={editForm[col] || 0}
                                  onChange={(e) => setEditForm({ ...editForm, [col]: Number(e.target.value) })}
                                  className="flex-1 accent-accent h-1.5 bg-muted rounded"
                                />
                                <span className="font-bold text-accent">{editForm[col] || 0}%</span>
                              </div>
                            ) : (
                              <input
                                type={col === mappings.budget ? "number" : "text"}
                                value={editForm[col] ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, [col]: col === mappings.budget ? Number(e.target.value) : e.target.value })}
                                className="w-full border border-border bg-background p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-accent text-xs"
                              />
                            )
                          ) : (
                            <span className="font-medium text-foreground">
                              {col === mappings.budget ? `$${(Number(val) || 0).toLocaleString()}` : String(val ?? "")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Slide bar for progress */}
                  {mappings.progress && !isEditing && (
                    <div className="p-4 border border-border bg-accent/5 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center font-semibold text-accent">
                        <span>Live Sync {mappings.progress} Slider</span>
                        <span>{selectedProject[mappings.progress]}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100"
                        value={selectedProject[mappings.progress] || 0}
                        onChange={(e) => onUpdateRecord(selectedProject.rowIndex, mappings.progress, Number(e.target.value))}
                        className="w-full h-1.5 accent-accent bg-muted rounded cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-border flex items-center gap-2">
                    <button
                      onClick={() =>
                        onOpenMeetingModal({
                          title: `Status Align on ${selectedProject[mappings.name] || "Project"}`,
                          participants: mappings.manager ? selectedProject[mappings.manager] || "" : ""
                        })
                      }
                      className="bg-accent text-accent-foreground font-semibold text-xs px-3.5 py-2 rounded-lg hover:bg-accent/90"
                    >
                      Schedule Review Meeting
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 stroke-1 mb-2 text-muted-foreground/60" />
                  <span>No Projects loaded. Populate spreadsheet or click Create Solution.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Dynamic Timeline (Gantt) */}
        {verifiedActiveTab === "timeline" && (
          <DynamicTimelineView
            records={records}
            mappings={mappings}
          />
        )}

        {/* VIEW 3: Dynamic Kanban Project Board */}
        {verifiedActiveTab === "board" && (
          <DynamicKanbanBoardView
            records={records}
            mappings={mappings}
            onUpdateRecord={onUpdateRecord}
            onSelectRow={(row) => openProjectProfile(row)}
            onSwitchTab={() => setActiveTab("projects")}
          />
        )}

        {/* VIEW 4: Dynamic Task Execution Companion */}
        {verifiedActiveTab === "tasks" && (
          <DynamicTasksCompanionView
            workbook={workbook}
            mappings={mappings}
            onUpdateRecordByName={onUpdateRecordByName}
            onAddRecordByName={onAddRecordByName}
          />
        )}

        {/* VIEW 5: Dynamic Dashboard Visualizer */}
        {verifiedActiveTab === "dashboard" && (
          <DynamicDashboardVisualizer
            records={records}
            mappings={mappings}
            columns={columns}
          />
        )}

        {/* VIEW 6: Dynamic printable Executive Reports */}
        {verifiedActiveTab === "reports" && (
          <DynamicReportsView
            records={records}
            mappings={mappings}
            columns={columns}
          />
        )}
      </div>
    </div>
  );
}

// Sub-Component 1: Dynamic Timeline View
function DynamicTimelineView({ records, mappings }: { records: Record<string, any>[]; mappings: any }) {
  const ganttData = useMemo(() => {
    // Parse min & max dates found in datasets
    let minTime = Infinity;
    let maxTime = -Infinity;

    const list = records.map(r => {
      const startStr = r[mappings.startDate];
      const endStr = r[mappings.endDate];
      const progress = mappings.progress ? Number(r[mappings.progress]) || 0 : 0;

      const sDate = startStr ? new Date(startStr) : new Date();
      const eDate = endStr ? new Date(endStr) : new Date(sDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sTime = sDate.getTime();
      const eTime = eDate.getTime();

      if (sTime < minTime) minTime = sTime;
      if (eTime > maxTime) maxTime = eTime;

      return {
        id: r[mappings.id] || `Row ${r.rowIndex}`,
        name: r[mappings.name] || "Unnamed Item",
        sTime,
        eTime,
        progress,
        startStr: sDate.toLocaleDateString(),
        endStr: eDate.toLocaleDateString()
      };
    });

    if (minTime === Infinity || maxTime === -Infinity || minTime === maxTime) {
      minTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
      maxTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }

    const range = maxTime - minTime;

    return list.map(item => {
      const leftPercent = Math.max(0, Math.min(95, ((item.sTime - minTime) / range) * 100));
      const widthPercent = Math.max(5, Math.min(100 - leftPercent, ((item.eTime - item.sTime) / range) * 100));

      return {
        ...item,
        left: `${leftPercent.toFixed(1)}%`,
        width: `${widthPercent.toFixed(1)}%`
      };
    });
  }, [records, mappings]);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-card">
      <div className="border-b border-border pb-4">
        <h3 className="font-bold text-sm text-foreground">Spreadsheet-Driven Duration Timeline (Gantt)</h3>
        <p className="text-xs text-muted-foreground">Dynamic date calculations relative to active calendar ranges.</p>
      </div>

      <div className="space-y-6 max-w-5xl">
        {ganttData.map((item) => (
          <div key={item.id} className="border border-border/80 rounded-xl p-4 space-y-3 bg-muted/10 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-foreground">
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold text-muted-foreground">{item.id}</span>
                {item.name}
              </span>
              <span className="text-muted-foreground">{item.startStr} — {item.endStr}</span>
            </div>

            <div className="relative h-7 bg-muted/40 rounded-lg overflow-hidden border border-border/40">
              <div
                className="absolute h-full bg-accent/20 border-r-2 border-accent transition-all duration-300 flex items-center px-3"
                style={{ left: item.left, width: item.width }}
              >
                <span className="text-[10px] font-bold text-accent truncate">{item.progress}% Complete</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-Component 2: Dynamic Project Board (Kanban Column Tracker)
interface DynamicKanbanBoardViewProps {
  records: Record<string, any>[];
  mappings: any;
  onUpdateRecord: (rowIndex: number, field: string, value: any) => void;
  onSelectRow: (row: number) => void;
  onSwitchTab: () => void;
}
function DynamicKanbanBoardView({
  records,
  mappings,
  onUpdateRecord,
  onSelectRow,
  onSwitchTab
}: DynamicKanbanBoardViewProps) {
  // Get unique status values present dynamically in spreadsheet data
  const boardColumns = useMemo(() => {
    const list = Array.from(new Set(records.map(r => r[mappings.status]).filter(Boolean)));
    if (list.length === 0) return ["Planning", "Active", "Completed"];
    return list;
  }, [records, mappings.status]);

  const kanbanGroups = useMemo(() => {
    const groups: Record<string, typeof records> = {};
    boardColumns.forEach(col => {
      groups[col] = [];
    });
    records.forEach(r => {
      const st = r[mappings.status] || boardColumns[0];
      if (groups[st]) {
        groups[st].push(r);
      } else {
        groups[boardColumns[0]].push(r);
      }
    });
    return groups;
  }, [records, boardColumns, mappings.status]);

  return (
    <div className="flex-1 overflow-x-auto p-6 flex gap-4 items-start bg-muted/5">
      {boardColumns.map(col => (
        <div key={col} className="w-80 bg-card rounded-xl border border-border flex flex-col flex-shrink-0 max-h-full overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="font-bold text-xs text-foreground uppercase tracking-wide">{col}</span>
            <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2.5 py-0.5 rounded-full">
              {kanbanGroups[col]?.length || 0}
            </span>
          </div>

          <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[400px]">
            {kanbanGroups[col]?.map((item) => {
              const nameVal = item[mappings.name] || "Unnamed Item";
              const progressVal = mappings.progress ? Number(item[mappings.progress]) || 0 : null;

              return (
                <div
                  key={item.rowIndex}
                  onClick={() => {
                    onSelectRow(item.rowIndex);
                    onSwitchTab();
                  }}
                  className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-accent/50 cursor-pointer transition space-y-3"
                >
                  <div className="font-bold text-xs text-foreground leading-tight">{nameVal}</div>
                  {mappings.manager && item[mappings.manager] && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="truncate">{item[mappings.manager]}</span>
                    </div>
                  )}
                  {progressVal !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Completion</span>
                        <span>{progressVal}%</span>
                      </div>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className="bg-accent h-full rounded-full" style={{ width: `${progressVal}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
                    <span className="text-[10px] font-bold text-muted-foreground">Row {item.rowIndex}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIdx = boardColumns.indexOf(col);
                          if (currentIdx < boardColumns.length - 1) {
                            onUpdateRecord(item.rowIndex, mappings.status, boardColumns[currentIdx + 1]);
                          } else {
                            onUpdateRecord(item.rowIndex, mappings.status, boardColumns[0]);
                          }
                        }}
                        className="h-5 w-5 rounded bg-muted hover:bg-accent/10 hover:text-accent flex items-center justify-center text-muted-foreground"
                        title="Rotate / Advance Stage"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Sub-Component 3: Dynamic Tasks Companion View
interface DynamicTasksCompanionViewProps {
  workbook: Workbook;
  mappings: any;
  onUpdateRecordByName: (sheetName: string, rowIndex: number, field: string, value: any) => void;
  onAddRecordByName: (sheetName: string, record: Record<string, any>) => void;
}
function DynamicTasksCompanionView({
  workbook,
  mappings,
  onUpdateRecordByName,
  onAddRecordByName
}: DynamicTasksCompanionViewProps) {
  const [selectedProjId, setSelectedProjId] = useState<string>("all");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ name: "", assignedTo: "", dueDate: "", priority: "Medium" });

  const tasksSheet = useMemo(() => {
    return workbook.sheets.find(s => s.name === "Tasks" || s.name === "ProjectTasks");
  }, [workbook]);

  const taskRecords = useMemo(() => {
    if (!tasksSheet) return [];
    return parseSheetRows(tasksSheet);
  }, [tasksSheet]);

  const taskCols = useMemo(() => {
    if (taskRecords.length === 0) return [];
    return Object.keys(taskRecords[0]).filter(k => k !== "rowIndex" && !k.startsWith("_"));
  }, [taskRecords]);

  const filteredTasks = useMemo(() => {
    if (selectedProjId === "all") return taskRecords;
    return taskRecords.filter(t => {
      const pIdCol = taskCols.find(c => c.toLowerCase().includes("project id") || c.toLowerCase().includes("proj"));
      if (!pIdCol) return true;
      return String(t[pIdCol] || "").toLowerCase() === selectedProjId.toLowerCase();
    });
  }, [taskRecords, selectedProjId, taskCols]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksSheet) return;

    const payload: Record<string, any> = {};
    taskCols.forEach(col => {
      const lower = col.toLowerCase();
      if (lower.includes("id") && lower.includes("task")) payload[col] = `TSK-0${taskRecords.length + 1}`;
      else if (lower.includes("project id") || lower.includes("proj")) payload[col] = selectedProjId !== "all" ? selectedProjId : "PRJ-001";
      else if (lower.includes("name") || lower.includes("title")) payload[col] = newTaskForm.name;
      else if (lower.includes("assign")) payload[col] = newTaskForm.assignedTo;
      else if (lower.includes("due") || lower.includes("date")) payload[col] = newTaskForm.dueDate;
      else if (lower.includes("status")) payload[col] = "To Do";
      else if (lower.includes("priority")) payload[col] = newTaskForm.priority;
      else payload[col] = "";
    });

    onAddRecordByName(tasksSheet.name, payload);
    setShowAddTaskModal(false);
    setNewTaskForm({ name: "", assignedTo: "", dueDate: "", priority: "Medium" });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* List */}
      <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Filter Execution List</span>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="text-[10px] bg-accent text-accent-foreground font-semibold px-2 py-1 rounded"
          >
            <Plus className="h-3 w-3 inline mr-0.5" /> Add Task
          </button>
        </div>
        <div className="divide-y divide-border/60">
          <button
            onClick={() => setSelectedProjId("all")}
            className={`w-full p-3.5 text-left text-xs font-bold hover:bg-muted/30 transition ${
              selectedProjId === "all" ? "bg-accent/5 text-accent" : "text-foreground"
            }`}
          >
            All Collective Tasks ({taskRecords.length})
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card p-6 overflow-y-auto space-y-4">
        <h3 className="font-bold text-sm text-foreground">Companion Tasks execution registry</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map(t => {
            const idCol = taskCols.find(c => c.toLowerCase().includes("task id") || c.toLowerCase().includes("id")) || "Task ID";
            const nameCol = taskCols.find(c => c.toLowerCase().includes("name") || c.toLowerCase().includes("title")) || "Task Name";
            const assignCol = taskCols.find(c => c.toLowerCase().includes("assign")) || "Assigned To";
            const statusCol = taskCols.find(c => c.toLowerCase().includes("status")) || "Status";
            const dueCol = taskCols.find(c => c.toLowerCase().includes("due") || c.toLowerCase().includes("date")) || "Due Date";

            return (
              <div key={t.rowIndex} className="p-4 border border-border rounded-xl bg-muted/10 flex flex-col justify-between gap-3 shadow-sm hover:border-accent/40 transition text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground">{t[idCol]}</span>
                    {statusCol && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        t[statusCol] === "Completed" || t[statusCol] === "Done" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {t[statusCol]}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-foreground text-xs leading-snug">{t[nameCol]}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                  <span>Assignee: <strong className="text-foreground">{t[assignCol] || "Unassigned"}</strong></span>
                  <span>Due: <strong className="text-foreground">{t[dueCol] || "N/A"}</strong></span>
                </div>

                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => onUpdateRecordByName(tasksSheet!.name, t.rowIndex, statusCol, "Completed")}
                    className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-bold text-[9px]"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => onUpdateRecordByName(tasksSheet!.name, t.rowIndex, statusCol, "In Progress")}
                    className="px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 font-bold text-[9px]"
                  >
                    Work On
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Modal Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 text-xs text-foreground space-y-4">
            <h4 className="font-bold text-sm">Add New Project Task</h4>
            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Task Name</label>
                <input
                  type="text" required
                  value={newTaskForm.name}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, name: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  placeholder="e.g. Prepare Proposal"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Assigned To</label>
                <input
                  type="text"
                  value={newTaskForm.assignedTo}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedTo: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  placeholder="Lead Staff"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Due Date</label>
                  <input
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 border border-border rounded hover:bg-muted font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-accent-foreground rounded font-semibold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-Component 4: Dynamic Dashboard Engine
function DynamicDashboardVisualizer({
  records,
  mappings,
  columns
}: { records: Record<string, any>[]; mappings: any; columns: string[] }) {
  const kpis = useMemo(() => {
    const total = records.length;
    let budgetSum = 0;
    let avgProgress = 0;
    let countProgress = 0;

    records.forEach(r => {
      if (mappings.budget) budgetSum += Number(r[mappings.budget]) || 0;
      if (mappings.progress && r[mappings.progress] !== undefined) {
        avgProgress += Number(r[mappings.progress]) || 0;
        countProgress++;
      }
    });

    return {
      total,
      budget: budgetSum,
      progress: countProgress > 0 ? Math.round(avgProgress / countProgress) : 0
    };
  }, [records, mappings]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Intelligent Project Management Analytics</h3>
          <p className="text-xs text-muted-foreground">Comprehensive real-time metrics parsed from synchronized spreadsheet matrices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 border border-border bg-card rounded-xl shadow-sm space-y-2">
          <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Total Rows</span>
          <strong className="text-lg font-bold text-foreground block pt-0.5">{kpis.total}</strong>
        </div>
        {mappings.budget && (
          <div className="p-4 border border-border bg-card rounded-xl shadow-sm space-y-2">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Accumulated Budget</span>
            <strong className="text-lg font-bold text-foreground block pt-0.5">${kpis.budget.toLocaleString()}</strong>
          </div>
        )}
        {mappings.progress && (
          <div className="p-4 border border-border bg-card rounded-xl shadow-sm space-y-2">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Average Completion</span>
            <strong className="text-lg font-bold text-foreground block pt-0.5">{kpis.progress}%</strong>
          </div>
        )}
      </div>

      {/* Render chart dynamically depending on whether budget column exists */}
      {mappings.budget && records.length > 0 && (
        <div className="p-5 border border-border bg-card rounded-xl shadow-sm max-w-2xl">
          <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4">Project Budgets Allocations</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={records.map(r => ({ name: r[mappings.name] || "Item", budget: Number(r[mappings.budget]) || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="budget" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-Component 5: Dynamic printable Reports View
function DynamicReportsView({
  records,
  mappings,
  columns
}: { records: Record<string, any>[]; mappings: any; columns: string[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl bg-card">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-foreground">Executive Status Report</h3>
          <p className="text-xs text-muted-foreground">Generated audit trail indicating project planning status rates and compliance statistics.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="text-xs font-bold bg-accent text-accent-foreground px-3.5 py-1.5 rounded-lg"
        >
          Print Report
        </button>
      </div>

      <div className="space-y-6 text-xs text-foreground">
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">1. Portfolios Overview</h4>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 font-bold border-b border-border text-muted-foreground uppercase text-[10px]">
                  {columns.slice(0, 5).map(col => (
                    <th key={col} className="p-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-muted/10 font-medium">
                    {columns.slice(0, 5).map(col => (
                      <td key={col} className="p-3">
                        {col === mappings.budget ? `$${(Number(r[col]) || 0).toLocaleString()}` : String(r[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
