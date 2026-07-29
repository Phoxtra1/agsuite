import { useState, useMemo } from "react";
import {
  GitBranch,
  Calendar as CalendarIcon,
  Clock,
  Layers,
  Search,
  Plus,
  ArrowRight,
  User,
  CheckCircle2,
  AlertTriangle,
  Play,
  Briefcase,
  SlidersHorizontal,
  BellRing,
  Bookmark,
  Users,
  FolderKanban,
  FileSpreadsheet,
  FileText,
  Building2,
  Trash2,
  MessageSquare,
  Sparkles,
  RefreshCcw,
  Zap
} from "lucide-react";

interface TasksViewProps {
  records: Record<string, any>[];
  onUpdateRecord: (rowIndex: number, field: string, value: any) => void;
  onAddRecord: (record: Record<string, any>) => void;
  onOpenMeetingModal: (prefilled: { title: string; participants: string }) => void;
  meetings?: any[];
}

// Comments store in state for each task
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
  const [activeTab, setActiveTab] = useState<"kanban" | "calendar" | "timeline" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  // Future expansion settings (Toggles)
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [timeTrackingEnabled, setTimeTrackingEnabled] = useState(false);
  const [subtasksEnabled, setSubtasksEnabled] = useState(false);

  const KANBAN_COLUMNS = [
    "Not Started",
    "In Progress",
    "Waiting",
    "Under Review",
    "Completed"
  ];

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
    const dueStr = task["Due Date"] || task.dueDate || "";
    if (!dueStr) return false;
    const dueDate = new Date(dueStr);
    const today = new Date("2026-04-14"); // Baseline reference date for project consistency
    const status = task["Status"] || task.status || "Not Started";
    return dueDate < today && status !== "Completed";
  };

  // Helper: map internal fields safely
  const getTaskField = (task: Record<string, any>, fields: string[]): string => {
    for (const f of fields) {
      if (task[f] !== undefined) return String(task[f]);
    }
    return "";
  };

  // Extract unique users, teams, and departments for filter dropdowns
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    records.forEach((r) => {
      const u = r["Assigned To"] || r.assignedTo;
      if (u) users.add(u);
    });
    return Array.from(users);
  }, [records]);

  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    records.forEach((r) => {
      const t = r["Team"] || r.team;
      if (t) teams.add(t);
    });
    return Array.from(teams);
  }, [records]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    records.forEach((r) => {
      const d = r["Department"] || r.department;
      if (d) depts.add(d);
    });
    return Array.from(depts);
  }, [records]);

  // Main task parsing & sorting
  const preparedTasks = useMemo(() => {
    return records.map((r) => {
      const taskName = getTaskField(r, ["Task Name", "Task", "Name", "Title"]);
      const status = getTaskField(r, ["Status", "status", "State"]);
      const priority = getTaskField(r, ["Priority", "priority", "Level"]);
      const assignedTo = getTaskField(r, ["Assigned To", "assignedTo", "Owner"]);
      const dueDate = getTaskField(r, ["Due Date", "dueDate", "End Date"]);
      const startDate = getTaskField(r, ["Start Date", "startDate"]);
      const progressStr = getTaskField(r, ["Progress (%)", "Progress", "progress"]);
      const progress = parseFloat(progressStr) || 0;
      const category = getTaskField(r, ["Category", "category"]);
      const department = getTaskField(r, ["Department", "department"]);
      const team = getTaskField(r, ["Team", "team"]);
      const tags = getTaskField(r, ["Tags", "tags"]);
      const description = getTaskField(r, ["Description", "description"]);
      const assignedBy = getTaskField(r, ["Assigned By", "assignedBy"]);
      const taskId = getTaskField(r, ["Task ID", "taskId", "ID", "Id"]);
      const notes = getTaskField(r, ["Notes", "notes"]);
      const completionDate = getTaskField(r, ["Completion Date", "completionDate"]);
      const estimatedDuration = parseFloat(getTaskField(r, ["Estimated Duration", "estimatedDuration"])) || 0;
      const actualDuration = parseFloat(getTaskField(r, ["Actual Duration", "actualDuration"])) || 0;

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
        assignedBy,
        taskId,
        notes,
        completionDate,
        estimatedDuration,
        actualDuration,
        _isOverdue: isOverdue({ ...r, Status: status, "Due Date": dueDate })
      };
    });
  }, [records]);

  // Apply filters and lists sub-view filter
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

      // 2. Main list sub-views (My, Team, Overdue, Completed)
      if (listSubView === "my" && t.assignedTo !== "Jules Agent") return false;
      if (listSubView === "team" && !t.team) return false;
      if (listSubView === "completed" && t.status !== "Completed") return false;
      if (listSubView === "overdue" && !t._isOverdue) return false;

      // 3. Dropdown filters
      if (filterAssigned !== "All" && t.assignedTo !== filterAssigned) return false;
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      if (filterStatus !== "All" && t.status !== filterStatus) return false;
      if (filterCategory !== "All" && t.category !== filterCategory) return false;
      if (filterDepartment !== "All" && t.department !== filterDepartment) return false;

      return true;
    });
  }, [preparedTasks, search, listSubView, filterAssigned, filterPriority, filterStatus, filterCategory, filterDepartment]);

  // Kanban tasks grouping
  const kanbanGroups = useMemo(() => {
    const groups: Record<string, typeof filteredTasks> = {};
    KANBAN_COLUMNS.forEach((col) => {
      groups[col] = [];
    });
    filteredTasks.forEach((t) => {
      let matchedCol = t.status || "Not Started";
      // Normalize statuses to match Columns
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

  // Task selection details
  const selectedTask = useMemo(() => {
    if (selectedTaskIndex === null) return null;
    return preparedTasks.find((t) => t.rowIndex === selectedTaskIndex) || null;
  }, [preparedTasks, selectedTaskIndex]);

  // Move task via button click (simulating Kanban drag and drop)
  const handleMoveTaskStatus = (rowIndex: number, nextStatus: string) => {
    onUpdateRecord(rowIndex, "Status", nextStatus);
    // Log Activity
    const dateStr = new Date().toISOString().slice(0, 16).replace("T", " ");
    setActivityHistory((prev) => ({
      ...prev,
      [rowIndex]: [
        ...(prev[rowIndex] || []),
        `Status updated to ${nextStatus} via Kanban interface [${dateStr}]`
      ]
    }));
    // Auto-update Progress (%) if completed
    if (nextStatus === "Completed") {
      onUpdateRecord(rowIndex, "Progress (%)", 100);
      onUpdateRecord(rowIndex, "Completion Date", "2026-04-14");
    }
  };

  // Add Comment
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

  // Add a fully customized new task
  const handleAddNewTask = () => {
    const nextIdNum = records.length + 1;
    const defaultNew = {
      "Task ID": `TSK-00${nextIdNum}`,
      "Task Name": "New Task Name",
      Description: "Add a brief description here...",
      Category: "Projects",
      "Assigned To": "Jules Agent",
      "Assigned By": "Ebenezer Ocloo",
      Department: "Projects",
      Team: "Development Team",
      Priority: "Medium",
      Status: "Not Started",
      "Start Date": "2026-04-14",
      "Due Date": "2026-04-21",
      "Completion Date": "",
      "Estimated Duration": 8,
      "Actual Duration": 0,
      "Progress (%)": 0,
      Tags: "new,tasks",
      Notes: ""
    };
    onAddRecord(defaultNew);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
      {/* Task Module Sub-Header */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[
            { id: "kanban", label: "Kanban Board", icon: GitBranch },
            { id: "calendar", label: "Calendar View", icon: CalendarIcon },
            { id: "timeline", label: "Timeline View", icon: Clock },
            { id: "list", label: "Task List & Filters", icon: SlidersHorizontal }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setSelectedTaskIndex(null);
              }}
              className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-semibold transition ${
                activeTab === t.id
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Global directory search */}
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

      {/* Advanced Filter Bar for List and General views */}
      <div className="bg-card border-b border-border/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* List Sub Views */}
          <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5 mr-2">
            {[
              { id: "all", label: "All Tasks" },
              { id: "my", label: "My Tasks" },
              { id: "team", label: "Team Tasks" },
              { id: "completed", label: "Completed" },
              { id: "overdue", label: "Overdue" }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setListSubView(sub.id as any)}
                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${
                  listSubView === sub.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Quick Dropdowns */}
          <select
            value={filterAssigned}
            onChange={(e) => setFilterAssigned(e.target.value)}
            className="border border-border rounded-md px-2 py-1 bg-background text-[11px] focus:outline-none"
          >
            <option value="All">Assigned: All</option>
            {uniqueUsers.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-border rounded-md px-2 py-1 bg-background text-[11px] focus:outline-none"
          >
            <option value="All">Priority: All</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-border rounded-md px-2 py-1 bg-background text-[11px] focus:outline-none"
          >
            <option value="All">Category: All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAddNewTask}
          className="bg-accent text-accent-foreground font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-accent/90 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Generate Task
        </button>
      </div>

      {/* Main Task view templates */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kanban Board View */}
        {activeTab === "kanban" && (
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
                      onClick={() => {
                        setSelectedTaskIndex(task.rowIndex);
                        setIsEditing(false);
                      }}
                      className="p-3 rounded-lg border border-border bg-card shadow-sm hover:border-accent/40 cursor-pointer transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          {task.taskId || "TSK-TASK"}
                        </span>
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
                      </div>
                      <div className="font-semibold text-xs text-foreground line-clamp-2">
                        {task.taskName}
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate">{task.assignedTo || "Unassigned"}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className="bg-accent h-1 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
                        <span className="text-[10px] font-semibold text-slate-500">
                          Due: {task.dueDate || "No Date"}
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
                            title="Move status forward"
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

        {/* Calendar View */}
        {activeTab === "calendar" && (
          <div className="flex-1 p-6 flex flex-col overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Interactive Tasks Scheduler</h3>
              <p className="text-xs text-muted-foreground">Tasks are grouped by Start Date and Due Date deadlines.</p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
              {/* Calendar Grid - Simple Interactive Month layout */}
              <div className="md:col-span-2 border border-border bg-card rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                  <span className="font-bold text-xs text-accent">April 2026</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Standard Calendar Mode</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[10px] text-muted-foreground mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {/* Mock April 2026 starts on Wednesday */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-muted/10 rounded p-1 min-h-[50px]" />
                  ))}
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `2026-04-${dayNum.toString().padStart(2, "0")}`;
                    // Filter tasks on this date
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
                              className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200"
                              title={`Starts: ${t.taskName}`}
                            >
                              ▶ {t.taskName}
                            </div>
                          ))}
                          {dueTasks.map((t) => (
                            <div
                              key={t.rowIndex}
                              onClick={() => setSelectedTaskIndex(t.rowIndex)}
                              className="bg-rose-100 text-rose-800 text-[8px] font-bold px-1 py-0.5 rounded truncate cursor-pointer hover:bg-rose-200"
                              title={`Due: ${t.taskName}`}
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

              {/* Deadline & Scheduled Meetings summary list */}
              <div className="border border-border bg-card rounded-xl p-4 flex flex-col overflow-y-auto space-y-4">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-2 border-b border-border pb-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Upcoming Activities
                  </h4>
                  <div className="space-y-2">
                    {filteredTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.rowIndex}
                        onClick={() => setSelectedTaskIndex(task.rowIndex)}
                        className="p-2.5 rounded-lg border border-border bg-muted/20 hover:border-accent/40 cursor-pointer transition text-[11px] space-y-1"
                      >
                        <div className="font-semibold text-foreground truncate">{task.taskName}</div>
                        <div className="text-muted-foreground flex items-center justify-between">
                          <span>Starts: {task.startDate || "N/A"}</span>
                          <span className="font-bold text-rose-600">Due: {task.dueDate || "N/A"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendar Online meetings integration */}
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-2 border-b border-border pb-1.5">
                    <CalendarIcon className="h-4 w-4 text-accent" /> Scheduled Task Meetings
                  </h4>
                  <div className="space-y-2">
                    {meetings.length > 0 ? (
                      meetings.map((m) => (
                        <div key={m.id} className="p-2.5 rounded-lg border border-border/80 bg-muted/10 text-[11px] space-y-1">
                          <div className="font-semibold text-foreground">{m.title}</div>
                          <div className="text-muted-foreground flex justify-between">
                            <span>{m.date}</span>
                            <span className="text-accent font-semibold">{m.provider}</span>
                          </div>
                          <a
                            href={m.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-accent font-bold hover:underline block pt-1"
                          >
                            Launch Meeting Link →
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-[10px] text-muted-foreground italic">
                        No active meetings scheduled for this task list. Click Collaborate menu to schedule!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Gantt View */}
        {activeTab === "timeline" && (
          <div className="flex-1 p-6 flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Lightweight Timeline & Gantt Chart</h3>
                <p className="text-xs text-muted-foreground">Suitable for visual schedule planning and resource allocations.</p>
              </div>
              <div className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded border font-semibold flex items-center gap-1.5">
                <Bookmark className="h-3 w-3" /> Baseline: Q2 2026
              </div>
            </div>

            <div className="flex-1 border border-border bg-card rounded-xl p-4 overflow-auto">
              <div className="min-w-[650px] space-y-4">
                {/* Timeline Header Row */}
                <div className="grid grid-cols-12 gap-2 text-center text-[10px] font-bold text-muted-foreground border-b border-border pb-2 bg-muted/30 p-1.5 rounded-lg">
                  <div className="col-span-4 text-left pl-2">Task Title</div>
                  <div className="col-span-2">Estimated Days</div>
                  <div className="col-span-2">Progress</div>
                  <div className="col-span-4 text-left">April 2026 Visual Map</div>
                </div>

                {/* Tasks Timeline Mapping */}
                <div className="divide-y divide-border/50">
                  {filteredTasks.map((t) => {
                    const durationStr = t["Estimated Duration"] || t.estimatedDuration || "8";
                    const duration = parseInt(durationStr) || 8;
                    const startDayNum = parseInt(t.startDate?.split("-")[2] || "1");
                    const endDayNum = parseInt(t.dueDate?.split("-")[2] || "15");

                    // Map days to timeline offsets
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
                        <div className="col-span-2 text-center font-medium text-slate-600">
                          {duration} Hrs ({Math.ceil(duration / 8)} Days)
                        </div>
                        <div className="col-span-2 text-center font-bold text-emerald-600">
                          {t.progress}%
                        </div>
                        <div className="col-span-4 relative h-6 bg-muted/40 rounded-md overflow-hidden border border-border/40">
                          {/* Colored visual bar */}
                          <div
                            className={`absolute h-full rounded flex items-center pl-2 text-[9px] font-bold text-white transition ${
                              t.priority === "Critical"
                                ? "bg-rose-500"
                                : t.priority === "High"
                                ? "bg-amber-500"
                                : "bg-accent"
                            }`}
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`
                            }}
                          >
                            <span className="truncate pr-1">
                              {t.progress}% Done
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

        {/* Tasks List View with Advanced Filters */}
        {activeTab === "list" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Task Registry List & Workloads</h3>
              <p className="text-xs text-muted-foreground">Displaying {filteredTasks.length} out of {preparedTasks.length} tasks.</p>
            </div>

            <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase font-bold text-[10px]">
                    <th className="p-3 pl-4">Task ID</th>
                    <th className="p-3">Task Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredTasks.map((t) => (
                    <tr
                      key={t.rowIndex}
                      onClick={() => {
                        setSelectedTaskIndex(t.rowIndex);
                        setIsEditing(false);
                      }}
                      className="hover:bg-muted/30 cursor-pointer transition"
                    >
                      <td className="p-3 pl-4 font-bold text-slate-500">{t.taskId}</td>
                      <td className="p-3 font-semibold text-foreground truncate max-w-[200px]" title={t.taskName}>
                        {t.taskName}
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {t.category || "Projects"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{t.assignedTo || "Unassigned"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            t.priority === "Critical"
                              ? "bg-rose-100 text-rose-700"
                              : t.priority === "High"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            t.status === "Completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : t.status === "In Progress"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-500">{t.dueDate}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="font-bold text-emerald-600 w-8 text-right">{t.progress}%</span>
                          <div className="w-16 bg-muted rounded-full h-1.5 hidden sm:block">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${t.progress}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground italic">
                        No tasks match your filter criteria or search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Task Details & Discussion Sidebar/Drawer */}
        {selectedTask && (
          <div className="w-96 border-l border-border bg-card flex flex-col flex-shrink-0 shadow-lg z-10 animate-in slide-in-from-right-4 duration-150 overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Row {selectedTask.rowIndex} &bull; {selectedTask.taskId}
              </span>
              <button
                onClick={() => setSelectedTaskIndex(null)}
                className="text-xs font-semibold px-2.5 py-1 bg-muted rounded hover:bg-muted/80 text-foreground transition"
              >
                Close Drawer
              </button>
            </div>

            <div className="p-5 flex-1 space-y-6">
              {/* Task name header */}
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={selectedTask.taskName}
                    onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Task Name", e.target.value)}
                    className="font-bold text-base text-foreground border border-border px-2 py-1 rounded w-full focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                ) : (
                  <h3 className="text-base font-bold text-foreground leading-snug">{selectedTask.taskName}</h3>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                    {selectedTask.category || "Projects"}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                    {selectedTask.department || "Projects"}
                  </span>
                </div>
              </div>

              {/* CRM / Project Association Indicator */}
              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-accent" /> Associated CRM Entity
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                    Linked
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Linked to Organization: <strong className="text-foreground">Japan International Cooperation Agency (JICA)</strong>
                  <br />
                  Linked CRM Record: <strong className="text-foreground">Prepare Partnership Proposal</strong>
                </p>
                <button
                  onClick={() =>
                    onOpenMeetingModal({
                      title: `Strategic Task Review with JICA Team`,
                      participants: "info@jica.go.jp"
                    })
                  }
                  className="w-full bg-accent/10 hover:bg-accent/15 text-accent font-bold py-1.5 rounded text-[10px] transition mt-1.5"
                >
                  Schedule Linked Client Meeting
                </button>
              </div>

              {/* Task Fields Matrix */}
              <div className="space-y-3.5 text-xs">
                <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                  Task Fields & Synchronizations
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Status selection */}
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground block text-[10px] uppercase">Status</label>
                    <select
                      value={selectedTask.status || "Not Started"}
                      onChange={(e) => handleMoveTaskStatus(selectedTask.rowIndex, e.target.value)}
                      className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                    >
                      {KANBAN_COLUMNS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                      <option value="Planned">Planned</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Waiting">Waiting</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Priority selection */}
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground block text-[10px] uppercase">Priority</label>
                    <select
                      value={selectedTask.priority || "Medium"}
                      onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Priority", e.target.value)}
                      className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none font-bold"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned To */}
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground block text-[10px] uppercase">Assigned To</label>
                    <input
                      type="text"
                      value={selectedTask.assignedTo}
                      onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Assigned To", e.target.value)}
                      className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                    />
                  </div>

                  {/* Assigned By */}
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground block text-[10px] uppercase">Assigned By</label>
                    <input
                      type="text"
                      value={selectedTask.assignedBy || "Ebenezer Ocloo"}
                      onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Assigned By", e.target.value)}
                      className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground block text-[10px] uppercase">Start Date</label>
                    <input
                      type="date"
                      value={selectedTask.startDate || ""}
                      onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Start Date", e.target.value)}
                      className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground block text-[10px] uppercase">Due Date</label>
                    <input
                      type="date"
                      value={selectedTask.dueDate || ""}
                      onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Due Date", e.target.value)}
                      className="w-full border border-border rounded-lg p-1.5 bg-background focus:outline-none"
                    />
                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-1 col-span-2">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                      <span>Progress (%)</span>
                      <span className="text-accent">{selectedTask.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedTask.progress}
                      onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Progress (%)", parseInt(e.target.value))}
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>
                </div>

                {/* Description Textarea */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground block text-[10px] uppercase">Description</label>
                  <textarea
                    value={selectedTask.description}
                    onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Description", e.target.value)}
                    rows={2}
                    className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none focus:ring-1 focus:ring-accent leading-normal"
                    placeholder="Provide a detailed task objective..."
                  />
                </div>

                {/* Notes Textarea */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground block text-[10px] uppercase">Notes</label>
                  <textarea
                    value={selectedTask.notes}
                    onChange={(e) => onUpdateRecord(selectedTask.rowIndex, "Notes", e.target.value)}
                    rows={2}
                    className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none focus:ring-1 focus:ring-accent leading-normal"
                    placeholder="Optional notes or references..."
                  />
                </div>
              </div>

              {/* Task Comments & Discussions */}
              <div className="space-y-3.5 pt-4 border-t border-border">
                <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-between pb-1">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-accent" /> Discussions ({comments[selectedTask.rowIndex]?.length || 0})
                  </span>
                  <span className="text-[9px] text-muted-foreground">Collaborative Feed</span>
                </h4>

                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {comments[selectedTask.rowIndex]?.map((comment) => (
                    <div key={comment.id} className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] space-y-1 leading-relaxed">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>{comment.author}</span>
                        <span className="text-[9px] text-muted-foreground font-normal">{comment.timestamp}</span>
                      </div>
                      <p className="text-slate-600 font-medium">{comment.text}</p>
                    </div>
                  ))}
                  {(!comments[selectedTask.rowIndex] || comments[selectedTask.rowIndex].length === 0) && (
                    <p className="text-center text-[10px] text-muted-foreground italic py-2">
                      No team discussions started yet. Begin the conversation below!
                    </p>
                  )}
                </div>

                <form onSubmit={(e) => handleAddComment(e, selectedTask.rowIndex)} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add feedback..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-[11px] bg-background focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-accent text-accent-foreground font-bold text-[10px] px-2.5 rounded-lg"
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Activity Logs & Reminders */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-1">
                  <BellRing className="h-3.5 w-3.5 text-amber-500" /> Activity Audits & Alarms
                </h4>
                <div className="space-y-1.5 text-[10px] text-muted-foreground max-h-[120px] overflow-y-auto pr-1">
                  {activityHistory[selectedTask.rowIndex]?.map((log, i) => (
                    <div key={i} className="flex items-start gap-1.5 leading-normal">
                      <span className="text-accent mt-0.5">&bull;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  {(!activityHistory[selectedTask.rowIndex] || activityHistory[selectedTask.rowIndex].length === 0) && (
                    <p className="italic text-[9px]">No historical audits created for this task yet.</p>
                  )}
                </div>

                {/* Reminder Simulation */}
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    onUpdateRecord(selectedTask.rowIndex, "Notes", `Reminder generated on ${todayStr} for approaching deadline.`);
                    setActivityHistory((prev) => ({
                      ...prev,
                      [selectedTask.rowIndex]: [
                        ...(prev[selectedTask.rowIndex] || []),
                        `Manual deadline reminder alert dispatch simulated successfully.`
                      ]
                    }));
                  }}
                  className="w-full border border-amber-300 hover:bg-amber-50 text-amber-700 font-bold py-1.5 rounded-lg text-[10px] transition flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> Dispatch Simulated Deadline Reminder
                </button>
              </div>

              {/* Future Modules Architecture Settings Mock Toggle Placeholders */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 pb-1">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Tasks Future Module Sandbox
                </h4>
                <div className="space-y-2 text-[11px] text-slate-600 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Recurring Tasks Pattern</span>
                    <button
                      type="button"
                      onClick={() => setRecurringEnabled(!recurringEnabled)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                        recurringEnabled ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {recurringEnabled ? "Enabled" : "Mock Off"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Subtasks & Checklists</span>
                    <button
                      type="button"
                      onClick={() => setSubtasksEnabled(!subtasksEnabled)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                        subtasksEnabled ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {subtasksEnabled ? "Enabled" : "Mock Off"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Workload Time Tracking</span>
                    <button
                      type="button"
                      onClick={() => setTimeTrackingEnabled(!timeTrackingEnabled)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                        timeTrackingEnabled ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {timeTrackingEnabled ? "Enabled" : "Mock Off"}
                    </button>
                  </div>
                  <div className="text-[10px] text-purple-600/70 pt-1 leading-normal">
                    * The above structures prepare the layout architecture for seamless integration with upcoming Project Management releases without code modifications.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
