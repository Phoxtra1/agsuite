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
  Video
} from "lucide-react";

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
  // Tabs mapped to sheets
  const HR_TABS = [
    { id: "employees", label: "Employees", icon: Users, sheetName: "Employees", index: 0 },
    { id: "departments", label: "Departments", icon: Building2, sheetName: "Departments", index: 1 },
    { id: "positions", label: "Positions", icon: Briefcase, sheetName: "Positions", index: 2 },
    { id: "attendance", label: "Attendance", icon: Clock, sheetName: "Attendance", index: 3 },
    { id: "leave", label: "Leave Management", icon: Calendar, sheetName: "Leave", index: 4 },
    { id: "performance", label: "Performance", icon: Award, sheetName: "Performance", index: 5 },
    { id: "recruitment", label: "Recruitment", icon: UserPlus, sheetName: "Recruitment", index: 6 },
    { id: "onboarding", label: "Onboarding Checklist", icon: ClipboardList, sheetName: "Onboarding", index: 7 }
  ];

  // Derive active tab from activeSheetIdx
  const activeTab = useMemo(() => {
    const sheetObj = allSheets[activeSheetIdx];
    if (!sheetObj) return "employees";
    const found = HR_TABS.find((t) => t.sheetName === sheetObj.name);
    return found ? found.id : "employees";
  }, [activeSheetIdx, allSheets]);

  // Filtering states
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterEmpType, setFilterEmpType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");

  // Selected Employee/Department/Record for detail panels
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);

  // Comments/Notes temporary state
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");

  // Helper arrays for options
  const deptList = ["Engineering", "Marketing", "People Operations", "Product", "Finance"];
  const positionList = ["Senior Software Engineer", "QA Automation Engineer", "Marketing Lead", "HR Officer", "Product Designer"];
  const empTypes = ["Full-Time", "Part-Time", "Contract", "Temporary", "Internship", "Volunteer", "Consultant"];
  const empStatuses = ["Active", "On Leave", "Probation", "Suspended", "Resigned", "Retired", "Terminated"];
  const officeLocations = ["Accra HQ", "Kumasi Hub", "London Office", "Remote"];

  // Handle Tab changes (Ensure Spreadsheet index synchronizes)
  const handleTabChange = (tabId: string) => {
    const tabObj = HR_TABS.find((t) => t.id === tabId);
    if (tabObj) {
      // Find index in actual workbook sheets array
      const idx = allSheets.findIndex((s) => s.name === tabObj.sheetName);
      if (idx !== -1) {
        onSelectSheet(idx);
      }
      setSelectedRecordIndex(null);
      setSearch("");
      clearFilters();
    }
  };

  const clearFilters = () => {
    setFilterDept("all");
    setFilterPosition("all");
    setFilterEmpType("all");
    setFilterStatus("all");
    setFilterLocation("all");
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

      // Filter attributes
      const deptVal = rec["Department"] || "";
      const posVal = rec["Position"] || rec["Position Title"] || rec["Job Title"] || "";
      const typeVal = rec["Employment Type"] || "";
      const statusVal = rec["Employment Status"] || rec["Status"] || rec["Attendance Status"] || rec["Application Status"] || "";
      const locVal = rec["Office Location"] || "";

      const deptMatch = filterDept === "all" || deptVal.toLowerCase() === filterDept.toLowerCase();
      const posMatch = filterPosition === "all" || posVal.toLowerCase() === filterPosition.toLowerCase();
      const typeMatch = filterEmpType === "all" || typeVal.toLowerCase() === filterEmpType.toLowerCase();
      const statusMatch = filterStatus === "all" || statusVal.toLowerCase() === filterStatus.toLowerCase();
      const locMatch = filterLocation === "all" || locVal.toLowerCase() === filterLocation.toLowerCase();

      return textMatch && deptMatch && posMatch && typeMatch && statusMatch && locMatch;
    });
  }, [records, search, filterDept, filterPosition, filterEmpType, filterStatus, filterLocation]);

  const selectedRecord = useMemo(() => {
    if (selectedRecordIndex === null) return null;
    return records.find((r) => r.rowIndex === selectedRecordIndex) || null;
  }, [records, selectedRecordIndex]);

  // Handle adding new entities natively
  const handleAddNewRecord = () => {
    if (activeTab === "employees") {
      onAddRecord({
        "Employee ID": `EMP00${records.length + 1}`,
        "First Name": "New",
        "Last Name": "Employee",
        "Full Name": "New Employee",
        "Preferred Name": "New",
        "Gender": "Male",
        "Date of Birth": "1995-01-01",
        "Nationality": "Ghanaian",
        "Phone": "+233 ",
        "Email": "new.employee@amineva.com",
        "Address": "",
        "Emergency Contact": "",
        "Emergency Contact Number": "",
        "Employment Status": "Probation",
        "Employment Type": "Full-Time",
        "Hire Date": new Date().toISOString().split("T")[0],
        "End Date": "",
        "Department": "Engineering",
        "Position": "Junior Developer",
        "Manager": "Ebenezer Ocloo",
        "Office Location": "Remote",
        "Notes": "New record created via HR Module."
      });
    } else if (activeTab === "departments") {
      onAddRecord({
        "Department Name": "New Department",
        "Department Code": "NEW",
        "Manager": "Ebenezer Ocloo",
        "Description": "Strategic development unit."
      });
    } else if (activeTab === "positions") {
      onAddRecord({
        "Position Title": "New Position",
        "Department": "Engineering",
        "Reports To": "Ebenezer Ocloo",
        "Description": "Description of position."
      });
    } else if (activeTab === "attendance") {
      onAddRecord({
        "Employee ID": "EMP001",
        "Employee Name": "Emmanuel Quaye",
        "Date": new Date().toISOString().split("T")[0],
        "Check-In Time": "09:00 AM",
        "Check-Out Time": "05:00 PM",
        "Working Hours": 8.0,
        "Attendance Status": "Present",
        "Attendance Notes": "Manual entry"
      });
    } else if (activeTab === "leave") {
      onAddRecord({
        "Employee ID": "EMP001",
        "Employee Name": "Emmanuel Quaye",
        "Leave Type": "Annual Leave",
        "Start Date": new Date().toISOString().split("T")[0],
        "End Date": new Date().toISOString().split("T")[0],
        "Total Days": 1,
        "Status": "Pending",
        "Approver": "Amma Serwaa",
        "Notes": "Urgent personal leave"
      });
    } else if (activeTab === "performance") {
      onAddRecord({
        "Employee ID": "EMP001",
        "Employee Name": "Emmanuel Quaye",
        "Review Date": new Date().toISOString().split("T")[0],
        "Reviewer": "Ebenezer Ocloo",
        "Rating": 4,
        "Goals": "Next level backend integration.",
        "Comments": "Review created."
      });
    } else if (activeTab === "recruitment") {
      onAddRecord({
        "Job Title": "New Job Opening",
        "Department": "Engineering",
        "Candidate Name": "Jane Doe",
        "Application Status": "Applied",
        "Interview Date": "",
        "Hiring Status": "Under Review"
      });
    } else if (activeTab === "onboarding") {
      onAddRecord({
        "Employee ID": "EMP001",
        "Employee Name": "Emmanuel Quaye",
        "Documents Submitted": "Yes",
        "Orientation Completed": "No",
        "Equipment Assigned": "No",
        "Account Created": "No",
        "Training Completed": "No"
      });
    }
  };

  // Checklist handler
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
          {HR_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                activeTab === t.id
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
            placeholder="Search directory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Advanced filters line (Mainly applicable to Employees directory) */}
      {activeTab === "employees" && (
        <div className="bg-card border-b border-border px-6 py-2.5 flex flex-wrap items-center gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
            <Filter className="h-3.5 w-3.5" /> Filter by:
          </div>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">All Departments</option>
            {deptList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">All Positions</option>
            {positionList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterEmpType}
            onChange={(e) => setFilterEmpType(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">Employment Type</option>
            {empTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">Employee Status</option>
            {empStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1 text-xs bg-background focus:outline-none"
          >
            <option value="all">Office Location</option>
            {officeLocations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold underline px-1.5"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Main split dashboard panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Directory/Table */}
        <div className="flex-1 flex flex-col border-r border-border bg-card overflow-hidden">
          {/* Header Bar */}
          <div className="p-3 border-b border-border flex items-center justify-between flex-shrink-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground capitalize">{activeTab} List</span>
              <span className="text-[10px] bg-accent/15 text-accent font-bold px-2 py-0.5 rounded-full">
                {filteredRecords.length} records
              </span>
            </div>
            <button
              onClick={handleAddNewRecord}
              className="flex items-center gap-1.5 text-xs bg-accent text-accent-foreground font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-accent/90"
            >
              <Plus className="h-3.5 w-3.5" /> New {activeTab === "employees" ? "Employee" : "Record"}
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
            ) : activeTab === "employees" ? (
              /* Employees Card List */
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRecords.map((item) => {
                  const status = item["Employment Status"] || item["Status"] || "Active";
                  const statusColors: any = {
                    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    "On Leave": "bg-blue-50 text-blue-700 border-blue-200",
                    Probation: "bg-amber-50 text-amber-700 border-amber-200",
                    Suspended: "bg-rose-50 text-rose-700 border-rose-200",
                    Resigned: "bg-gray-50 text-gray-700 border-gray-200"
                  };
                  return (
                    <div
                      key={item.rowIndex}
                      onClick={() => setSelectedRecordIndex(item.rowIndex)}
                      className={`p-4 rounded-xl border transition cursor-pointer shadow-sm relative overflow-hidden group hover:border-accent/40 hover:shadow-md ${
                        selectedRecordIndex === item.rowIndex ? "bg-accent/5 border-accent/40" : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/15 text-accent font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {(item["First Name"] || "E")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-foreground truncate group-hover:text-accent transition">
                            {item["Full Name"] || `${item["First Name"]} ${item["Last Name"]}`}
                          </h4>
                          <p className="text-[10px] text-muted-foreground truncate font-medium">
                            {item["Position"] || "Junior Specialist"} • {item["Department"] || "Unassigned"}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2 font-medium">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{item["Email"] || "no-email@amineva.com"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${statusColors[status] || statusColors.Active}`}>
                          {status}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" /> {item["Office Location"] || "Accra HQ"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Universal Data Table View for supplemental HR tabs */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/25 text-muted-foreground uppercase font-bold text-[10px]">
                      <th className="p-3 pl-6 w-12">Row</th>
                      {Object.keys(records[0] || {})
                        .filter((k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_"))
                        .map((key) => (
                          <th key={key} className="p-3 font-semibold">
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
                        {Object.keys(records[0] || {})
                          .filter((k) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_"))
                          .map((key) => (
                            <td key={key} className="p-3 text-foreground truncate max-w-[200px]">
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
                      {(selectedRecord["First Name"] || selectedRecord["Employee Name"] || "N")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {selectedRecord["Full Name"] || selectedRecord["Employee Name"] || selectedRecord["Position Title"] || selectedRecord["Department Name"] || "Details Profile"}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold">
                        Row Index: {selectedRecord.rowIndex}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checklist Mode for Onboarding Checklist */}
                {activeTab === "onboarding" ? (
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
                      {Object.entries(selectedRecord)
                        .filter(([k]) => k !== "rowIndex" && k !== "_originalCells" && !k.startsWith("_"))
                        .map(([key, val]) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{key}</label>
                            <input
                              type="text"
                              value={String(val ?? "")}
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
                      const title = `Performance / One-on-One: ${selectedRecord["Full Name"] || selectedRecord["Employee Name"] || "Workspace Review"}`;
                      const participants = selectedRecord["Email"] || "";
                      onOpenMeetingModal({ title, participants });
                    }}
                    className="flex-1 bg-accent text-accent-foreground font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-accent/90"
                  >
                    <Video className="h-3.5 w-3.5" /> Schedule Meeting
                  </button>

                  <button
                    onClick={() => {
                      alert(`Mock Task Integration triggered! Created Onboarding/Approval task for: ${selectedRecord["Full Name"] || selectedRecord["Employee Name"] || "this record"}`);
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
