import { useState, useMemo } from "react";
import {
  Users,
  Building2,
  Briefcase,
  Clock,
  Calendar,
  Award,
  UserPlus,
  ClipboardList,
  Search,
  Filter,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  FileText,
  MessageSquare,
  History,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Trash2,
  CheckSquare,
  AlertCircle,
  Video,
  Settings
} from "lucide-react";
import { analyzeSheetData } from "@/lib/workspace/sheets/smartData";

interface HrViewProps {
  records: Record<string, any>[]; // records of active sheet
  allSheets: any[]; // workbook sheets
  activeSheetIdx: number;
  onSelectSheet: (idx: number) => void;
  onUpdateRecord: (rowIndex: number, field: string, value: any) => void;
  onAddRecord: (record: Record<string, any>) => void;
  onOpenMeetingModal: (prefilled: { title: string; participants: string }) => void;
}

export default function HrView({
  records = [],
  allSheets = [],
  activeSheetIdx,
  onSelectSheet,
  onUpdateRecord,
  onAddRecord,
  onOpenMeetingModal
}: HrViewProps) {
  const activeSheetObj = allSheets[activeSheetIdx] || allSheets[0];

  // AI-powered analysis of the active spreadsheet
  const analysis = useMemo(() => {
    return analyzeSheetData(activeSheetObj);
  }, [activeSheetObj]);

  // Filtering states
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterCustomCol, setFilterCustomCol] = useState("");
  const [filterCustomVal, setFilterCustomVal] = useState("all");

  // Selected Record for detail panels
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);

  // Notes/Comments temporary state
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");

  // Determine dynamic tabs based on detected sheet columns
  const activeTabs = useMemo(() => {
    const tabs = [
      { id: "directory", label: "Directory", icon: Users }
    ];

    if (analysis.hasDepartments) {
      tabs.push({ id: "departments", label: "Departments", icon: Building2 });
    }
    if (analysis.hasPositions) {
      tabs.push({ id: "positions", label: "Positions", icon: Briefcase });
    }
    if (analysis.hasAttendance) {
      tabs.push({ id: "attendance", label: "Attendance", icon: Clock });
    }
    if (analysis.hasLeave) {
      tabs.push({ id: "leave", label: "Leave Management", icon: Calendar });
    }
    if (analysis.hasPerformance) {
      tabs.push({ id: "performance", label: "Performance", icon: Award });
    }
    if (analysis.hasRecruitment) {
      tabs.push({ id: "recruitment", label: "Recruitment", icon: UserPlus });
    }
    if (analysis.hasOnboarding) {
      tabs.push({ id: "onboarding", label: "Onboarding Checklist", icon: ClipboardList });
    }

    return tabs;
  }, [analysis]);

  const [activeTab, setActiveTab] = useState("directory");

  // Ensure current activeTab exists in the dynamically evaluated activeTabs
  const currentTab = useMemo(() => {
    return activeTabs.find((t) => t.id === activeTab) ? activeTab : "directory";
  }, [activeTab, activeTabs]);

  // Unique lists from data for filters
  const deptOptions = useMemo(() => {
    if (!analysis.departmentCol) return [];
    return Array.from(new Set(records.map((r) => r[analysis.departmentCol!]).filter(Boolean)));
  }, [records, analysis]);

  const positionOptions = useMemo(() => {
    if (!analysis.positionCol) return [];
    return Array.from(new Set(records.map((r) => r[analysis.positionCol!]).filter(Boolean)));
  }, [records, analysis]);

  const statusOptions = useMemo(() => {
    const colName = analysis.statusCol || "Status";
    return Array.from(new Set(records.map((r) => r[colName]).filter(Boolean)));
  }, [records, analysis]);

  const locationOptions = useMemo(() => {
    if (!analysis.locationCol) return [];
    return Array.from(new Set(records.map((r) => r[analysis.locationCol!]).filter(Boolean)));
  }, [records, analysis]);

  // Values for the selected custom column filter
  const customValOptions = useMemo(() => {
    if (!filterCustomCol) return [];
    return Array.from(new Set(records.map((r) => r[filterCustomCol]).filter(Boolean)));
  }, [records, filterCustomCol]);

  const clearFilters = () => {
    setFilterDept("all");
    setFilterPosition("all");
    setFilterStatus("all");
    setFilterLocation("all");
    setFilterCustomCol("");
    setFilterCustomVal("all");
  };

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const query = search.toLowerCase();

      // Broad textual match
      const textMatch = Object.entries(rec).some(([key, val]) => {
        if (key.startsWith("_") || key === "rowIndex") return false;
        return String(val).toLowerCase().includes(query);
      });

      const deptVal = analysis.departmentCol ? rec[analysis.departmentCol] || "" : "";
      const posVal = analysis.positionCol ? rec[analysis.positionCol] || "" : "";
      const statusVal = analysis.statusCol ? rec[analysis.statusCol] || "" : rec["Status"] || "";
      const locVal = analysis.locationCol ? rec[analysis.locationCol] || "" : "";

      const deptMatch = filterDept === "all" || String(deptVal).toLowerCase() === filterDept.toLowerCase();
      const posMatch = filterPosition === "all" || String(posVal).toLowerCase() === filterPosition.toLowerCase();
      const statusMatch = filterStatus === "all" || String(statusVal).toLowerCase() === filterStatus.toLowerCase();
      const locMatch = filterLocation === "all" || String(locVal).toLowerCase() === filterLocation.toLowerCase();

      // Custom column filter
      const customMatch =
        !filterCustomCol ||
        filterCustomVal === "all" ||
        String(rec[filterCustomCol] || "").toLowerCase() === filterCustomVal.toLowerCase();

      return textMatch && deptMatch && posMatch && statusMatch && locMatch && customMatch;
    });
  }, [records, search, filterDept, filterPosition, filterStatus, filterLocation, filterCustomCol, filterCustomVal, analysis]);

  const selectedRecord = useMemo(() => {
    if (selectedRecordIndex === null) return null;
    return records.find((r) => r.rowIndex === selectedRecordIndex) || null;
  }, [records, selectedRecordIndex]);

  // Handle adding new entities natively based on current columns
  const handleAddNewRecord = () => {
    const defaultNew: Record<string, any> = {};
    analysis.allColumns.forEach((col) => {
      if (col === "Employee ID" || col === "Record ID") {
        defaultNew[col] = `EMP00${records.length + 1}`;
      } else if (col === "Employee Name" || col === "Full Name" || col === "Name") {
        defaultNew[col] = "New Record";
      } else if (col === "Status" || col === "Employment Status") {
        defaultNew[col] = "Active";
      } else {
        defaultNew[col] = "";
      }
    });
    onAddRecord(defaultNew);
  };

  const toggleChecklistItem = (field: string) => {
    if (!selectedRecord) return;
    const currentVal = selectedRecord[field] || "No";
    const nextVal = currentVal === "Yes" ? "No" : "Yes";
    onUpdateRecord(selectedRecord.rowIndex, field, nextVal);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
      {/* Sub-Header bar */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {activeTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setSelectedRecordIndex(null);
                setSearch("");
              }}
              className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                currentTab === t.id
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Global directory search */}
        <div className="relative w-60 hidden md:block">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search active sheet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Advanced dynamic filters line */}
      <div className="bg-card border-b border-border px-6 py-2.5 flex flex-wrap items-center gap-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
          <Filter className="h-3.5 w-3.5" /> Filter by:
        </div>

        {analysis.hasDepartments && (
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">All Departments</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {analysis.hasPositions && (
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">All Positions</option>
            {positionOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        {statusOptions.length > 0 && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {analysis.hasLocation && (
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">All Locations</option>
            {locationOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}

        {/* Dynamic / Custom Columns Filters */}
        {analysis.customColumns.length > 0 && (
          <>
            <select
              value={filterCustomCol}
              onChange={(e) => {
                setFilterCustomCol(e.target.value);
                setFilterCustomVal("all");
              }}
              className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none text-accent font-semibold"
            >
              <option value="">Custom Column...</option>
              {analysis.customColumns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {filterCustomCol && (
              <select
                value={filterCustomVal}
                onChange={(e) => setFilterCustomVal(e.target.value)}
                className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none text-accent"
              >
                <option value="all">All Values</option>
                {customValOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        <button
          onClick={clearFilters}
          className="text-xs text-muted-foreground hover:text-foreground font-semibold underline px-1.5"
        >
          Clear Filters
        </button>
      </div>

      {/* Main split dashboard panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Directory/Table */}
        <div className="flex-1 flex flex-col border-r border-border bg-card overflow-hidden">
          {/* Header Bar */}
          <div className="p-3 border-b border-border flex items-center justify-between flex-shrink-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground capitalize">{currentTab} List</span>
              <span className="text-[10px] bg-accent/15 text-accent font-bold px-2 py-0.5 rounded-full">
                {filteredRecords.length} records
              </span>
            </div>
            <button
              onClick={handleAddNewRecord}
              className="flex items-center gap-1.5 text-xs bg-accent text-accent-foreground font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-accent/90"
            >
              <Plus className="h-3.5 w-3.5" /> New Record
            </button>
          </div>

          {/* Records Table or Cards Grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <AlertCircle className="h-10 w-10 stroke-1 mb-2 text-muted-foreground/60 animate-pulse" />
                <span className="text-xs font-semibold">No records found matching filters or search queries.</span>
                <span className="text-[11px] mt-1 text-muted-foreground/70">Verify spreadsheet data contains headers and cells.</span>
              </div>
            ) : (
              /* Universal Data Table View for supplemental HR tabs */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/25 text-muted-foreground uppercase font-bold text-[10px]">
                      <th className="p-3 pl-6 w-12">Row</th>
                      {analysis.allColumns.map((key) => (
                        <th key={key} className="p-3 font-semibold whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                      <th className="p-3 w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r) => (
                      <tr
                        key={r.rowIndex}
                        onClick={() => setSelectedRecordIndex(r.rowIndex)}
                        className={`border-b border-border/60 hover:bg-muted/25 cursor-pointer text-xs font-medium ${
                          selectedRecordIndex === r.rowIndex ? "bg-accent/5 font-semibold" : ""
                        }`}
                      >
                        <td className="p-3 pl-6 text-muted-foreground text-[10px] font-bold">#{r.rowIndex}</td>
                        {analysis.allColumns.map((key) => (
                          <td key={key} className="p-3 text-foreground truncate max-w-[200px] whitespace-nowrap">
                            {String(r[key] ?? "")}
                          </td>
                        ))}
                        <td className="p-3">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Profile panel or checklist panel */}
        <div className="w-96 bg-card overflow-y-auto p-5 border-l border-border flex-shrink-0 flex flex-col justify-between shadow-sm">
          {selectedRecord ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                {/* Basic Header block */}
                <div className="border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-accent/15 text-accent font-bold text-lg flex items-center justify-center flex-shrink-0">
                      {String(selectedRecord[analysis.employeeNameCol || "Name"] || "N")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {String(selectedRecord[analysis.employeeNameCol || "Name"] || "Details Profile")}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold">
                        Row Index: {selectedRecord.rowIndex}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checklist Mode for Onboarding Checklist */}
                {currentTab === "onboarding" ? (
                  <div className="space-y-4">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-accent" /> Onboarding Checklist
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        { key: "Documents Submitted", label: "Documents Submitted" },
                        { key: "Orientation Completed", label: "Orientation Completed" },
                        { key: "Equipment Assigned", label: "Equipment Assigned" },
                        { key: "Account Created", label: "Account Created" },
                        { key: "Training Completed", label: "Training Completed" }
                      ].map((item) => {
                        const checked = selectedRecord[item.key] === "Yes";
                        return (
                          <button
                            key={item.key}
                            onClick={() => toggleChecklistItem(item.key)}
                            className={`w-full p-2.5 rounded-lg border flex items-center justify-between transition ${
                              checked ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-muted/10 border-border text-foreground hover:bg-muted/30"
                            }`}
                          >
                            <span className="font-semibold">{item.label}</span>
                            <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border font-bold text-[10px] ${
                              checked ? "bg-emerald-600 border-emerald-600 text-white" : "border-muted-foreground"
                            }`}>
                              {checked ? "✓" : ""}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Standard detail properties */
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-accent" /> Profile Attributes
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {analysis.allColumns.map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{key}</label>
                          <input
                            type="text"
                            value={String(selectedRecord[key] ?? "")}
                            onChange={(e) => onUpdateRecord(selectedRecord.rowIndex, key, e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Internal Notes, Comments and Tasks/Meeting scheduling action block */}
              <div className="space-y-5 border-t border-border pt-4 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const title = `Performance / One-on-One: ${selectedRecord[analysis.employeeNameCol || "Name"] || "Workspace Review"}`;
                      const participants = selectedRecord["Email"] || "";
                      onOpenMeetingModal({ title, participants });
                    }}
                    className="flex-1 bg-accent text-accent-foreground font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-accent/90"
                  >
                    <Video className="h-3.5 w-3.5" /> Schedule Meeting
                  </button>

                  <button
                    onClick={() => {
                      alert(`Mock Task Integration triggered! Created Onboarding/Approval task for: ${selectedRecord[analysis.employeeNameCol || "Name"] || "this record"}`);
                    }}
                    className="border border-border font-bold text-xs py-2 px-3 rounded-lg hover:bg-muted"
                    title="Link with Tasks System"
                  >
                    Link Task
                  </button>
                </div>

                {/* Simulated Comment Stream */}
                <div className="space-y-2">
                  <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" /> Internal Notes & Mentions
                  </h5>
                  <div className="bg-muted/30 border border-border rounded-lg p-2.5 space-y-2 text-[11px] max-h-32 overflow-y-auto">
                    <div className="space-y-0.5">
                      <span className="font-bold block text-foreground">Amma Serwaa <span className="text-[9px] text-muted-foreground">3 hours ago</span></span>
                      <span className="text-muted-foreground">Checked the profile details, everything matches nicely.</span>
                    </div>
                    {newComment && (
                      <div className="space-y-0.5 border-t border-border/40 pt-1.5 animate-in fade-in-20">
                        <span className="font-bold block text-accent">Me <span className="text-[9px] text-muted-foreground">Just now</span></span>
                        <span className="text-muted-foreground">{newComment}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Type a comment..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newNote) {
                          setNewComment(newNote);
                          setNewNote("");
                        }
                      }}
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-border bg-background focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newNote) {
                          setNewComment(newNote);
                          setNewNote("");
                        }
                      }}
                      className="bg-secondary text-secondary-foreground text-[11px] font-bold px-2 rounded-lg border border-border hover:bg-secondary/80"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Users className="h-10 w-10 stroke-1 mb-2 text-muted-foreground/60" />
              <span className="text-xs font-semibold">No profile selected</span>
              <span className="text-[10px] mt-1 text-muted-foreground/70">Click on any directory record row on the left to inspect detailed profile checklists, schedule meetings, and add notes.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
