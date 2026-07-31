import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
  User,
  Clock,
  Activity,
  ChevronRight,
  Paperclip,
  AlertCircle,
  Sparkles,
  Video,
  Calendar,
  Briefcase,
  Layers,
  Database,
  CheckCircle2,
  Archive,
  Tag,
  Link,
  Info,
  GitBranch,
  Edit2,
  MapPin
} from "lucide-react";

interface RegistryViewProps {
  records: Record<string, any>[];
  onUpdateRecord: (rowIndex: number, field: string, value: any) => void;
  onAddRecord: (record: Record<string, any>) => void;
  onOpenMeetingModal: (prefilled: { title: string; participants: string }) => void;
}

export default function RegistryView({
  records = [],
  onUpdateRecord,
  onAddRecord,
  onOpenMeetingModal
}: RegistryViewProps) {
  // Dynamically extract all available headers across records
  const allHeaders = useMemo(() => {
    if (records.length === 0) return [];
    return Object.keys(records[0]).filter(
      (k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_")
    );
  }, [records]);

  // Dynamic header classification (AI-generated interpretation of spreadsheet structure)
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

    // Smart Fallbacks to ensure non-empty primary display name
    if (!result.name && allHeaders.length > 0) {
      // Find first header that isn't the ID
      const nonId = allHeaders.find((h) => h !== result.id);
      result.name = nonId || allHeaders[0];
    }

    return result;
  }, [allHeaders]);

  // Generate only those features supported by the spreadsheet
  const supportedTabs = useMemo(() => {
    const tabs = [{ id: "directory", label: "Registry Directory", icon: FileText }];
    if (columnTypes.status) {
      tabs.push({ id: "kanban", label: "Kanban Board", icon: GitBranch });
    }
    if (columnTypes.category) {
      tabs.push({ id: "categories", label: "Categories & Groups", icon: Layers });
    }
    if (columnTypes.date) {
      tabs.push({ id: "activities", label: "Actions & Audit Trail", icon: Calendar });
    }
    return tabs;
  }, [columnTypes]);

  const [activeTab, setActiveTab] = useState<string>("directory");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Fallback if activeTab becomes unsupported
  useEffect(() => {
    if (!supportedTabs.some((t) => t.id === activeTab)) {
      setActiveTab("directory");
    }
  }, [supportedTabs, activeTab]);

  // Record selection state
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  // Dynamic comments state
  const [commentInput, setCommentInput] = useState("");
  const [recordComments, setRecordComments] = useState<Record<number, { author: string; text: string; date: string }[]>>({});

  // Dynamic tasks state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [recordTasks, setRecordTasks] = useState<Record<number, { id: string; title: string; priority: string; status: string; dueDate: string }[]>>({});

  // Deriving unique categories & statuses from actual spreadsheet data
  const uniqueCategories = useMemo(() => {
    if (!columnTypes.category) return [];
    return Array.from(new Set(records.map((r) => String(r[columnTypes.category] || "")).filter(Boolean)));
  }, [records, columnTypes.category]);

  const uniqueStatuses = useMemo(() => {
    if (!columnTypes.status) return [];
    return Array.from(new Set(records.map((r) => String(r[columnTypes.status] || "")).filter(Boolean)));
  }, [records, columnTypes.status]);

  const selectedRecord = useMemo(() => {
    if (selectedRecordIndex === null) return null;
    return records.find((r) => r.rowIndex === selectedRecordIndex) || null;
  }, [records, selectedRecordIndex]);

  const openRecordProfile = (rowIndex: number) => {
    setSelectedRecordIndex(rowIndex);
    const rec = records.find((r) => r.rowIndex === rowIndex);
    if (rec) {
      setEditForm({ ...rec });
    }
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    if (!selectedRecord) return;
    Object.entries(editForm).forEach(([key, val]) => {
      if (key !== "rowIndex" && !key.startsWith("_")) {
        onUpdateRecord(selectedRecord.rowIndex, key, val);
      }
    });
    setIsEditing(false);
  };

  const handleAddNewRecord = () => {
    const defaultNew: Record<string, any> = {};
    allHeaders.forEach((header) => {
      if (header === columnTypes.id) {
        defaultNew[header] = `REG-${Math.floor(100 + Math.random() * 900)}`;
      } else if (header === columnTypes.status) {
        defaultNew[header] = uniqueStatuses[0] || "Active";
      } else if (header === columnTypes.category) {
        defaultNew[header] = uniqueCategories[0] || "General";
      } else {
        defaultNew[header] = "";
      }
    });
    onAddRecord(defaultNew);
  };

  // Filtered and searched records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches = Object.entries(rec).some(([key, val]) => {
          if (key.startsWith("_") || key === "rowIndex") return false;
          return String(val).toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      // Category filter
      if (columnTypes.category && selectedCategory !== "all") {
        const catVal = String(rec[columnTypes.category] || "");
        if (catVal !== selectedCategory) return false;
      }

      // Status filter
      if (columnTypes.status && selectedStatus !== "all") {
        const statusVal = String(rec[columnTypes.status] || "");
        if (statusVal !== selectedStatus) return false;
      }

      return true;
    });
  }, [records, search, selectedCategory, selectedStatus, columnTypes]);

  // Drag/Drop status changes for Kanban board
  const moveKanbanCard = (rowIndex: number, nextStatus: string) => {
    if (columnTypes.status) {
      onUpdateRecord(rowIndex, columnTypes.status, nextStatus);
    }
  };

  // Groups for Categories tab
  const categorizedGroups = useMemo(() => {
    if (!columnTypes.category) return {};
    const groups: Record<string, typeof records> = {};
    uniqueCategories.forEach((cat) => {
      groups[cat] = [];
    });
    records.forEach((rec) => {
      const cat = String(rec[columnTypes.category] || "Unassigned");
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(rec);
    });
    return groups;
  }, [records, uniqueCategories, columnTypes.category]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordIndex || !commentInput.trim()) return;

    const newComment = {
      author: "User",
      text: commentInput,
      date: new Date().toISOString().slice(0, 16).replace("T", " ")
    };

    setRecordComments((prev) => ({
      ...prev,
      [selectedRecordIndex]: [...(prev[selectedRecordIndex] || []), newComment]
    }));
    setCommentInput("");
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordIndex || !newTaskTitle.trim()) return;

    const newTask = {
      id: `TSK-REG-${Math.floor(200 + Math.random() * 800)}`,
      title: newTaskTitle,
      priority: newTaskPriority,
      status: "To Do",
      dueDate: newTaskDueDate || new Date().toISOString().split("T")[0]
    };

    setRecordTasks((prev) => ({
      ...prev,
      [selectedRecordIndex]: [...(prev[selectedRecordIndex] || []), newTask]
    }));

    setNewTaskTitle("");
    setNewTaskDueDate("");
    setShowTaskModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
      {/* Dynamic Sub-Header with only available tabs */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 text-xs">
        <div className="flex items-center gap-1.5">
          {supportedTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setSelectedRecordIndex(null);
              }}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-lg font-semibold transition ${
                activeTab === t.id
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Global Search Bar (directory & activities only) */}
        {activeTab !== "kanban" && activeTab !== "categories" && (
          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search registry records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}
      </div>

      {/* Directory filters (Directory view only) */}
      {activeTab === "directory" && (uniqueCategories.length > 0 || uniqueStatuses.length > 0) && (
        <div className="bg-card border-b border-border px-6 py-3 flex flex-wrap items-center gap-3 text-xs flex-shrink-0">
          {columnTypes.category && uniqueCategories.length > 0 && (
            <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-medium focus:outline-none text-foreground cursor-pointer"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {columnTypes.status && uniqueStatuses.length > 0 && (
            <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium focus:outline-none text-foreground cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main Tab Panel Rendering */}
      <div className="flex-1 flex overflow-hidden">

        {/* TAB 1: Directory List & Dynamic Profile Inspector */}
        {activeTab === "directory" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Record List */}
            <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0 overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-bold text-foreground">Records Directory</span>
                <button
                  onClick={handleAddNewRecord}
                  className="flex items-center gap-1 text-[11px] bg-accent text-accent-foreground font-semibold px-2 py-1 rounded-lg"
                >
                  <Plus className="h-3 w-3" /> Add Record
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {filteredRecords.map((item) => (
                  <button
                    key={item.rowIndex}
                    onClick={() => openRecordProfile(item.rowIndex)}
                    className={`w-full p-4 text-left hover:bg-muted/30 flex flex-col gap-1.5 transition ${
                      selectedRecordIndex === item.rowIndex ? "bg-accent/5 ring-1 ring-inset ring-accent/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {columnTypes.id && (
                        <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                          {item[columnTypes.id]}
                        </span>
                      )}
                      {columnTypes.status && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold capitalize bg-accent/10 text-accent">
                          {item[columnTypes.status]}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-xs text-foreground truncate">
                      {item[columnTypes.name] || `Record Row ${item.rowIndex}`}
                    </div>

                    {columnTypes.description && item[columnTypes.description] && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item[columnTypes.description]}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      {columnTypes.category && item[columnTypes.category] && (
                        <span className="flex items-center gap-1 font-semibold text-accent capitalize">
                          <Tag className="h-3 w-3" /> {item[columnTypes.category]}
                        </span>
                      )}
                      {columnTypes.location && item[columnTypes.location] && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {item[columnTypes.location]}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {filteredRecords.length === 0 && (
                  <div className="h-40 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 stroke-1 mb-1" />
                    <span className="text-xs">No records available.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Detail Panel */}
            <div className="flex-1 bg-card overflow-y-auto p-6">
              {selectedRecord ? (
                <div className="max-w-3xl space-y-6 text-xs">
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {columnTypes.id && (
                          <span className="text-xs font-mono font-bold bg-accent/15 text-accent px-2 py-1 rounded-md">
                            {selectedRecord[columnTypes.id]}
                          </span>
                        )}
                        <span className="text-muted-foreground text-[11px]">Row {selectedRecord.rowIndex}</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm[columnTypes.name] || ""}
                          onChange={(e) => setEditForm({ ...editForm, [columnTypes.name]: e.target.value })}
                          className="font-bold text-lg text-foreground border border-border px-2 py-1 rounded-lg focus:outline-none mt-2 w-full max-w-md"
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-foreground mt-2">
                          {selectedRecord[columnTypes.name] || "Unnamed Record"}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveProfile}
                            className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="bg-muted text-foreground font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-muted/80"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 border border-border text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-muted"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-accent" /> Edit Record
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fully Dynamic Form / Grid Layout (Auto-recognizing custom fields without hardcoding) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allHeaders.map((header) => {
                      // Avoid double-rendering primary Name if we display it as Title
                      const isNameCol = header === columnTypes.name;
                      return (
                        <div key={header} className="p-3 bg-muted/10 rounded-lg border border-border flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{header}</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm[header] ?? ""}
                              onChange={(e) => setEditForm({ ...editForm, [header]: e.target.value })}
                              className="w-full bg-background border border-border p-1.5 rounded text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="text-foreground font-semibold truncate">
                              {String(selectedRecord[header] ?? "—")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Collaboration & Meetings Action Bar */}
                  <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                    <button
                      onClick={() =>
                        onOpenMeetingModal({
                          title: `Registry Review: ${selectedRecord[columnTypes.name] || "Record"}`,
                          participants: columnTypes.contact ? String(selectedRecord[columnTypes.contact] || "") : ""
                        })
                      }
                      className="bg-accent text-accent-foreground font-bold px-3.5 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-1.5"
                    >
                      <Video className="h-3.5 w-3.5" /> Schedule Review Meeting
                    </button>

                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="border border-border text-foreground bg-background hover:bg-muted font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-500" /> Create Linked Task
                    </button>
                  </div>

                  {/* Comments & Activity Thread */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    <div className="space-y-3">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" /> Comments & Activity Thread
                      </h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {(recordComments[selectedRecord.rowIndex] || []).map((comm, idx) => (
                          <div key={idx} className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                              <span className="font-bold text-foreground">{comm.author}</span>
                              <span>{comm.date}</span>
                            </div>
                            <p className="text-foreground text-[11px] leading-relaxed">{comm.text}</p>
                          </div>
                        ))}
                        {!(recordComments[selectedRecord.rowIndex]?.length) && (
                          <p className="text-[11px] text-muted-foreground italic">No internal comments recorded.</p>
                        )}
                      </div>

                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type internal note..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="bg-accent text-accent-foreground font-bold px-3 py-1.5 rounded-lg hover:bg-accent/90"
                        >
                          Post
                        </button>
                      </form>
                    </div>

                    {/* Linked Tasks */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> Linked Tasks
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {(recordTasks[selectedRecord.rowIndex] || []).map((tsk) => (
                          <div key={tsk.id} className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-bold text-[11px] text-foreground">{tsk.title}</div>
                              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                                <span className="font-mono">{tsk.id}</span>
                                <span>•</span>
                                <span>Due: {tsk.dueDate}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 uppercase">
                                {tsk.priority}
                              </span>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 uppercase">
                                {tsk.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {!(recordTasks[selectedRecord.rowIndex]?.length) && (
                          <div className="text-center py-6 text-[11px] text-muted-foreground italic border-2 border-dashed border-border/40 rounded-lg">
                            No tasks scheduled.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Database className="h-12 w-12 stroke-1 mb-2 text-muted-foreground/50" />
                  <span className="text-xs">Select a record from the directory to inspect detailed profiles.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Dynamic Kanban Board */}
        {activeTab === "kanban" && columnTypes.status && (
          <div className="flex-1 overflow-x-auto p-6 flex gap-4 items-start select-none">
            {uniqueStatuses.map((status) => {
              const statusRecords = records.filter(
                (r) => String(r[columnTypes.status] || "") === status
              );

              return (
                <div key={status} className="w-72 bg-muted/40 rounded-xl border border-border/80 flex flex-col flex-shrink-0 max-h-full overflow-hidden">
                  <div className="p-3 border-b border-border bg-card flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground truncate">{status}</span>
                    <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-full">
                      {statusRecords.length}
                    </span>
                  </div>

                  <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[400px]">
                    {statusRecords.map((item) => (
                      <div
                        key={item.rowIndex}
                        onClick={() => {
                          setActiveTab("directory");
                          openRecordProfile(item.rowIndex);
                        }}
                        className="p-3 rounded-lg border border-border bg-card shadow-sm hover:border-accent/40 cursor-pointer transition space-y-2"
                      >
                        <div className="font-semibold text-xs text-foreground truncate">
                          {item[columnTypes.name]}
                        </div>
                        {columnTypes.category && item[columnTypes.category] && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Tag className="h-3 w-3 text-accent" />
                            <span className="truncate">{item[columnTypes.category]}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-1">
                          <span className="text-[9px] text-muted-foreground font-mono">
                            Row {item.rowIndex}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIdx = uniqueStatuses.indexOf(status);
                              if (currentIdx < uniqueStatuses.length - 1) {
                                moveKanbanCard(item.rowIndex, uniqueStatuses[currentIdx + 1]);
                              } else {
                                moveKanbanCard(item.rowIndex, uniqueStatuses[0]);
                              }
                            }}
                            className="h-5 w-5 rounded bg-muted hover:bg-accent/15 hover:text-accent flex items-center justify-center text-muted-foreground"
                            title="Rotate Status"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {statusRecords.length === 0 && (
                      <div className="text-center py-8 text-[11px] text-muted-foreground italic border-2 border-dashed border-border/40 rounded-lg">
                        Empty group
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: Categories & Groups Cards */}
        {activeTab === "categories" && columnTypes.category && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Dynamic Registry Repositories</h3>
                <p className="text-xs text-muted-foreground">Categories parsed on-the-fly from your spreadsheet columns.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {uniqueCategories.map((category) => {
                const groupRecords = categorizedGroups[category] || [];
                return (
                  <div key={category} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between h-40 hover:border-accent/30 transition">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                          <Tag className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {groupRecords.length} records
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-3 capitalize">{category}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        {groupRecords.map((r) => r[columnTypes.name]).slice(0, 3).join(", ") || "No records registered."}
                      </p>
                    </div>
                    <div className="border-t border-border bg-muted/20 px-4 py-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setActiveTab("directory");
                        }}
                        className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
                      >
                        Browse Records <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Recent Actions & Audit Trail Log */}
        {activeTab === "activities" && columnTypes.date && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Actions & Audit Log</h3>
              <p className="text-xs text-muted-foreground">Records sorted by historical timestamps and updates directly mapped to cells.</p>
            </div>
            <div className="space-y-4 max-w-2xl">
              {records.map((r, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-sm text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{r[columnTypes.name] || "Unnamed Record"}</span>
                    {columnTypes.status && r[columnTypes.status] && (
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {r[columnTypes.status]}
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    <span>Last synchronized date: </span>
                    <span className="font-semibold text-foreground">{r[columnTypes.date] || "No Date"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Linked Task modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowTaskModal(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-xl border border-border shadow-2xl p-5 overflow-hidden text-xs">
            <h3 className="font-bold text-foreground text-sm mb-4">Generate Registry Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compliance Check / Review"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-5">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 border border-border rounded-lg font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90"
                >
                  Create Linked Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
