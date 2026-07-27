import { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Activity,
  ChevronRight,
  Paperclip,
  AlertCircle,
  Sparkles,
  Video,
  Calendar,
  Briefcase,
  Share2,
  QrCode,
  Map,
  Layers,
  Database,
  Trash2,
  CheckCircle2,
  Archive,
  Lock,
  Tag,
  Link,
  Info
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
  // Navigation & Sub-views state
  const [activeSubView, setActiveSubView] = useState<"all" | "categories" | "active" | "archived" | "recent">("all");
  const [search, setSearch] = useState("");

  // Advanced Filter state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [customFilterHeader, setCustomFilterHeader] = useState("");
  const [customFilterValue, setCustomFilterValue] = useState("");

  // Record selection state
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Comments, History & Mock Tasks for selected record
  const [commentInput, setCommentInput] = useState("");
  const [recordComments, setRecordComments] = useState<Record<number, { author: string; text: string; date: string }[]>>({
    1: [
      { author: "Ebenezer Ocloo", text: "Verified farmer profile documents are fully complete.", date: "2026-03-11 10:24" },
      { author: "Jules Agent", text: "Assigned primary support engineer.", date: "2026-03-12 14:15" }
    ],
    2: [
      { author: "Logistics Admin", text: "Lubrication check and transmission diagnostics completed yesterday.", date: "2026-04-02 09:30" }
    ]
  });

  const [recordTasks, setRecordTasks] = useState<Record<number, { id: string; title: string; priority: string; status: string; dueDate: string }[]>>({
    2: [
      { id: "TSK-REG-201", title: "Quarterly Engine & Chassis Lubrication Service", priority: "High", status: "Completed", dueDate: "2026-03-15" },
      { id: "TSK-REG-202", title: "Roadworthiness & Insurance Renewal", priority: "Medium", status: "In Progress", dueDate: "2026-04-20" }
    ]
  });

  // Task creation Form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Custom Category State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Permissions Role State
  const [userRole, setUserRole] = useState<"Registry Administrator" | "Registry Manager" | "Contributor" | "Viewer">("Registry Administrator");

  // Dynamic schema exploration: find all keys that exist across records
  const allHeaders = useMemo(() => {
    if (records.length === 0) return [];
    // Filter out internal properties used for bookkeeping
    return Object.keys(records[0]).filter(
      (k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_")
    );
  }, [records]);

  // Identify core standard fields vs custom fields
  const standardFields = [
    "Record ID",
    "Name",
    "Category",
    "Type",
    "Status",
    "Description",
    "Owner",
    "Contact Information",
    "Location",
    "Created Date",
    "Updated Date",
    "Notes"
  ];

  const customFields = useMemo(() => {
    return allHeaders.filter((h) => !standardFields.includes(h));
  }, [allHeaders]);

  // Derive filter values dynamically from records
  const uniqueCategories = useMemo(() => {
    const cats = new Set(records.map((r) => r.Category || r.category).filter(Boolean));
    customCategories.forEach((c) => cats.add(c));
    return Array.from(cats);
  }, [records, customCategories]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.Status || r.status).filter(Boolean)));
  }, [records]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.Location || r.location).filter(Boolean)));
  }, [records]);

  // Selected Record Record data
  const selectedRecord = useMemo(() => {
    if (selectedRecordIndex === null) return null;
    return records.find((r) => r.rowIndex === selectedRecordIndex) || null;
  }, [records, selectedRecordIndex]);

  // Form edit helper state
  const [editForm, setEditForm] = useState<Record<string, any>>({});

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

  // Filtered and searched records
  const processedRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Navigation tabs filter
      const status = String(rec.Status || rec.status || "").toLowerCase();
      if (activeSubView === "active" && status !== "active") return false;
      if (activeSubView === "archived" && status !== "archived") return false;
      if (activeSubView === "recent") {
        const createdDate = rec["Created Date"] || rec.createdDate || "";
        // Just sort/filter by recentness (mock criteria: created in 2026)
        if (!String(createdDate).includes("2026")) return false;
      }

      // 2. Advanced filters
      const category = String(rec.Category || rec.category || "").toLowerCase();
      if (selectedCategory !== "all" && category !== selectedCategory.toLowerCase()) return false;
      if (selectedStatus !== "all" && status !== selectedStatus.toLowerCase()) return false;

      const location = String(rec.Location || rec.location || "").toLowerCase();
      if (selectedLocation !== "all" && location !== selectedLocation.toLowerCase()) return false;

      // Custom column filter
      if (customFilterHeader && customFilterValue) {
        const customVal = String(rec[customFilterHeader] || "").toLowerCase();
        if (!customVal.includes(customFilterValue.toLowerCase())) return false;
      }

      // 3. Search query filter
      if (search.trim()) {
        const query = search.toLowerCase();
        return Object.entries(rec).some(([key, val]) => {
          if (key.startsWith("_") || key === "rowIndex") return false;
          return String(val).toLowerCase().includes(query);
        });
      }

      return true;
    });
  }, [records, activeSubView, selectedCategory, selectedStatus, selectedLocation, customFilterHeader, customFilterValue, search]);

  // Categorized records for the "Categories" view
  const categorizedGroups = useMemo(() => {
    const groups: Record<string, typeof records> = {};
    uniqueCategories.forEach((cat) => {
      groups[cat] = [];
    });
    records.forEach((rec) => {
      const cat = rec.Category || rec.category || "Unassigned";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(rec);
    });
    return groups;
  }, [records, uniqueCategories]);

  // Handle Comments submission
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordIndex || !commentInput.trim()) return;

    const newComment = {
      author: `User (${userRole})`,
      text: commentInput,
      date: new Date().toISOString().slice(0, 16).replace("T", " ")
    };

    setRecordComments((prev) => ({
      ...prev,
      [selectedRecordIndex]: [...(prev[selectedRecordIndex] || []), newComment]
    }));
    setCommentInput("");
  };

  // Handle Task Generation (Integration)
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

  // Add custom category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && !uniqueCategories.includes(newCategoryName)) {
      setCustomCategories((prev) => [...prev, newCategoryName.trim()]);
      setNewCategoryName("");
      setShowAddCategoryModal(false);
    }
  };

  const handleAddNewRecord = () => {
    const defaultNew: Record<string, any> = {};
    allHeaders.forEach((header) => {
      if (header === "Record ID") {
        defaultNew[header] = `REG-${Math.floor(100 + Math.random() * 900)}`;
      } else if (header === "Category") {
        defaultNew[header] = uniqueCategories[0] || "Farmers";
      } else if (header === "Status") {
        defaultNew[header] = "Active";
      } else if (header === "Created Date") {
        defaultNew[header] = new Date().toISOString().split("T")[0];
      } else if (header === "Location") {
        defaultNew[header] = "Greater Accra";
      } else if (header === "Type") {
        defaultNew[header] = "Individual";
      } else {
        defaultNew[header] = "";
      }
    });

    onAddRecord(defaultNew);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
      {/* Sub-Header / Workspace navigation bar */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 text-xs">
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "All Records", icon: FileText },
            { id: "categories", label: "Registry Categories", icon: Layers },
            { id: "active", label: "Active", icon: CheckCircle2 },
            { id: "archived", label: "Archived", icon: Archive },
            { id: "recent", label: "Recent Records", icon: Clock }
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setActiveSubView(v.id as any);
                setSelectedRecordIndex(null);
              }}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-lg font-semibold transition ${
                activeSubView === v.id
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              }`}
            >
              <v.icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          ))}
        </div>

        {/* Permissions Role Switcher (Mock demo role switcher) */}
        <div className="flex items-center gap-2 border border-border bg-muted/30 px-2 py-1 rounded-lg">
          <Shield className="h-3.5 w-3.5 text-accent" />
          <span className="text-[10px] font-semibold text-muted-foreground">Viewing as:</span>
          <select
            value={userRole}
            onChange={(e: any) => setUserRole(e.target.value)}
            className="bg-transparent font-bold text-[10px] focus:outline-none text-foreground cursor-pointer"
          >
            <option value="Registry Administrator">Registry Administrator</option>
            <option value="Registry Manager">Registry Manager</option>
            <option value="Contributor">Contributor</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Advanced Filter and Search Bar */}
      {activeSubView !== "categories" && (
        <div className="bg-card border-b border-border px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category selector */}
            <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-medium focus:outline-none text-foreground cursor-pointer"
              >
                <option value="all">All</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status selector */}
            <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium focus:outline-none text-foreground cursor-pointer"
              >
                <option value="all">All</option>
                {uniqueStatuses.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Location selector */}
            <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Location:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent font-medium focus:outline-none text-foreground cursor-pointer"
              >
                <option value="all">All</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Custom Fields Filter */}
            {customFields.length > 0 && (
              <div className="flex items-center gap-1.5 border border-dashed border-accent/40 bg-accent/5 px-2 py-1 rounded-lg text-[11px]">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="font-semibold text-accent/90">Custom Filter:</span>
                <select
                  value={customFilterHeader}
                  onChange={(e) => { setCustomFilterHeader(e.target.value); setCustomFilterValue(""); }}
                  className="bg-transparent font-medium text-foreground focus:outline-none"
                >
                  <option value="">Choose Column...</option>
                  {customFields.map((cf) => (
                    <option key={cf} value={cf}>{cf}</option>
                  ))}
                </select>
                {customFilterHeader && (
                  <input
                    type="text"
                    placeholder="Search value..."
                    value={customFilterValue}
                    onChange={(e) => setCustomFilterValue(e.target.value)}
                    className="bg-background border border-border px-1.5 py-0.5 rounded text-[10px] w-28 focus:outline-none"
                  />
                )}
              </div>
            )}
          </div>

          {/* Search Box */}
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
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIEW 1: Categories Group View */}
        {activeSubView === "categories" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Multi-Category Registry Repositories</h3>
                <p className="text-xs text-muted-foreground">Unlimited categories dynamically parsed from your spreadsheet cells.</p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-accent/95 shadow"
              >
                <Plus className="h-3.5 w-3.5" /> Add Custom Category
              </button>
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
                        {groupRecords.map((r) => r.Name || r["Name"]).slice(0, 3).join(", ") || "No records registered."}
                      </p>
                    </div>
                    <div className="border-t border-border bg-muted/20 px-4 py-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setActiveSubView("all");
                        }}
                        className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
                      >
                        Browse Registry <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Record Listing + Details Split View */}
        {activeSubView !== "categories" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Record List */}
            <div className="w-96 border-r border-border bg-card flex flex-col flex-shrink-0 overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between flex-shrink-0">
                <div className="text-xs font-bold text-foreground">
                  Registry Index ({processedRecords.length} records)
                </div>
                {userRole !== "Viewer" && (
                  <button
                    onClick={handleAddNewRecord}
                    className="flex items-center gap-1 text-[11px] bg-accent text-accent-foreground font-semibold px-2 py-1 rounded-lg"
                  >
                    <Plus className="h-3 w-3" /> Add Record
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {processedRecords.map((item) => (
                  <button
                    key={item.rowIndex}
                    onClick={() => openRecordProfile(item.rowIndex)}
                    className={`w-full p-4 text-left hover:bg-muted/30 flex flex-col gap-1.5 transition ${
                      selectedRecordIndex === item.rowIndex ? "bg-accent/5 ring-1 ring-inset ring-accent/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                        {item["Record ID"] || `Row ${item.rowIndex}`}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold capitalize ${
                        String(item.Status || item.status).toLowerCase() === "active"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : String(item.Status || item.status).toLowerCase() === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {item.Status || item.status || "Active"}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-foreground truncate">
                      {item.Name || item.title || "No Name"}
                    </div>

                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.Description || "No description provided."}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <span className="flex items-center gap-1 font-semibold text-accent capitalize">
                        <Tag className="h-3 w-3" /> {item.Category || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {item.Location || "Local"}
                      </span>
                    </div>
                  </button>
                ))}
                {processedRecords.length === 0 && (
                  <div className="h-40 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 stroke-1 mb-1" />
                    <span className="text-xs">No records match the current filters.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Record Profile & Details Panel */}
            <div className="flex-1 bg-card overflow-y-auto p-6 flex flex-col">
              {selectedRecord ? (
                <div className="max-w-3xl space-y-6 flex-1 text-xs">
                  {/* Record Header Profile */}
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-accent/15 text-accent px-2 py-1 rounded-md">
                          {selectedRecord["Record ID"] || `ROW-${selectedRecord.rowIndex}`}
                        </span>
                        <span className="text-muted-foreground text-[11px]">Row {selectedRecord.rowIndex} in spreadsheet</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.Name || ""}
                          onChange={(e) => setEditForm({ ...editForm, Name: e.target.value })}
                          className="font-bold text-lg text-foreground border border-border px-2 py-1 rounded-lg focus:outline-none mt-2 w-full max-w-md"
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-foreground mt-2">
                          {selectedRecord.Name || "Unnamed Record"}
                        </h3>
                      )}
                    </div>

                    {userRole !== "Viewer" && (
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
                            <Activity className="h-3.5 w-3.5 text-accent" /> Edit Record
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Core Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-xl border border-border">
                    <div className="space-y-4">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80 pb-1 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" /> Core Parameters
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium w-24">Category:</span>
                          {isEditing ? (
                            <select
                              value={editForm.Category || ""}
                              onChange={(e) => setEditForm({ ...editForm, Category: e.target.value })}
                              className="border border-border p-1 rounded-md bg-background flex-1 text-xs"
                            >
                              {uniqueCategories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-foreground font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-md capitalize">
                              {selectedRecord.Category || "Unassigned"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium w-24">Type:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.Type || ""}
                              onChange={(e) => setEditForm({ ...editForm, Type: e.target.value })}
                              className="border border-border p-1 rounded-md bg-background flex-1 text-xs"
                            />
                          ) : (
                            <span className="text-foreground font-medium">{selectedRecord.Type || "N/A"}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium w-24">Status:</span>
                          {isEditing ? (
                            <select
                              value={editForm.Status || ""}
                              onChange={(e) => setEditForm({ ...editForm, Status: e.target.value })}
                              className="border border-border p-1 rounded-md bg-background flex-1 text-xs"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Pending">Pending</option>
                              <option value="Suspended">Suspended</option>
                              <option value="Archived">Archived</option>
                            </select>
                          ) : (
                            <span className="text-foreground font-medium">{selectedRecord.Status || "Active"}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium w-24">Location:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.Location || ""}
                              onChange={(e) => setEditForm({ ...editForm, Location: e.target.value })}
                              className="border border-border p-1 rounded-md bg-background flex-1 text-xs"
                            />
                          ) : (
                            <span className="text-foreground font-medium">{selectedRecord.Location || "N/A"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80 pb-1 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> Registry Metadata
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium w-24">Owner:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.Owner || ""}
                              onChange={(e) => setEditForm({ ...editForm, Owner: e.target.value })}
                              className="border border-border p-1 rounded-md bg-background flex-1 text-xs"
                            />
                          ) : (
                            <span className="text-foreground font-medium">{selectedRecord.Owner || "N/A"}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium w-24">Contact Info:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm["Contact Information"] || ""}
                              onChange={(e) => setEditForm({ ...editForm, "Contact Information": e.target.value })}
                              className="border border-border p-1 rounded-md bg-background flex-1 text-xs"
                            />
                          ) : (
                            <span className="text-foreground font-medium">{selectedRecord["Contact Information"] || "N/A"}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium w-24">Created Date:</span>
                          {isEditing ? (
                            <input
                              type="date"
                              value={editForm["Created Date"] || ""}
                              onChange={(e) => setEditForm({ ...editForm, "Created Date": e.target.value })}
                              className="border border-border p-1 rounded-md bg-background flex-1 text-xs"
                            />
                          ) : (
                            <span className="text-foreground font-medium">{selectedRecord["Created Date"] || "N/A"}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium w-24">Updated Date:</span>
                          {isEditing ? (
                            <input
                              type="date"
                              value={editForm["Updated Date"] || ""}
                              onChange={(e) => setEditForm({ ...editForm, "Updated Date": e.target.value })}
                              className="border border-border p-1 rounded-md bg-background flex-1 text-xs"
                            />
                          ) : (
                            <span className="text-foreground font-medium">{selectedRecord["Updated Date"] || "N/A"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description & Notes */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80 pb-1">
                      Description & Notes
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-muted-foreground font-semibold block mb-1">Description:</span>
                        {isEditing ? (
                          <textarea
                            value={editForm.Description || ""}
                            onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })}
                            rows={2}
                            className="w-full border border-border p-2 rounded-lg bg-background text-xs focus:outline-none"
                          />
                        ) : (
                          <p className="text-foreground bg-muted/10 p-3 rounded-lg border border-border/50">
                            {selectedRecord.Description || "No description provided."}
                          </p>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block mb-1">Internal Notes:</span>
                        {isEditing ? (
                          <textarea
                            value={editForm.Notes || ""}
                            onChange={(e) => setEditForm({ ...editForm, Notes: e.target.value })}
                            rows={2}
                            className="w-full border border-border p-2 rounded-lg bg-background text-xs focus:outline-none"
                          />
                        ) : (
                          <p className="text-foreground bg-amber-50/20 border border-amber-200/50 p-3 rounded-lg text-amber-900 font-medium">
                            {selectedRecord.Notes || "No notes documented."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Custom Fields Rendering (Adapting dynamically to sheet structure) */}
                  {customFields.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-accent text-xs uppercase tracking-wider border-b border-accent/20 pb-1 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-accent" /> Dynamic Spreadsheet Fields Detected
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-accent/5 p-4 rounded-xl border border-accent/10">
                        {customFields.map((field) => (
                          <div key={field} className="flex items-center justify-between">
                            <span className="text-muted-foreground font-semibold truncate w-32 capitalize">{field}:</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm[field] || ""}
                                onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                                className="border border-border p-1 rounded-md bg-background text-xs flex-1 ml-2"
                              />
                            ) : (
                              <span className="text-foreground font-bold truncate max-w-[150px]">
                                {String(selectedRecord[field] ?? "—")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collaboration, CRM & Tasks Action Bar */}
                  <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                    {/* Collaborate Dropdown Integration */}
                    <button
                      onClick={() =>
                        onOpenMeetingModal({
                          title: `Registry Review: ${selectedRecord.Name || selectedRecord["Record ID"]}`,
                          participants: selectedRecord["Contact Information"] || ""
                        })
                      }
                      className="bg-accent text-accent-foreground font-bold px-3.5 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-1.5"
                    >
                      <Video className="h-3.5 w-3.5" /> Schedule Review Meeting
                    </button>

                    {/* Task Generator button */}
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="border border-border text-foreground bg-background hover:bg-muted font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-500" /> Create Linked Task
                    </button>

                    {/* CRM Integration Stub */}
                    <div className="relative group">
                      <button className="border border-border text-muted-foreground bg-muted/20 font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 hover:text-foreground hover:bg-muted/40">
                        <Link className="h-3.5 w-3.5 text-blue-500" /> Link to CRM Record
                      </button>
                      <div className="hidden group-hover:block absolute bottom-full mb-1 left-0 z-50 w-56 bg-popover text-foreground border border-border rounded-lg p-2.5 shadow-xl text-[10px]">
                        <span className="font-bold block text-accent flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> CRM Pipeline Integration
                        </span>
                        <span className="text-muted-foreground block mt-1">
                          Future extension: Seamlessly link this record with companies and contacts in your sales pipeline.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comments & Activity Thread */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    {/* Internal Notes & Comments Thread */}
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

                    {/* Generated Tasks List */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> Linked Registry Tasks
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
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                tsk.priority === "High" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                              }`}>
                                {tsk.priority}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                tsk.status === "Completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                              }`}>
                                {tsk.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {!(recordTasks[selectedRecord.rowIndex]?.length) && (
                          <div className="text-center py-6 text-[11px] text-muted-foreground italic border-2 border-dashed border-border/40 rounded-lg">
                            No tasks scheduled for this asset/record.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Future Architecture Prepared Area */}
                  <div className="bg-gradient-to-r from-accent/5 to-transparent border border-accent/10 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-accent text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Future Architectural Extension Blueprint (V2)
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      This sandbox has been prepared with full hooks for future record expansion features. Click on items below to view prototypes.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-semibold text-foreground">
                      <div className="p-2.5 rounded-lg border border-border/60 bg-card/60 flex items-center gap-2 cursor-help hover:bg-card">
                        <QrCode className="h-4 w-4 text-emerald-500" />
                        <div>
                          <span>QR Code Generator</span>
                          <span className="block text-[8px] text-muted-foreground font-normal">Native labels printing</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-card/60 flex items-center gap-2 cursor-help hover:bg-card">
                        <Map className="h-4 w-4 text-blue-500" />
                        <div>
                          <span>GIS Map Coordinates</span>
                          <span className="block text-[8px] text-muted-foreground font-normal">Plot farmers field visualizer</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-card/60 flex items-center gap-2 cursor-help hover:bg-card">
                        <Shield className="h-4 w-4 text-purple-500" />
                        <div>
                          <span>Digital Certificates</span>
                          <span className="block text-[8px] text-muted-foreground font-normal">Compliance secure portal</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border/60 bg-card/60 flex items-center gap-2 cursor-help hover:bg-card">
                        <ArrowRight className="h-4 w-4 text-amber-500" />
                        <div>
                          <span>Approval Workflows</span>
                          <span className="block text-[8px] text-muted-foreground font-normal">Verification portal pipeline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Database className="h-12 w-12 stroke-1 mb-2 text-muted-foreground/50" />
                  <span className="text-xs">Select a record from the index on the left to inspect detailed profile.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Create task inside record */}
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
                  placeholder="e.g. Equipment Inspection / Safety Review"
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
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
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

      {/* MODAL 2: Add Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddCategoryModal(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-xl border border-border shadow-2xl p-5 overflow-hidden text-xs">
            <h3 className="font-bold text-foreground text-sm mb-4">Add Custom Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vehicles / Certificates / Volunteers"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 bg-background focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-3 py-1.5 border border-border rounded-lg font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
