import { useState, useMemo } from "react";
import {
  GitBranch,
  Calendar as CalendarIcon,
  Clock,
  Search,
  Plus,
  ArrowRight,
  User,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  BellRing,
  Bookmark,
  Users,
  Building2,
  MessageSquare,
  Sparkles,
  Zap
} from "lucide-react";

interface TasksViewProps {
  records: Record<string, any>[];
  onUpdateRecord: (rowIndex: number, field: string, value: any) => void;
  onAddRecord: (record: Record<string, any>) => void;
  onOpenMeetingModal: (prefilled: { title: string; participants: string }) => void;
  meetings?: any[];
}

interface TaskComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export default function TasksView({
  records = [],
  onUpdateRecord,
  onAddRecord,
  onOpenMeetingModal,
  meetings = []
}: TasksViewProps) {
  const [search, setSearch] = useState("");
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);

  // Filters state
  const [filterAssigned, setFilterAssigned] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [listSubView, setListSubView] = useState<"all" | "my" | "team" | "completed" | "overdue">("all");

  // Local comments state (mock database)
  const [comments, setComments] = useState<Record<number, TaskComment[]>>({
    1: [
      { id: "1", author: "Ebenezer Ocloo", text: "Please ensure JICA proposal includes the West African Agro expansion figures.", timestamp: "2026-04-10 10:15" },
      { id: "2", author: "Jules Agent", text: "On it, currently mapping the sector data inside Sheets.", timestamp: "2026-04-11 11:30" }
    ],
    2: [
      { id: "3", author: "Kofi Mensah", text: "Grace is preparing the leave management figures for the audit support.", timestamp: "2026-04-12 14:00" }
    ]
  });
  const [newCommentText, setNewCommentText] = useState("");

  // Local activity log state
  const [activityHistory, setActivityHistory] = useState<Record<number, string[]>>({
    1: [
      "Task generated from supported spreadsheet structure",
      "Status updated to In Progress",
      "Assigned To updated to Jules Agent"
    ],
    2: [
      "Task initialized with default template data",
      "Scheduled partnership review sync via Google Meet"
    ]
  });

  // Dynamic analysis of spreadsheet headers
  const sheetAnalysis = useMemo(() => {
    const headers = records.length > 0 ? Object.keys(records[0]).filter(k => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_")) : [];
    const lower = headers.map(h => h.toLowerCase().trim());

    // Find the exact header names matching capabilities
    const findHeader = (matches: string[]) => {
      return headers.find(h => matches.some(m => h.toLowerCase().trim() === m || h.toLowerCase().trim().includes(m))) || null;
    };

    const taskNameHeader = findHeader(["task name", "task", "name", "title"]) || headers[1] || headers[0] || "Task Name";
    const statusHeader = findHeader(["status", "state", "pipeline"]);
    const priorityHeader = findHeader(["priority", "level", "urgency"]);
    const assignedHeader = findHeader(["assigned to", "assignee", "owner", "assigned"]);
    const startDateHeader = findHeader(["start date", "starts"]);
    const dueDateHeader = findHeader(["due date", "deadline", "ends", "end date"]);
    const progressHeader = findHeader(["progress", "progress (%)", "completion"]);
    const categoryHeader = findHeader(["category", "type"]);
    const departmentHeader = findHeader(["department", "dept"]);
    const teamHeader = findHeader(["team"]);
    const descHeader = findHeader(["description", "desc"]);
    const notesHeader = findHeader(["notes", "note"]);
    const taskIdHeader = findHeader(["task id", "id"]);
    const completionHeader = findHeader(["completion date", "completed on"]);
    const estDurationHeader = findHeader(["estimated duration", "estimated hours", "est hours"]);
    const actDurationHeader = findHeader(["actual duration", "actual hours"]);
    const tagsHeader = findHeader(["tags", "tag"]);

    return {
      headers,
      taskNameHeader,
      statusHeader,
      priorityHeader,
      assignedHeader,
      startDateHeader,
      dueDateHeader,
      progressHeader,
      categoryHeader,
      departmentHeader,
      teamHeader,
      descHeader,
      notesHeader,
      taskIdHeader,
      completionHeader,
      estDurationHeader,
      actDurationHeader,
      tagsHeader,

      // Capabilities flags
      hasStatus: !!statusHeader,
      hasPriority: !!priorityHeader,
      hasAssigned: !!assignedHeader,
      hasDates: !!dueDateHeader || !!startDateHeader,
      hasProgress: !!progressHeader,
      hasCategory: !!categoryHeader,
      hasDepartment: !!departmentHeader,
      hasTeam: !!teamHeader,
      hasDescription: !!descHeader,
      hasNotes: !!notesHeader,
      hasTaskId: !!taskIdHeader,
      hasTags: !!tagsHeader
    };
  }, [records]);

  // Available Sub-tabs inside Tasks View generated dynamically based on capabilities
  const availableTabs = useMemo(() => {
    const tabs: { id: "kanban" | "calendar" | "timeline" | "list"; label: string; icon: any }[] = [];
    if (sheetAnalysis.hasStatus) {
      tabs.push({ id: "kanban", label: "Kanban Board", icon: GitBranch });
    }
    if (sheetAnalysis.hasDates) {
      tabs.push({ id: "calendar", label: "Calendar View", icon: CalendarIcon });
      tabs.push({ id: "timeline", label: "Timeline View", icon: Clock });
    }
    tabs.push({ id: "list", label: "Task List & Filters", icon: SlidersHorizontal });
    return tabs;
  }, [sheetAnalysis]);

  // Set default active sub-tab depending on what's available
  const [activeTab, setActiveTab] = useState<"kanban" | "calendar" | "timeline" | "list">("list");

  // Update activeTab if the current one is no longer available in the tabs list
  const resolvedTab = useMemo(() => {
    if (availableTabs.some(t => t.id === activeTab)) {
      return activeTab;
    }
    return availableTabs[0]?.id || "list";
  }, [activeTab, availableTabs]);

  const PRIORITIES = ["Low", "Medium", "High", "Critical"];

  const CATEGORIES = [
    "Administration",
    "Finance",
    "Marketing",
    "Sales",
    "Operations",
    "Human Resources",
    "IT",
    "Projects"
  ];

  // Helper: check if task is overdue
  const isOverdue = (task: Record<string, any>) => {
    if (!sheetAnalysis.dueDateHeader) return false;
    const dueStr = task[sheetAnalysis.dueDateHeader] || "";
    if (!dueStr) return false;
    const dueDate = new Date(dueStr);
    const today = new Date("2026-04-14"); // Baseline reference date for consistency
    const status = sheetAnalysis.statusHeader ? task[sheetAnalysis.statusHeader] : "Not Started";
    return dueDate < today && status !== "Completed";
  };

  // Map unique dropdown filter values dynamically
  const uniqueUsers = useMemo(() => {
    if (!sheetAnalysis.assignedHeader) return [];
    const users = new Set<string>();
    records.forEach((r) => {
      const u = r[sheetAnalysis.assignedHeader!];
      if (u) users.add(String(u));
    });
    return Array.from(users);
  }, [records, sheetAnalysis.assignedHeader]);

  const uniqueCategories = useMemo(() => {
    if (!sheetAnalysis.categoryHeader) return [];
    const cats = new Set<string>();
    records.forEach((r) => {
      const c = r[sheetAnalysis.categoryHeader!];
      if (c) cats.add(String(c));
    });
    return Array.from(cats);
  }, [records, sheetAnalysis.categoryHeader]);

  const uniqueDepartments = useMemo(() => {
    if (!sheetAnalysis.departmentHeader) return [];
    const depts = new Set<string>();
    records.forEach((r) => {
      const d = r[sheetAnalysis.departmentHeader!];
      if (d) depts.add(String(d));
    });
    return Array.from(depts);
  }, [records, sheetAnalysis.departmentHeader]);

  // Main task parsing
  const preparedTasks = useMemo(() => {
    return records.map((r, _idx) => {
      const rowIndex: number = typeof r.rowIndex === "number" ? r.rowIndex : _idx;
      const taskName = String(r[sheetAnalysis.taskNameHeader] || "");
      const status = sheetAnalysis.statusHeader ? String(r[sheetAnalysis.statusHeader] || "Not Started") : "";
      const priority = sheetAnalysis.priorityHeader ? String(r[sheetAnalysis.priorityHeader] || "Medium") : "";
      const assignedTo = sheetAnalysis.assignedHeader ? String(r[sheetAnalysis.assignedHeader] || "Unassigned") : "";
      const dueDate = sheetAnalysis.dueDateHeader ? String(r[sheetAnalysis.dueDateHeader] || "") : "";
      const startDate = sheetAnalysis.startDateHeader ? String(r[sheetAnalysis.startDateHeader] || "") : "";
      const progress = sheetAnalysis.progressHeader ? (parseFloat(r[sheetAnalysis.progressHeader]) || 0) : 0;
      const category = sheetAnalysis.categoryHeader ? String(r[sheetAnalysis.categoryHeader] || "Projects") : "";
      const department = sheetAnalysis.departmentHeader ? String(r[sheetAnalysis.departmentHeader] || "") : "";
      const team = sheetAnalysis.teamHeader ? String(r[sheetAnalysis.teamHeader] || "") : "";
      const tags = sheetAnalysis.tagsHeader ? String(r[sheetAnalysis.tagsHeader] || "") : "";
      const description = sheetAnalysis.descHeader ? String(r[sheetAnalysis.descHeader] || "") : "";
      const notes = sheetAnalysis.notesHeader ? String(r[sheetAnalysis.notesHeader] || "") : "";
      const taskId = sheetAnalysis.taskIdHeader ? String(r[sheetAnalysis.taskIdHeader] || "") : "";

      return {
        ...r,
        taskName,
        status,
        priority,
        assignedTo,
        dueDate,
        startDate,
        progress,
        category,
        department,
        team,
        tags,
        description,
        notes,
        taskId,
        rowIndex,
        _isOverdue: isOverdue(r)
      };
    });
  }, [records, sheetAnalysis]);

  // Apply search and filters
  const filteredTasks = useMemo(() => {
    return preparedTasks.filter((t) => {
      // 1. Text Search
      const query = search.toLowerCase();
      const matchSearch =
        t.taskName.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.taskId.toLowerCase().includes(query) ||
        t.tags.toLowerCase().includes(query);

      if (!matchSearch) return false;

      // 2. Sub view filters (My Tasks etc)
      if (listSubView === "my" && sheetAnalysis.hasAssigned && t.assignedTo !== "Jules Agent") return false;
      if (listSubView === "team" && !t.team) return false;
      if (listSubView === "completed" && sheetAnalysis.hasStatus && t.status !== "Completed") return false;
      if (listSubView === "overdue" && !t._isOverdue) return false;

      // 3. Dropdown filters
      if (filterAssigned !== "All" && t.assignedTo !== filterAssigned) return false;
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      if (filterStatus !== "All" && t.status !== filterStatus) return false;
      if (filterCategory !== "All" && t.category !== filterCategory) return false;
      if (filterDepartment !== "All" && t.department !== filterDepartment) return false;

      return true;
    });
  }, [preparedTasks, search, listSubView, filterAssigned, filterPriority, filterStatus, filterCategory, filterDepartment, sheetAnalysis]);

  // Kanban groups
  const KANBAN_COLUMNS = ["Not Started", "In Progress", "Waiting", "Under Review", "Completed"];
  const kanbanGroups = useMemo(() => {
    const groups: Record<string, typeof filteredTasks> = {};
    KANBAN_COLUMNS.forEach((col) => {
      groups[col] = [];
    });
    filteredTasks.forEach((t) => {
      let matchedCol = t.status || "Not Started";
      if (matchedCol === "Planned") matchedCol = "Not Started";
      if (matchedCol === "Blocked" || matchedCol === "Waiting") matchedCol = "Waiting";
      if (matchedCol === "Under Review") matchedCol = "Under Review";
      if (matchedCol === "Cancelled") matchedCol = "Completed";

      if (groups[matchedCol]) {
        groups[matchedCol].push(t);
      } else {
        groups["Not Started"].push(t);
      }
    });
    return groups;
  }, [filteredTasks]);

  const selectedTask = useMemo(() => {
    if (selectedTaskIndex === null) return null;
    return preparedTasks.find((t) => t.rowIndex === selectedTaskIndex) || null;
  }, [preparedTasks, selectedTaskIndex]);

  const handleMoveTaskStatus = (rowIndex: number, nextStatus: string) => {
    if (sheetAnalysis.statusHeader) {
      onUpdateRecord(rowIndex, sheetAnalysis.statusHeader, nextStatus);
    }
    // Auto progress update if completed
    if (nextStatus === "Completed" && sheetAnalysis.progressHeader) {
      onUpdateRecord(rowIndex, sheetAnalysis.progressHeader, 100);
    }
  };

  const handleAddComment = (e: React.FormEvent, rowIndex: number) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment: TaskComment = {
      id: String(Date.now()),
      author: "Current User",
      text: newCommentText,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " ")
    };
    setComments((prev) => ({
      ...prev,
      [rowIndex]: [...(prev[rowIndex] || []), newComment]
    }));
    setNewCommentText("");
  };

  const handleAddNewTask = () => {
    const nextIdNum = records.length + 1;
    const defaultNew: Record<string, any> = {};
    sheetAnalysis.headers.forEach(h => {
      defaultNew[h] = "";
    });

    // Populate key headers with mock defaults if available
    defaultNew[sheetAnalysis.taskNameHeader] = "New Task Name";
    if (sheetAnalysis.statusHeader) defaultNew[sheetAnalysis.statusHeader] = "Not Started";
    if (sheetAnalysis.priorityHeader) defaultNew[sheetAnalysis.priorityHeader] = "Medium";
    if (sheetAnalysis.assignedHeader) defaultNew[sheetAnalysis.assignedHeader] = "Jules Agent";
    if (sheetAnalysis.taskIdHeader) defaultNew[sheetAnalysis.taskIdHeader] = `TSK-00${nextIdNum}`;
    if (sheetAnalysis.progressHeader) defaultNew[sheetAnalysis.progressHeader] = 0;

    onAddRecord(defaultNew);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
      {/* Sub-Header Tabs */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-1.5">
          {availableTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setSelectedTaskIndex(null);
              }}
              className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-semibold transition ${
                resolvedTab === t.id
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Global Directory Search */}
        <div className="relative w-64">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Advanced dynamic filters based on sheet columns */}
      <div className="bg-card border-b border-border/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* List Sub views */}
          <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5 mr-2">
            <button
              onClick={() => setListSubView("all")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${listSubView === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              All Tasks
            </button>
            {sheetAnalysis.hasAssigned && (
              <button
                onClick={() => setListSubView("my")}
                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${listSubView === "my" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                My Tasks
              </button>
            )}
            {sheetAnalysis.hasStatus && (
              <button
                onClick={() => setListSubView("completed")}
                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${listSubView === "completed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Completed
              </button>
            )}
            {sheetAnalysis.hasDates && (
              <button
                onClick={() => setListSubView("overdue")}
                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${listSubView === "overdue" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Overdue
              </button>
            )}
          </div>

          {/* Render filters dynamically only if headers exist in sheet columns */}
          {sheetAnalysis.hasAssigned && (
            <select
              value={filterAssigned}
              onChange={(e) => setFilterAssigned(e.target.value)}
              className="border border-border rounded-md px-2 py-1 bg-background text-[11px] focus:outline-none"
            >
              <option value="All">Assigned: All</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          )}

          {sheetAnalysis.hasPriority && (
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-border rounded-md px-2 py-1 bg-background text-[11px] focus:outline-none"
            >
              <option value="All">Priority: All</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}

          {sheetAnalysis.hasCategory && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-border rounded-md px-2 py-1 bg-background text-[11px] focus:outline-none"
            >
              <option value="All">Category: All</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handleAddNewTask}
          className="bg-accent text-accent-foreground font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-accent/90 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Generate Task
        </button>
      </div>

      {/* Main Views Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kanban Board tab */}
        {resolvedTab === "kanban" && sheetAnalysis.hasStatus && (
          <div className="flex-1 overflow-x-auto p-6 flex gap-4 items-start select-none">
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col}
                className="w-72 bg-muted/40 rounded-xl border border-border flex flex-col flex-shrink-0 max-h-full overflow-hidden shadow-sm"
              >
                <div className="p-3 border-b border-border bg-card flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground truncate flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        col === "Not Started"
                          ? "bg-slate-400"
                          : col === "In Progress"
                          ? "bg-amber-500"
                          : col === "Waiting"
                          ? "bg-rose-400"
                          : col === "Under Review"
                          ? "bg-purple-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    {col}
                  </span>
                  <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-full">
                    {kanbanGroups[col]?.length || 0}
                  </span>
                </div>

                <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[400px]">
                  {kanbanGroups[col]?.map((task) => (
                    <div
                      key={task.rowIndex}
                      onClick={() => setSelectedTaskIndex(task.rowIndex)}
                      className="p-3 rounded-lg border border-border bg-card shadow-sm hover:border-accent/40 cursor-pointer transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          {task.taskId || `ROW-${task.rowIndex}`}
                        </span>
                        {sheetAnalysis.hasPriority && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              task.priority === "Critical"
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : task.priority === "High"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {task.priority || "Medium"}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-xs text-foreground line-clamp-2">
                        {task.taskName}
                      </div>
                      {sheetAnalysis.hasDescription && task.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      {sheetAnalysis.hasAssigned && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{task.assignedTo || "Unassigned"}</span>
                        </div>
                      )}

                      {/* Progress bar */}
                      {sheetAnalysis.hasProgress && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                            <span>Progress</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1">
                            <div className="bg-accent h-1 rounded-full" style={{ width: `${task.progress}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
                        <span className="text-[10px] font-semibold text-slate-500">
                          {sheetAnalysis.dueDateHeader ? `Due: ${task.dueDate}` : ""}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const curIdx = KANBAN_COLUMNS.indexOf(col);
                              if (curIdx < KANBAN_COLUMNS.length - 1) {
                                handleMoveTaskStatus(task.rowIndex, KANBAN_COLUMNS[curIdx + 1]);
                              }
                            }}
                            className="h-5 w-5 rounded bg-muted hover:bg-accent/15 hover:text-accent flex items-center justify-center text-muted-foreground transition"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {kanbanGroups[col]?.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-muted-foreground italic border-2 border-dashed border-border/40 rounded-lg">
                      No Tasks in {col}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calendar View tab */}
        {resolvedTab === "calendar" && sheetAnalysis.hasDates && (
          <div className="flex-1 p-6 flex flex-col overflow-hidden space-y-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
              <div className="md:col-span-2 border border-border bg-card rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                  <span className="font-bold text-xs text-accent">April 2026</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[10px] text-muted-foreground mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="py-1">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-muted/10 rounded p-1 min-h-[50px]" />
                  ))}
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `2026-04-${dayNum.toString().padStart(2, "0")}`;
                    const startTasks = preparedTasks.filter((t) => t.startDate === dateStr);
                    const dueTasks = preparedTasks.filter((t) => t.dueDate === dateStr);

                    return (
                      <div
                        key={dayNum}
                        className={`border border-border/40 rounded p-1 min-h-[55px] flex flex-col justify-between hover:bg-muted/30 transition ${
                          dayNum === 14 ? "bg-accent/5 border-accent/40 ring-1 ring-accent" : "bg-card"
                        }`}
                      >
                        <span className="text-[9px] font-bold text-foreground">{dayNum}</span>
                        <div className="space-y-0.5 overflow-hidden">
                          {startTasks.map((t) => (
                            <div
                              key={t.rowIndex}
                              onClick={() => setSelectedTaskIndex(t.rowIndex)}
                              className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1 py-0.5 rounded truncate cursor-pointer"
                            >
                              ▶ {t.taskName}
                            </div>
                          ))}
                          {dueTasks.map((t) => (
                            <div
                              key={t.rowIndex}
                              onClick={() => setSelectedTaskIndex(t.rowIndex)}
                              className="bg-rose-100 text-rose-800 text-[8px] font-bold px-1 py-0.5 rounded truncate cursor-pointer"
                            >
                              ⏳ {t.taskName}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deadline listing */}
              <div className="border border-border bg-card rounded-xl p-4 flex flex-col overflow-y-auto space-y-4">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-2 border-b border-border pb-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Upcoming Deadlines
                  </h4>
                  <div className="space-y-2">
                    {filteredTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.rowIndex}
                        onClick={() => setSelectedTaskIndex(task.rowIndex)}
                        className="p-2.5 rounded-lg border border-border bg-muted/20 hover:border-accent/40 cursor-pointer transition text-[11px]"
                      >
                        <div className="font-semibold text-foreground truncate">{task.taskName}</div>
                        <div className="text-muted-foreground flex justify-between mt-1">
                          <span>Starts: {task.startDate || "N/A"}</span>
                          <span className="font-bold text-rose-600">Due: {task.dueDate || "N/A"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {meetings.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-2 border-b border-border pb-1.5">
                      <CalendarIcon className="h-4 w-4 text-accent" /> Scheduled Meetings
                    </h4>
                    <div className="space-y-2 text-[11px]">
                      {meetings.map((m) => (
                        <div key={m.id} className="p-2 rounded-lg border bg-muted/10">
                          <div className="font-semibold">{m.title}</div>
                          <div className="text-muted-foreground text-[10px] mt-0.5">{m.date} &bull; {m.provider}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Gantt View tab */}
        {resolvedTab === "timeline" && sheetAnalysis.hasDates && (
          <div className="flex-1 p-6 flex flex-col space-y-4 overflow-hidden">
            <div className="flex-1 border border-border bg-card rounded-xl p-4 overflow-auto">
              <div className="min-w-[650px] space-y-4">
                <div className="grid grid-cols-12 gap-2 text-center text-[10px] font-bold text-muted-foreground border-b border-border pb-2 bg-muted/30 p-1.5 rounded-lg">
                  <div className="col-span-4 text-left pl-2">Task Title</div>
                  <div className="col-span-2">Average Progress</div>
                  <div className="col-span-6 text-left">April 2026 Visual Map</div>
                </div>

                <div className="divide-y divide-border/50">
                  {filteredTasks.map((t) => {
                    const startDayNum = parseInt(t.startDate?.split("-")[2] || "1");
                    const endDayNum = parseInt(t.dueDate?.split("-")[2] || "15");

                    const startPercent = Math.min(80, Math.max(0, (startDayNum / 30) * 100));
                    const widthPercent = Math.min(100 - startPercent, Math.max(15, ((endDayNum - startDayNum) / 30) * 100));

                    return (
                      <div
                        key={t.rowIndex}
                        onClick={() => setSelectedTaskIndex(t.rowIndex)}
                        className="grid grid-cols-12 gap-2 items-center py-3 hover:bg-muted/20 rounded cursor-pointer transition text-xs"
                      >
                        <div className="col-span-4 pl-2 font-bold text-foreground truncate" title={t.taskName}>
                          {t.taskName}
                        </div>
                        <div className="col-span-2 text-center font-bold text-emerald-600">
                          {sheetAnalysis.hasProgress ? `${t.progress}%` : "Tracked"}
                        </div>
                        <div className="col-span-6 relative h-6 bg-muted/40 rounded-md overflow-hidden border border-border/40">
                          <div
                            className={`absolute h-full rounded flex items-center pl-2 text-[9px] font-bold text-white transition ${
                              t.priority === "Critical" ? "bg-rose-500" : t.priority === "High" ? "bg-amber-500" : "bg-accent"
                            }`}
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`
                            }}
                          >
                            <span className="truncate pr-1">
                              {t.taskName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task List tab (always supported) */}
        {resolvedTab === "list" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3 pl-4">Task ID</th>
                    <th className="p-3">Task Name</th>
                    {sheetAnalysis.hasCategory && <th className="p-3">Category</th>}
                    {sheetAnalysis.hasAssigned && <th className="p-3">Assigned To</th>}
                    {sheetAnalysis.hasPriority && <th className="p-3">Priority</th>}
                    {sheetAnalysis.hasStatus && <th className="p-3">Status</th>}
                    {sheetAnalysis.hasDates && <th className="p-3">Due Date</th>}
                    {sheetAnalysis.hasProgress && <th className="p-3 text-center">Progress</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredTasks.map((t) => (
                    <tr
                      key={t.rowIndex}
                      onClick={() => setSelectedTaskIndex(t.rowIndex)}
                      className="hover:bg-muted/30 cursor-pointer transition"
                    >
                      <td className="p-3 pl-4 font-bold text-slate-500">
                        {t.taskId || `ROW-${t.rowIndex}`}
                      </td>
                      <td className="p-3 font-semibold text-foreground truncate max-w-[200px]">
                        {t.taskName}
                      </td>
                      {sheetAnalysis.hasCategory && (
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {t.category}
                          </span>
                        </td>
                      )}
                      {sheetAnalysis.hasAssigned && <td className="p-3 text-slate-600 font-medium">{t.assignedTo}</td>}
                      {sheetAnalysis.hasPriority && (
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${t.priority === "Critical" ? "bg-rose-100 text-rose-700" : t.priority === "High" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                            {t.priority}
                          </span>
                        </td>
                      )}
                      {sheetAnalysis.hasStatus && (
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${t.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {t.status}
                          </span>
                        </td>
                      )}
                      {sheetAnalysis.hasDates && <td className="p-3 font-semibold text-slate-500">{t.dueDate}</td>}
                      {sheetAnalysis.hasProgress && (
                        <td className="p-3 text-center">
                          <span className="font-bold text-emerald-600">{t.progress}%</span>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground italic">
                        No tasks found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Task Details Side drawer (Dynamic based on spreadsheet analysis) */}
        {selectedTask && (
          <div className="w-96 border-l border-border bg-card flex flex-col flex-shrink-0 shadow-lg z-10 animate-in slide-in-from-right-4 duration-150 overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Row {selectedTask.rowIndex} {selectedTask.taskId ? `• ${selectedTask.taskId}` : ""}
              </span>
              <button
                onClick={() => setSelectedTaskIndex(null)}
                className="text-xs font-semibold px-2.5 py-1 bg-muted rounded hover:bg-muted/80 text-foreground transition"
              >
                Close Drawer
              </button>
            </div>

            <div className="p-5 flex-1 space-y-6 text-xs">
              {/* Task name header */}
              <div>
                <input
                  type="text"
                  value={selectedTask.taskName}
                  onChange={(e) => onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.taskNameHeader, e.target.value)}
                  className="font-bold text-sm text-foreground border border-border px-2 py-1.5 rounded w-full focus:outline-none"
                />
                {sheetAnalysis.hasCategory && (
                  <div className="mt-2.5">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-bold uppercase">
                      {selectedTask.category}
                    </span>
                  </div>
                )}
              </div>

              {/* CRM link details (optional) */}
              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-accent" /> Associated CRM Connection
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Task mapped directly with Row {selectedTask.rowIndex} of the spreadsheet structure. Zero delay sync active.
                </p>
              </div>

              {/* Render edit controls dynamically based ONLY on sheet capabilities */}
              <div className="space-y-4">
                <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                  Task Fields (Spreadsheet Headers)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Status Selection (only if status column is profiled) */}
                  {sheetAnalysis.hasStatus && (
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">{sheetAnalysis.statusHeader}</label>
                      <select
                        value={selectedTask.status || "Not Started"}
                        onChange={(e) => handleMoveTaskStatus(selectedTask.rowIndex, e.target.value)}
                        className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                      >
                        {KANBAN_COLUMNS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Priority (only if priority column is profiled) */}
                  {sheetAnalysis.hasPriority && (
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">{sheetAnalysis.priorityHeader}</label>
                      <select
                        value={selectedTask.priority || "Medium"}
                        onChange={(e) => onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.priorityHeader!, e.target.value)}
                        className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Assignee (only if assigned to column is profiled) */}
                  {sheetAnalysis.hasAssigned && (
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">{sheetAnalysis.assignedHeader}</label>
                      <input
                        type="text"
                        value={selectedTask.assignedTo}
                        onChange={(e) => onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.assignedHeader!, e.target.value)}
                        className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Start date */}
                  {sheetAnalysis.startDateHeader && (
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">{sheetAnalysis.startDateHeader}</label>
                      <input
                        type="date"
                        value={selectedTask.startDate}
                        onChange={(e) => onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.startDateHeader!, e.target.value)}
                        className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Due date */}
                  {sheetAnalysis.dueDateHeader && (
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">{sheetAnalysis.dueDateHeader}</label>
                      <input
                        type="date"
                        value={selectedTask.dueDate}
                        onChange={(e) => onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.dueDateHeader!, e.target.value)}
                        className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Progress slider (only if progress column is profiled) */}
                  {sheetAnalysis.hasProgress && (
                    <div className="space-y-1 col-span-2">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                        <span>{sheetAnalysis.progressHeader}</span>
                        <span className="text-accent">{selectedTask.progress}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedTask.progress}
                        onChange={(e) => onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.progressHeader!, parseInt(e.target.value))}
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                {sheetAnalysis.hasDescription && (
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground text-[10px] uppercase">{sheetAnalysis.descHeader}</label>
                    <textarea
                      value={selectedTask.description}
                      onChange={(e) => onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.descHeader!, e.target.value)}
                      rows={2}
                      className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none"
                    />
                  </div>
                )}

                {/* Notes */}
                {sheetAnalysis.hasNotes && (
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground text-[10px] uppercase">{sheetAnalysis.notesHeader}</label>
                    <textarea
                      value={selectedTask.notes}
                      onChange={(e) => onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.notesHeader!, e.target.value)}
                      rows={2}
                      className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Comments (Discussions) */}
              <div className="space-y-3.5 pt-4 border-t border-border">
                <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-between pb-1">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-accent" /> Discussions ({comments[selectedTask.rowIndex]?.length || 0})
                  </span>
                </h4>
                <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
                  {comments[selectedTask.rowIndex]?.map((comment) => (
                    <div key={comment.id} className="p-2 rounded-lg bg-muted/40 border border-border/40 text-[11px]">
                      <div className="flex justify-between font-semibold">
                        <span>{comment.author}</span>
                        <span className="text-[9px] text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={(e) => handleAddComment(e, selectedTask.rowIndex)} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-[11px] bg-background focus:outline-none"
                  />
                  <button type="submit" className="bg-accent text-accent-foreground font-bold text-[10px] px-2.5 rounded-lg">
                    Send
                  </button>
                </form>
              </div>

              {/* Reminders sim */}
              {sheetAnalysis.hasDates && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      if (sheetAnalysis.notesHeader) {
                        onUpdateRecord(selectedTask.rowIndex, sheetAnalysis.notesHeader, "Deadline reminder alert simulated successfully.");
                      }
                    }}
                    className="w-full border border-amber-300 hover:bg-amber-50 text-amber-700 font-bold py-1.5 rounded-lg text-[10px] transition flex items-center justify-center gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> Dispatch Simulated Deadline Reminder
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
