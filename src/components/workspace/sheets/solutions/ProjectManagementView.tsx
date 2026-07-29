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
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

interface ProjectManagementViewProps {
  // Each corresponding parsed table from the multi-tab layout
  projects: Record<string, any>[];
  tasks: Record<string, any>[];
  milestones: Record<string, any>[];
  teams: Record<string, any>[];

  // Callbacks for 2-way sync edits to the spreadsheet sheets
  onUpdateRecord: (sheetName: string, rowIndex: number, field: string, value: any) => void;
  onAddRecord: (sheetName: string, record: Record<string, any>) => void;

  // External actions
  onOpenMeetingModal: (prefilled: { title: string; participants: string }) => void;
  onScheduleEvent: (prefilled: { title: string; participants: string }) => void;
  onNotifyTeam: (message: string) => void;

  // Optional lists to join datasets
  crmRecords?: Record<string, any>[];
  hrEmployees?: Record<string, any>[];
  registryRecords?: Record<string, any>[];
}

export default function ProjectManagementView({
  projects = [],
  tasks = [],
  milestones = [],
  teams = [],
  onUpdateRecord,
  onAddRecord,
  onOpenMeetingModal,
  onScheduleEvent,
  onNotifyTeam,
  crmRecords = [],
  hrEmployees = [],
  registryRecords = []
}: ProjectManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"projects" | "timeline" | "board" | "tasks" | "dashboard" | "reports">("projects");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectEditForm, setProjectEditForm] = useState<Record<string, any>>({});

  // Quick action modals or inline creation states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: "", type: "NGO Project", owner: "", manager: "",
    department: "", team: "", startDate: "", endDate: "",
    status: "Planning", priority: "Medium", budget: 0, location: "", notes: ""
  });

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    projectId: "", name: "", assignedTo: "", priority: "Medium", status: "To Do", dueDate: "", estHours: 8
  });

  const [showNewMilestoneModal, setShowNewMilestoneModal] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({
    projectId: "", name: "", description: "", dueDate: "", status: "Not Started", progress: 0
  });

  // Unique lists for filters
  const uniqueManagers = useMemo(() => {
    return Array.from(new Set(projects.map(p => p["Project Manager"] || p.ProjectManager).filter(Boolean)));
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const name = (p["Project Name"] || p.ProjectName || "").toLowerCase();
      const owner = (p["Project Owner"] || p.ProjectOwner || "").toLowerCase();
      const manager = (p["Project Manager"] || p.ProjectManager || "").toLowerCase();
      const type = (p["Project Type"] || p.ProjectType || "").toLowerCase();
      const pId = (p["Project ID"] || p.ProjectID || "");
      const dept = (p.Department || "").toLowerCase();
      const status = (p.Status || "Planning");
      const priority = (p.Priority || "Medium");

      const matchesSearch = name.includes(search.toLowerCase()) ||
        owner.includes(search.toLowerCase()) ||
        manager.includes(search.toLowerCase()) ||
        pId.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = projectFilter === "all" || status === projectFilter;
      const matchesManager = managerFilter === "all" || manager === managerFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesManager;
    });
  }, [projects, search, projectFilter, managerFilter]);

  const activeProject = useMemo(() => {
    const id = selectedProjectId || (projects[0]?.["Project ID"] || projects[0]?.ProjectID);
    if (!id) return null;
    return projects.find(p => (p["Project ID"] || p.ProjectID) === id) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const activeProjectId = activeProject ? (activeProject["Project ID"] || activeProject.ProjectID) : null;

  // Filtered tasks and milestones of active project
  const activeProjectTasks = useMemo(() => {
    if (!activeProjectId) return [];
    return tasks.filter(t => (t["Project ID"] || t.ProjectID) === activeProjectId);
  }, [tasks, activeProjectId]);

  const activeProjectMilestones = useMemo(() => {
    if (!activeProjectId) return [];
    return milestones.filter(m => (m["Project ID"] || m.ProjectID) === activeProjectId);
  }, [milestones, activeProjectId]);

  // Project Board Kanban Grouping
  const boardColumns = ["Planning", "Active", "Under Review", "Completed"];
  const boardGroups = useMemo(() => {
    const groups: Record<string, typeof projects> = {
      Planning: [], Active: [], "Under Review": [], Completed: []
    };
    projects.forEach(p => {
      const status = p.Status || "Planning";
      if (groups[status]) {
        groups[status].push(p);
      } else {
        // map other statuses to adjacent columns
        if (status === "Not Started") groups["Planning"].push(p);
        else if (status === "On Hold") groups["Under Review"].push(p);
        else if (status === "Cancelled") groups["Under Review"].push(p);
        else groups["Planning"].push(p);
      }
    });
    return groups;
  }, [projects]);

  // Handle Project Status changes from Project Board
  const handleMoveProjectBoard = (rowIndex: number, nextStatus: string) => {
    onUpdateRecord("Projects", rowIndex, "Status", nextStatus);
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.Status === "Active").length;
    const completed = projects.filter(p => p.Status === "Completed").length;
    const overdue = projects.filter(p => {
      if (p.Status === "Completed" || p.Status === "Cancelled") return false;
      const end = p["End Date"] || p.EndDate;
      if (!end) return false;
      return new Date(end) < new Date();
    }).length;

    // Task Completion Rate
    const totalT = tasks.length;
    const completedT = tasks.filter(t => t.Status === "Done" || t.Status === "Completed").length;
    const completionRate = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;

    return {
      total, active, completed, overdue, completionRate
    };
  }, [projects, tasks]);

  // Workspace integration looks-ups
  const matchedCRM = useMemo(() => {
    if (!activeProject) return null;
    const owner = activeProject["Project Owner"] || activeProject.ProjectOwner || "";
    return crmRecords.find(c => (c.organizationName || c.Organization || "").toLowerCase().includes(owner.toLowerCase())) || null;
  }, [activeProject, crmRecords]);

  const matchedRegistry = useMemo(() => {
    if (!activeProject) return null;
    const name = activeProject["Project Name"] || activeProject.ProjectName || "";
    return registryRecords.filter(r => (r.Title || "").toLowerCase().includes(name.toLowerCase())) || [];
  }, [activeProject, registryRecords]);

  const matchedHREmployees = useMemo(() => {
    if (!activeProject) return [];
    const teamName = activeProject.Team || "";
    const teamObj = teams.find(t => (t["Team Name"] || t.TeamName || "").toLowerCase() === teamName.toLowerCase());
    if (!teamObj) return [];
    const membersEmails = (teamObj.Members || "").split(",").map((s: string) => s.trim().toLowerCase());
    return hrEmployees.filter(emp => emp.Email && membersEmails.includes(emp.Email.toLowerCase()));
  }, [activeProject, teams, hrEmployees]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = `PRJ-0${projects.length + 1}`;
    const payload = {
      "Project ID": nextId,
      "Project Name": newProjectForm.name,
      "Description": newProjectForm.notes || "No description provided.",
      "Project Type": newProjectForm.type,
      "Project Owner": newProjectForm.owner,
      "Project Manager": newProjectForm.manager,
      "Department": newProjectForm.department,
      "Team": newProjectForm.team,
      "Start Date": newProjectForm.startDate,
      "End Date": newProjectForm.endDate,
      "Status": newProjectForm.status,
      "Priority": newProjectForm.priority,
      "Progress (%)": 0,
      "Budget": Number(newProjectForm.budget) || 0,
      "Location": newProjectForm.location,
      "Notes": newProjectForm.notes
    };
    onAddRecord("Projects", payload);
    setShowNewProjectModal(false);
    setSelectedProjectId(nextId);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = `TSK-0${tasks.length + 1}`;
    const payload = {
      "Task ID": nextId,
      "Project ID": newTaskForm.projectId || activeProjectId,
      "Task Name": newTaskForm.name,
      "Assigned To": newTaskForm.assignedTo,
      "Priority": newTaskForm.priority,
      "Status": newTaskForm.status,
      "Due Date": newTaskForm.dueDate,
      "Estimated Hours": Number(newTaskForm.estHours) || 8
    };
    onAddRecord("Tasks", payload);
    setShowNewTaskModal(false);
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = `MS-0${milestones.length + 1}`;
    const payload = {
      "Milestone ID": nextId,
      "Project ID": newMilestoneForm.projectId || activeProjectId,
      "Milestone Name": newMilestoneForm.name,
      "Description": newMilestoneForm.description,
      "Due Date": newMilestoneForm.dueDate,
      "Status": newMilestoneForm.status,
      "Completion Percentage": Number(newMilestoneForm.progress) || 0
    };
    onAddRecord("Milestones", payload);
    setShowNewMilestoneModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/5 font-sans select-none">
      {/* Sub-Header bar tab selector */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { id: "projects", label: "Project Briefs", icon: Briefcase },
            { id: "timeline", label: "Timeline (Gantt)", icon: Clock },
            { id: "board", label: "Project Board", icon: FolderDot },
            { id: "tasks", label: "Task Execution", icon: CheckCircle2 },
            { id: "dashboard", label: "PM Dashboard", icon: TrendingUp },
            { id: "reports", label: "Executive Reports", icon: FileText }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 h-8 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                activeTab === t.id
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-1.5 text-xs bg-accent text-accent-foreground font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-accent/90"
          >
            <Plus className="h-3.5 w-3.5" /> New Project
          </button>
        </div>
      </div>

      {/* Main workspace container */}
      <div className="flex-1 overflow-hidden flex">
        {/* TAB 1: Projects Profile Briefs */}
        {activeTab === "projects" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left list of all projects */}
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
                <div className="flex items-center gap-2">
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="flex-1 text-[11px] p-1.5 rounded-md border border-border bg-background focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {filteredProjects.map((p) => {
                  const pId = p["Project ID"] || p.ProjectID;
                  const name = p["Project Name"] || p.ProjectName;
                  const manager = p["Project Manager"] || p.ProjectManager;
                  const prog = p["Progress (%)"] || p.Progress || 0;
                  const status = p.Status || "Planning";

                  return (
                    <button
                      key={pId}
                      onClick={() => {
                        setSelectedProjectId(pId);
                        setIsEditingProject(false);
                      }}
                      className={`w-full p-4 text-left hover:bg-muted/25 transition flex flex-col gap-2 ${
                        activeProjectId === pId ? "bg-accent/5 border-l-2 border-accent" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{pId}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          status === "Active" ? "bg-emerald-100 text-emerald-700" :
                          status === "Completed" ? "bg-blue-100 text-blue-700" :
                          status === "Planning" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-foreground leading-tight truncate">{name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">Manager: {manager}</div>
                      <div className="space-y-1 w-full pt-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Progress</span>
                          <span>{prog}%</span>
                        </div>
                        <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                          <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${prog}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right project detailed profile briefs */}
            <div className="flex-1 bg-card overflow-y-auto p-6 space-y-6">
              {activeProject ? (
                <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
                  {/* Detailed Header info */}
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded">
                          {activeProject["Project ID"] || activeProject.ProjectID}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          {activeProject["Project Type"] || activeProject.ProjectType}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        {activeProject["Project Name"] || activeProject.ProjectName}
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                        {activeProject.Description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onOpenMeetingModal({
                            title: `Project Alignment & Update on ${activeProject["Project Name"]}`,
                            participants: matchedHREmployees.map(e => e.Email).join(", ")
                          })
                        }
                        className="p-2 rounded-lg border border-border text-muted-foreground hover:text-accent hover:bg-accent/5 flex items-center justify-center"
                        title="Schedule Online Review Meeting"
                      >
                        <Video className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onNotifyTeam(`Alert: Progress on project ${activeProject["Project Name"]} is now at ${activeProject["Progress (%)"]}%!`)}
                        className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg hover:bg-muted"
                      >
                        Notify Team
                      </button>
                    </div>
                  </div>

                  {/* Core parameters fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
                      <h4 className="font-bold text-muted-foreground uppercase tracking-wide border-b border-border pb-1.5">
                        Ownership & Timeline
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Manager:</span>
                          <span className="font-semibold text-foreground">
                            {activeProject["Project Manager"] || activeProject.ProjectManager}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Owner:</span>
                          <span className="font-semibold text-foreground">
                            {activeProject["Project Owner"] || activeProject.ProjectOwner}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Team:</span>
                          <span className="font-semibold text-foreground">
                            {activeProject.Team || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span className="font-semibold text-foreground">
                            {activeProject["Start Date"] || activeProject.StartDate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span className="font-semibold text-foreground">
                            {activeProject["End Date"] || activeProject.EndDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
                      <h4 className="font-bold text-muted-foreground uppercase tracking-wide border-b border-border pb-1.5">
                        Project Status & Financials
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Priority:</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            activeProject.Priority === "Critical" ? "bg-rose-100 text-rose-700" :
                            activeProject.Priority === "High" ? "bg-amber-100 text-amber-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {activeProject.Priority || "Medium"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-semibold text-foreground">{activeProject.Status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-semibold text-emerald-600">
                            ${(Number(activeProject.Budget || activeProject["Budget"]) || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-semibold text-foreground">{activeProject.Location || "Remote"}</span>
                        </div>
                      </div>
                    </div>

                    {/* TWO-WAY SYNC EDITOR */}
                    <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/10 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-muted-foreground uppercase tracking-wide border-b border-border pb-1.5">
                          Interactive Live Sync Progress
                        </h4>
                        <div className="space-y-3 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Progress:</span>
                            <span className="font-bold text-sm text-accent">
                              {activeProject["Progress (%)"] || activeProject.Progress}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={activeProject["Progress (%)"] || activeProject.Progress || 0}
                            onChange={(e) => {
                              onUpdateRecord("Projects", activeProject.rowIndex, "Progress (%)", Number(e.target.value));
                            }}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground italic leading-tight">
                        Changes to slider are synchronized instantly with the spreadsheet grid cells.
                      </div>
                    </div>
                  </div>

                  {/* Connected Solutions Datasets Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    {/* HR integration & team */}
                    <div className="space-y-3 text-xs">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Linked HR Employee Team Directory
                      </h4>
                      <div className="space-y-2">
                        {matchedHREmployees.length > 0 ? (
                          matchedHREmployees.map(emp => (
                            <div key={emp.rowIndex} className="p-3 border border-border rounded-xl bg-muted/20 flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold">
                                {emp["Full Name"]?.[0] || emp.FullName?.[0] || "U"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">{emp["Full Name"] || emp.FullName}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{emp.Department} — {emp.Email}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-6 border-2 border-dashed border-border/40 rounded-xl text-muted-foreground italic text-[11px]">
                            No matched HR profile found. Verify the Team and Team Members lists match corporate records.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CRM integration */}
                    <div className="space-y-3 text-xs">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <FolderDot className="h-4 w-4 text-muted-foreground" />
                        CRM Partner & Customer Integration
                      </h4>
                      {matchedCRM ? (
                        <div className="p-4 border border-border rounded-xl bg-accent/5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-accent text-xs">
                              {matchedCRM.organizationName || matchedCRM.Organization}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {matchedCRM.status || matchedCRM.Status}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            CRM value contribution: <strong className="text-foreground">${(Number(matchedCRM.value || matchedCRM["Value (USD)"]) || 0).toLocaleString()}</strong>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Communication Liaison: <strong className="text-foreground">{matchedCRM.contactName || matchedCRM["Contact Person"]}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6 border-2 border-dashed border-border/40 rounded-xl text-muted-foreground italic text-[11px]">
                          No explicit CRM client match found for "{activeProject["Project Owner"] || activeProject.ProjectOwner}". Add client record to CRM tab to link.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connected Legal Registry records */}
                  <div className="space-y-3 text-xs pt-4 border-t border-border">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Legal Archive & Document Registry
                    </h4>
                    {matchedRegistry.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {matchedRegistry.map(reg => (
                          <div key={reg.rowIndex} className="p-3 border border-border rounded-xl bg-muted/20 flex items-center justify-between">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-muted-foreground">{reg["Record ID"] || reg.RecordID}</span>
                              <div className="font-semibold text-foreground truncate">{reg.Title}</div>
                            </div>
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold uppercase">{reg.Status || "Active"}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 border-2 border-dashed border-border/40 rounded-xl text-muted-foreground italic text-[11px]">
                        No linked filing records or documents detected in Registry tab for this project.
                      </div>
                    )}
                  </div>

                  {/* Milestones timeline overview */}
                  <div className="space-y-3 text-xs pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <Milestone className="h-4 w-4 text-muted-foreground" />
                        Key Planned Milestones
                      </h4>
                      <button
                        onClick={() => {
                          setNewMilestoneForm(prev => ({ ...prev, projectId: activeProjectId || "" }));
                          setShowNewMilestoneModal(true);
                        }}
                        className="text-[11px] font-bold text-accent flex items-center gap-1 hover:underline"
                      >
                        <Plus className="h-3 w-3" /> Add Milestone
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeProjectMilestones.map(m => (
                        <div key={m.rowIndex} className="p-3.5 border border-border bg-muted/10 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground text-xs">{m["Milestone Name"] || m.MilestoneName}</div>
                            <div className="text-[10px] text-muted-foreground">{m.Description}</div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-[11px] text-muted-foreground">
                              Due: <span className="font-semibold text-foreground">{m["Due Date"] || m.DueDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-foreground">{m["Completion Percentage"] || m.CompletionPercentage || 0}%</span>
                              <input
                                type="range"
                                min="0" max="100"
                                value={m["Completion Percentage"] || m.CompletionPercentage || 0}
                                onChange={(e) => onUpdateRecord("Milestones", m.rowIndex, "Completion Percentage", Number(e.target.value))}
                                className="w-16 h-1 bg-muted accent-accent cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {activeProjectMilestones.length === 0 && (
                        <div className="text-center p-6 border border-border/40 rounded-xl text-muted-foreground italic text-[11px]">
                          No milestones recorded. Click 'Add Milestone' to initiate tracking.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 stroke-1 text-muted-foreground/60 mb-2" />
                  <span>No Projects found. Generate or seed Project Management.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Gantt-style lightweight Timeline */}
        {activeTab === "timeline" && (
          <div className="flex-1 overflow-auto p-6 space-y-6 bg-card">
            <div className="border-b border-border pb-4">
              <h3 className="font-bold text-sm text-foreground">Project Timeline & Duration Roadmaps</h3>
              <p className="text-xs text-muted-foreground">Lightweight Gantt diagram computed on project dates and active progress rates.</p>
            </div>

            <div className="space-y-6 max-w-5xl">
              {projects.map((p) => {
                const pId = p["Project ID"] || p.ProjectID;
                const name = p["Project Name"] || p.ProjectName;
                const start = p["Start Date"] || p.StartDate || "2026-04-01";
                const end = p["End Date"] || p.EndDate || "2026-08-31";
                const prog = p["Progress (%)"] || p.Progress || 0;

                return (
                  <div key={pId} className="border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold text-muted-foreground">{pId}</span>
                        {name}
                      </div>
                      <div className="text-muted-foreground">
                        {start} — {end}
                      </div>
                    </div>

                    <div className="relative h-6 bg-muted/40 rounded-lg overflow-hidden border border-border/40">
                      {/* Gantt Bar representation */}
                      <div
                        className="absolute h-full bg-accent/25 border-r-2 border-accent transition-all duration-300 flex items-center px-2"
                        style={{ left: "15%", width: "70%" }}
                      >
                        <span className="text-[10px] font-bold text-accent truncate">{prog}% Complete</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Project Board View (Planning, Active, Review, Completed) */}
        {activeTab === "board" && (
          <div className="flex-1 overflow-x-auto p-6 flex gap-4 items-start bg-muted/5 select-none">
            {boardColumns.map((col) => (
              <div key={col} className="w-80 bg-card rounded-xl border border-border flex flex-col flex-shrink-0 max-h-full overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground uppercase tracking-wide">{col}</span>
                  <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2.5 py-0.5 rounded-full">
                    {boardGroups[col]?.length || 0}
                  </span>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[400px]">
                  {boardGroups[col]?.map((item) => {
                    const pId = item["Project ID"] || item.ProjectID;
                    const name = item["Project Name"] || item.ProjectName;
                    const manager = item["Project Manager"] || item.ProjectManager;
                    const prog = item["Progress (%)"] || item.Progress || 0;

                    return (
                      <div
                        key={pId}
                        onClick={() => {
                          setSelectedProjectId(pId);
                          setActiveTab("projects");
                        }}
                        className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-accent/50 cursor-pointer transition space-y-3"
                      >
                        <div className="font-bold text-xs text-foreground leading-tight">{name}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{manager}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>Completion</span>
                            <span>{prog}%</span>
                          </div>
                          <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                            <div className="bg-accent h-full rounded-full" style={{ width: `${prog}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
                          <span className="text-[10px] font-bold text-muted-foreground">{pId}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIdx = boardColumns.indexOf(col);
                                if (currentIdx < boardColumns.length - 1) {
                                  handleMoveProjectBoard(item.rowIndex, boardColumns[currentIdx + 1]);
                                }
                              }}
                              className="h-5 w-5 rounded bg-muted hover:bg-accent/10 hover:text-accent flex items-center justify-center text-muted-foreground"
                              title="Move to next stage"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {boardGroups[col]?.length === 0 && (
                    <div className="text-center py-10 text-[11px] text-muted-foreground italic border-2 border-dashed border-border/40 rounded-xl">
                      Drop projects here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Tasks View */}
        {activeTab === "tasks" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Filter by project */}
            <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Query by Project</span>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="text-[10px] bg-accent text-accent-foreground font-semibold px-2 py-1 rounded"
                >
                  <Plus className="h-3 w-3 inline mr-0.5" /> Add Task
                </button>
              </div>
              <div className="divide-y divide-border/60">
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className={`w-full p-3.5 text-left text-xs font-bold hover:bg-muted/30 transition ${
                    selectedProjectId === null ? "bg-accent/5 text-accent" : "text-foreground"
                  }`}
                >
                  All Collective Tasks ({tasks.length})
                </button>
                {projects.map((p) => {
                  const pId = p["Project ID"] || p.ProjectID;
                  const name = p["Project Name"] || p.ProjectName;
                  const count = tasks.filter(t => (t["Project ID"] || t.ProjectID) === pId).length;

                  return (
                    <button
                      key={pId}
                      onClick={() => setSelectedProjectId(pId)}
                      className={`w-full p-3.5 text-left hover:bg-muted/20 transition flex flex-col gap-1 ${
                        selectedProjectId === pId ? "bg-accent/5 border-l-2 border-accent" : ""
                      }`}
                    >
                      <div className="font-bold text-xs text-foreground truncate">{name}</div>
                      <div className="text-[10px] text-muted-foreground">{count} associated task(s)</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List & Edit active tasks */}
            <div className="flex-1 bg-card p-6 overflow-y-auto space-y-4">
              <h3 className="font-bold text-sm text-foreground">Granular Tasks Execution Registry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks
                  .filter(t => !selectedProjectId || (t["Project ID"] || t.ProjectID) === selectedProjectId)
                  .map(t => (
                    <div key={t.rowIndex} className="p-4 border border-border rounded-xl bg-muted/10 flex flex-col justify-between gap-3 shadow-sm hover:border-accent/40 transition text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground">{t["Task ID"] || t.TaskID}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            t.Status === "Completed" || t.Status === "Done" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {t.Status}
                          </span>
                        </div>
                        <div className="font-bold text-foreground text-xs leading-snug">{t["Task Name"] || t.TaskName}</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                        <span>Assignee: <strong className="text-foreground">{t["Assigned To"] || t.AssignedTo || "Unassigned"}</strong></span>
                        <span>Due: <strong className="text-foreground">{t["Due Date"] || t.DueDate}</strong></span>
                      </div>

                      {/* Interactive status sync toggle */}
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => onUpdateRecord("Tasks", t.rowIndex, "Status", "Completed")}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-bold text-[9px]"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => onUpdateRecord("Tasks", t.rowIndex, "Status", "In Progress")}
                          className="px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 font-bold text-[9px]"
                        >
                          Work On
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Executive Analytics Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Intelligent Project Management Analytics</h3>
                <p className="text-xs text-muted-foreground">Comprehensive real-time metrics parsed from synchronized spreadsheet matrices.</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 animate-pulse">
                Live PM Engine Connected
              </span>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              {[
                { label: "Total Projects", value: kpis.total, sub: "Registered Briefs", color: "bg-blue-50 text-blue-500" },
                { label: "Active Programs", value: kpis.active, sub: "Ongoing execution", color: "bg-emerald-50 text-emerald-500" },
                { label: "Completed Projects", value: kpis.completed, sub: "Successfully archived", color: "bg-indigo-50 text-indigo-500" },
                { label: "Overdue Alerts", value: kpis.overdue, sub: "Delayed timelines", color: "bg-rose-50 text-rose-500" },
                { label: "Task Execution Rate", value: `${kpis.completionRate}%`, sub: "Linked tasks completed", color: "bg-amber-50 text-amber-500" }
              ].map((k, i) => (
                <div key={i} className="p-4 border border-border bg-card rounded-xl shadow-sm space-y-2">
                  <div className={`h-8 w-8 rounded-lg ${k.color} flex items-center justify-center font-bold text-sm`}>
                    {i + 1}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">{k.label}</span>
                    <strong className="text-lg font-bold text-foreground block pt-0.5">{k.value}</strong>
                    <span className="text-[10px] text-muted-foreground leading-none">{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 border border-border bg-card rounded-xl shadow-sm">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4">Project Budgets Allocations</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projects.map(p => ({ name: p["Project Name"] || p.ProjectName, budget: Number(p.Budget) || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="budget" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 border border-border bg-card rounded-xl shadow-sm">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4">Milestone Progress Rates</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={milestones.map((m, i) => ({ name: m["Milestone Name"] || m.MilestoneName, value: Number(m["Completion Percentage"] || m.CompletionPercentage || 25) }))}
                        cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value"
                        label={({ name }) => name}
                      >
                        {milestones.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Reports View */}
        {activeTab === "reports" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl bg-card">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Executive Project Status Report</h3>
                <p className="text-xs text-muted-foreground">Generated audit trail indicating project planning status rates and task compliance statistics.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="text-xs font-bold bg-accent text-accent-foreground px-3.5 py-1.5 rounded-lg"
              >
                Print Report
              </button>
            </div>

            <div className="space-y-6 text-xs text-foreground">
              {/* Report summary table */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">1. Active Portfolios Overview</h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40 font-bold border-b border-border text-muted-foreground uppercase text-[10px]">
                        <th className="p-3">Project Name</th>
                        <th className="p-3">Manager</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Budget</th>
                        <th className="p-3">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/10 font-medium">
                          <td className="p-3">{p["Project Name"] || p.ProjectName}</td>
                          <td className="p-3">{p["Project Manager"] || p.ProjectManager}</td>
                          <td className="p-3">{p.Status}</td>
                          <td className="p-3">${(Number(p.Budget) || 0).toLocaleString()}</td>
                          <td className="p-3">{p["Progress (%)"] || p.Progress}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tasks and milestones reports list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">2. Overdue Milestone Flagged Reports</h4>
                  <div className="space-y-2">
                    {milestones.filter(m => m.Status !== "Completed" && m.Status !== "Done").map((m, i) => (
                      <div key={i} className="p-3 border border-border rounded-xl bg-rose-50/10 space-y-1">
                        <div className="font-bold text-foreground">{m["Milestone Name"] || m.MilestoneName}</div>
                        <div className="text-muted-foreground text-[10px]">Due on {m["Due Date"] || m.DueDate} — current completion rate: {m["Completion Percentage"] || m.CompletionPercentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">3. Team Workloads Allocation Compliance</h4>
                  <div className="space-y-2">
                    {teams.map((t, i) => (
                      <div key={i} className="p-3 border border-border rounded-xl space-y-1">
                        <div className="font-bold text-foreground">{t["Team Name"] || t.TeamName}</div>
                        <div className="text-muted-foreground text-[10px]">Liaison: {t.Manager} — Division: {t.Department}</div>
                        <div className="text-muted-foreground text-[10px] truncate">Members: {t.Members}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Create New Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 text-xs text-foreground space-y-4">
            <h4 className="font-bold text-sm">Add New Project Brief</h4>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Project Name</label>
                <input
                  type="text" required
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  placeholder="e.g. Agyenkwa Climate Initiative"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Project Type</label>
                  <select
                    value={newProjectForm.type}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, type: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  >
                    <option value="NGO Project">NGO Project</option>
                    <option value="Technology Project">Technology Project</option>
                    <option value="Research Project">Research Project</option>
                    <option value="Government Project">Government Project</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Priority</label>
                  <select
                    value={newProjectForm.priority}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, priority: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Project Manager</label>
                  <input
                    type="text"
                    value={newProjectForm.manager}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, manager: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                    placeholder="Emmanuel Quaye"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Project Owner</label>
                  <input
                    type="text"
                    value={newProjectForm.owner}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, owner: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                    placeholder="JICA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={newProjectForm.startDate}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, startDate: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={newProjectForm.endDate}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, endDate: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Project Budget ($)</label>
                <input
                  type="number"
                  value={newProjectForm.budget}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, budget: Number(e.target.value) })}
                  className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Filing Location / notes</label>
                <textarea
                  value={newProjectForm.notes}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, notes: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 border border-border rounded hover:bg-muted font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-accent-foreground rounded font-semibold"
                >
                  Create Brief
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create New Task */}
      {showNewTaskModal && (
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
                  placeholder="e.g. Conduct Field Survey"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Assigned To</label>
                <input
                  type="text"
                  value={newTaskForm.assignedTo}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedTo: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  placeholder="Emmanuel Quaye"
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
                  onClick={() => setShowNewTaskModal(false)}
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

      {/* MODAL 3: Create New Milestone */}
      {showNewMilestoneModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 text-xs text-foreground space-y-4">
            <h4 className="font-bold text-sm">Add New Milestone Indicator</h4>
            <form onSubmit={handleCreateMilestone} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Milestone Name</label>
                <input
                  type="text" required
                  value={newMilestoneForm.name}
                  onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, name: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  placeholder="e.g. Research Completed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Description</label>
                <input
                  type="text"
                  value={newMilestoneForm.description}
                  onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, description: e.target.value })}
                  className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  placeholder="All parameters logged"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Due Date</label>
                  <input
                    type="date"
                    value={newMilestoneForm.dueDate}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, dueDate: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Status</label>
                  <select
                    value={newMilestoneForm.status}
                    onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, status: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 rounded focus:outline-none"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMilestoneModal(false)}
                  className="px-4 py-2 border border-border rounded hover:bg-muted font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-accent-foreground rounded font-semibold"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
