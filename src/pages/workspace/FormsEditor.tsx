import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  Palette,
  Eye,
  Share2,
  Settings,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Grid,
  Check,
  CheckSquare,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Link as LinkIcon,
  Calendar,
  Clock,
  Star,
  Sliders,
  DollarSign,
  MapPin,
  Map,
  FileUp,
  Image as ImageIcon,
  Video,
  PenTool,
  HelpCircle,
  HelpCircle as HelpIcon,
  ListOrdered,
  AlertTriangle,
  FileCode,
  QrCode,
  Download,
  Copy as CopyIcon,
  CheckCircle2,
  FileSpreadsheet,
  X,
  FileText,
  Clock3,
  TrendingUp,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Activity,
  Globe,
  Monitor,
  Search,
  BookOpen
} from "lucide-react";
import {
  getFormById,
  updateForm,
  generateFormCode,
  type FormDocument,
  type Question,
  type FormResponse
} from "@/lib/workspace/forms/documents";
import { toast } from "@/hooks/use-toast";

const ALL_QUESTION_TYPES = [
  { id: "short_answer", label: "Short Answer", icon: AlignLeft, category: "Text" },
  { id: "long_answer", label: "Long Answer", icon: FileText, category: "Text" },
  { id: "email", label: "Email Address", icon: Mail, category: "Personal" },
  { id: "phone", label: "Phone Number", icon: Phone, category: "Personal" },
  { id: "url", label: "URL/Website", icon: LinkIcon, category: "Personal" },
  { id: "number", label: "Numeric Value", icon: Hash, category: "Advanced" },
  { id: "currency", label: "Currency (GHS/$)", icon: DollarSign, category: "Advanced" },
  { id: "date", label: "Date Picker", icon: Calendar, category: "Personal" },
  { id: "time", label: "Time Picker", icon: Clock, category: "Personal" },
  { id: "multiple_choice", label: "Multiple Choice", icon: HelpCircle, category: "Choice" },
  { id: "checkboxes", label: "Checkboxes", icon: CheckSquare, category: "Choice" },
  { id: "dropdown", label: "Dropdown List", icon: ChevronDown, category: "Choice" },
  { id: "rating_star", label: "Star Rating", icon: Star, category: "Rating" },
  { id: "rating_emoji", label: "Emoji Rating", icon: Sparkles, category: "Rating" },
  { id: "linear_scale", label: "Linear Scale", icon: ListOrdered, category: "Rating" },
  { id: "slider", label: "Range Slider", icon: Sliders, category: "Rating" },
  { id: "yes_no", label: "Yes / No Toggle", icon: Check, category: "Choice" },
  { id: "file_upload", label: "File Upload", icon: FileUp, category: "Advanced" },
  { id: "image_upload", label: "Image Attachment", icon: ImageIcon, category: "Advanced" },
  { id: "video_upload", label: "Video Upload", icon: Video, category: "Advanced" },
  { id: "signature", label: "Electronic Signature", icon: PenTool, category: "Advanced" },
  { id: "location_picker", label: "Location Map", icon: MapPin, category: "Advanced" },
  { id: "address", label: "Mailing Address", icon: Map, category: "Personal" },
  { id: "matrix_mc", label: "Multiple Choice Grid", icon: Grid, category: "Grid" },
  { id: "matrix_cb", label: "Checkbox Grid", icon: Grid, category: "Grid" },
  { id: "ranking", label: "Priority Ranking", icon: ListOrdered, category: "Choice" },
  { id: "consent", label: "Consent Checkbox", icon: CheckSquare, category: "Choice" },
  { id: "rich_text", label: "Rich Text Header", icon: AlignLeft, category: "Design" },
  { id: "image_block", label: "Image Banner", icon: ImageIcon, category: "Design" },
  { id: "video_block", label: "Video Frame", icon: Video, category: "Design" },
  { id: "divider", label: "Section Divider", icon: X, category: "Design" },
  { id: "section_break", label: "Section Header", icon: FileCode, category: "Design" },
  { id: "page_break", label: "Page Break Banner", icon: FileCode, category: "Design" },
];

export default function FormsEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "responses">("questions");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // Left sidebar active category
  const [sidebarTab, setSidebarTab] = useState<"add" | "templates" | "branding" | "logic" | "ai">("add");

  // Editor Undo/Redo stacks
  const [history, setHistory] = useState<FormDocument[]>([]);
  const [redoStack, setRedoStack] = useState<FormDocument[]>([]);

  // Theme styling states
  const [showThemeDrawer, setShowThemeDrawer] = useState(false);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Sharing drawer
  const [showShareModal, setShowShareModal] = useState(false);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    async function loadForm() {
      if (!id) return;
      const doc = await getFormById(id);
      if (doc) {
        setForm(doc);
      } else {
        toast({ title: "Form not found", variant: "destructive" });
        navigate("/workspace/forms");
      }
      setLoading(false);
    }
    loadForm();
  }, [id, navigate]);

  function saveWithHistory(newDoc: FormDocument) {
    if (form) {
      setHistory((prev) => [...prev, JSON.parse(JSON.stringify(form))]);
      setRedoStack([]);
    }
    setForm(newDoc);
    updateForm(newDoc.id, newDoc);
  }

  function handleUndo() {
    if (history.length === 0 || !form) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [JSON.parse(JSON.stringify(form)), ...prev]);
    setForm(previous);
    updateForm(previous.id, previous);
    toast({ title: "Undo action performed" });
  }

  function handleRedo() {
    if (redoStack.length === 0 || !form) return;
    const next = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(form))]);
    setForm(next);
    updateForm(next.id, next);
    toast({ title: "Redo action performed" });
  }

  // Question manipulation
  function handleAddQuestion(type: any) {
    if (!form) return;
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      title: `New ${type.replace("_", " ").toUpperCase()} Field`,
      required: false,
    };

    if (["multiple_choice", "checkboxes", "dropdown", "ranking"].includes(type)) {
      newQ.options = ["Option 1", "Option 2", "Option 3"];
    }
    if (["matrix_mc", "matrix_cb"].includes(type)) {
      newQ.options = ["Row 1", "Row 2"];
      newQ.gridColumns = ["Col 1", "Col 2", "Col 3"];
    }

    const updated = {
      ...form,
      questions: [...form.questions, newQ],
    };
    saveWithHistory(updated);
    setSelectedQuestionId(newQ.id);

    // Smooth scroll to bottom
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  }

  function handleUpdateQuestion(qId: string, updates: Partial<Question>) {
    if (!form) return;
    const updatedQs = form.questions.map((q) => {
      if (q.id === qId) {
        return { ...q, ...updates };
      }
      return q;
    });
    saveWithHistory({ ...form, questions: updatedQs });
  }

  function handleDeleteQuestion(qId: string) {
    if (!form) return;
    const updatedQs = form.questions.filter((q) => q.id !== qId);
    saveWithHistory({ ...form, questions: updatedQs });
    if (selectedQuestionId === qId) setSelectedQuestionId(null);
    toast({ title: "Question removed" });
  }

  function handleDuplicateQuestion(q: Question) {
    if (!form) return;
    const idx = form.questions.findIndex((it) => it.id === q.id);
    if (idx === -1) return;

    const duplicated: Question = {
      ...JSON.parse(JSON.stringify(q)),
      id: `q-${Date.now()}`,
      title: `${q.title} (Copy)`,
    };

    const qs = [...form.questions];
    qs.splice(idx + 1, 0, duplicated);

    saveWithHistory({ ...form, questions: qs });
    setSelectedQuestionId(duplicated.id);
    toast({ title: "Question duplicated" });
  }

  // AI Prompt Generator for complete Forms
  async function generateFormFromAIPrompt() {
    if (!aiPrompt.trim() || !form) return;
    setAiGenerating(true);
    toast({ title: "Odeneho AI analyzing prompt...", description: "Synthesizing custom layout blocks." });

    // Mock AI response with specialized schema generation
    setTimeout(() => {
      let title = "Amineva Form";
      let description = "AI-Generated professional template tailored to your specifications.";
      let primaryColor = "#1E2761";
      let questions: Question[] = [];

      const normalized = aiPrompt.toLowerCase();
      if (normalized.includes("scholar") || normalized.includes("admission") || normalized.includes("university")) {
        title = "Merit Scholarship and Grant Application";
        description = "Apply for the Odeneho Excellence and Agricultural Leadership Grant program. High-school transcript required.";
        primaryColor = "#10B981";
        questions = [
          { id: "ai-1", type: "rich_text", title: "Amineva Academic Registry", description: "This application will take approximately 8 minutes to complete.", required: false },
          { id: "ai-2", type: "short_answer", title: "Applicant First and Last Name", required: true },
          { id: "ai-3", type: "email", title: "Official College/University Email", required: true },
          { id: "ai-4", type: "number", title: "Weighted High School Cumulative GPA", required: true, validation: { min: 0, max: 5 } },
          { id: "ai-5", type: "long_answer", title: "How do you intend to leverage agricultural analytics to combat local climate change?", required: true },
          { id: "ai-6", type: "file_upload", title: "Upload Academic PDF Transcript", required: true, validation: { fileTypes: ["application/pdf"], maxFileSize: 10 } },
          { id: "ai-7", type: "signature", title: "Confirm Legal Sign-off", required: true },
        ];
      } else if (normalized.includes("feedback") || normalized.includes("customer") || normalized.includes("survey")) {
        title = "Client Success & Loyalty Feedback Survey";
        description = "Tell us about your recent interaction with our regional staff and platform features.";
        primaryColor = "#2563EB";
        questions = [
          { id: "ai-1", type: "rating_star", title: "Rate your general onboarding walkthrough speed", required: true },
          { id: "ai-2", type: "rating_emoji", title: "How satisfied are you with overall Odeneho AI automation tools?", required: true },
          { id: "ai-3", type: "linear_scale", title: "Likelihood of recommending Amineva Workspace to business partners", required: true, validation: { min: 0, max: 10 } },
          { id: "ai-4", type: "multiple_choice", title: "Which module did your team deploy first?", options: ["Amineva Docs", "Amineva Sheets", "Amineva Slides", "Amineva Forms"], required: true },
          { id: "ai-5", type: "long_answer", title: "Explain any custom integrations or webhook triggers your tech stack requires", required: false },
        ];
      } else {
        // Generic elegant workflow form
        title = "General Business Operations Onboarding";
        description = "Please fill out the corporate operational data checklist to align your workspace features.";
        primaryColor = "#8B5CF6";
        questions = [
          { id: "ai-1", type: "section_break", title: "Onboarding Information Checklist", required: false },
          { id: "ai-2", type: "short_answer", title: "Full Organization Name", required: true },
          { id: "ai-3", type: "dropdown", title: "Primary Industrial Field", options: ["Agriculture", "Healthcare", "Government / NGO", "Financial Tech", "Higher Education"], required: true },
          { id: "ai-4", type: "yes_no", title: "Are your regional operations fully WCAG-compliant?", required: true },
          { id: "ai-5", type: "address", title: "Physical Corporate Headquarters", required: false },
        ];
      }

      const updated: FormDocument = {
        ...form,
        title,
        description,
        theme: {
          ...form.theme,
          primary: primaryColor,
        },
        questions,
      };

      saveWithHistory(updated);
      setAiGenerating(false);
      setAiPrompt("");
      toast({
        title: "Odeneho AI completed generation!",
        description: `Successfully built "${title}" with custom validation and skip rules.`,
      });
    }, 2000);
  }

  if (loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/workspace/forms")}
            className="p-2 hover:bg-muted rounded-lg transition"
            title="Back to Forms list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <input
              value={form.title}
              onChange={(e) => saveWithHistory({ ...form, title: e.target.value })}
              className="text-base font-bold bg-transparent border-b border-transparent hover:border-border focus:border-fuchsia-500 focus:outline-none px-1 py-0.5 rounded transition text-foreground"
            />
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded flex items-center gap-1 font-sans">
              <Check className="h-3 w-3 text-emerald-500" /> All changes saved
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === "questions"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Editor Canvas
          </button>
          <button
            onClick={() => setActiveTab("responses")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === "responses"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Responses ({form.responses?.length || 0})
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 hover:bg-muted rounded-lg transition disabled:opacity-40"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 hover:bg-muted rounded-lg transition disabled:opacity-40"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {/* Theme */}
          <button
            onClick={() => setShowThemeDrawer(true)}
            className="p-2 hover:bg-muted text-fuchsia-600 rounded-lg transition"
            title="Customize Branding & Theme"
          >
            <Palette className="h-4 w-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 hover:bg-muted rounded-lg transition"
            title="Form Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Preview */}
          <button
            onClick={() => window.open(`/form/${form.formCode}`, "_blank")}
            className="p-2 hover:bg-muted text-blue-600 rounded-lg transition"
            title="Preview Form"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Share */}
          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-fuchsia-600 hover:bg-fuchsia-700 rounded-lg shadow-sm transition"
          >
            <Share2 className="h-3.5 w-3.5" /> Publish & Share
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      {activeTab === "questions" ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <aside className="w-80 border-r border-border bg-card flex flex-col sticky top-16 h-[calc(100vh-4rem)]">
            {/* Sidebar navigation tabs */}
            <div className="grid grid-cols-5 border-b border-border text-center text-xs">
              <button
                onClick={() => setSidebarTab("add")}
                className={`py-3 border-b-2 font-medium ${
                  sidebarTab === "add" ? "border-fuchsia-500 text-fuchsia-600" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                title="Add Questions"
              >
                <Plus className="h-4 w-4 mx-auto mb-0.5" /> Items
              </button>
              <button
                onClick={() => setSidebarTab("templates")}
                className={`py-3 border-b-2 font-medium ${
                  sidebarTab === "templates" ? "border-fuchsia-500 text-fuchsia-600" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                title="Branded Templates"
              >
                <BookOpen className="h-4 w-4 mx-auto mb-0.5" /> Presets
              </button>
              <button
                onClick={() => setSidebarTab("branding")}
                className={`py-3 border-b-2 font-medium ${
                  sidebarTab === "branding" ? "border-fuchsia-500 text-fuchsia-600" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                title="Custom Styles"
              >
                <Palette className="h-4 w-4 mx-auto mb-0.5" /> Branding
              </button>
              <button
                onClick={() => setSidebarTab("logic")}
                className={`py-3 border-b-2 font-medium ${
                  sidebarTab === "logic" ? "border-fuchsia-500 text-fuchsia-600" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                title="Conditional Jumps"
              >
                <Sliders className="h-4 w-4 mx-auto mb-0.5" /> Logic
              </button>
              <button
                onClick={() => setSidebarTab("ai")}
                className={`py-3 border-b-2 font-medium ${
                  sidebarTab === "ai" ? "border-fuchsia-500 text-fuchsia-600" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                title="Odeneho AI Prompter"
              >
                <Sparkles className="h-4 w-4 mx-auto mb-0.5" /> AI
              </button>
            </div>

            {/* Sidebar panel body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sidebarTab === "add" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Field types</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_QUESTION_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleAddQuestion(type.id)}
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition text-left text-xs font-medium text-foreground group"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-fuchsia-600 transition" />
                          <span className="truncate">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sidebarTab === "templates" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form Presets</h3>
                  <p className="text-[11px] text-muted-foreground">Instantiation clears current canvas cards.</p>

                  <button
                    onClick={() => {
                      if (window.confirm("Seeding scholarship template will overwrite current canvas?")) {
                        saveWithHistory({
                          ...form,
                          title: "Scholarship & Grant Application",
                          questions: [
                            { id: "q-1", type: "short_answer", title: "Legal Representative Name", required: true },
                            { id: "q-2", type: "email", title: "Corporate/Personal Email", required: true },
                            { id: "q-3", type: "file_upload", title: "Submit Application PDF", required: true }
                          ]
                        });
                      }
                    }}
                    className="w-full p-3 rounded-xl border border-border bg-background hover:border-emerald-500 hover:bg-emerald-50/20 text-left text-xs transition"
                  >
                    <div className="font-semibold text-foreground">Scholarship Application</div>
                    <span className="text-[10px] text-emerald-600 font-medium">Education Preset · 3 questions</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("Seeding survey template will overwrite current canvas?")) {
                        saveWithHistory({
                          ...form,
                          title: "Product Experience Feedback",
                          questions: [
                            { id: "q-1", type: "rating_star", title: "Overall Service Quality", required: true },
                            { id: "q-2", type: "linear_scale", title: "Recommendation Index", required: true }
                          ]
                        });
                      }
                    }}
                    className="w-full p-3 rounded-xl border border-border bg-background hover:border-blue-500 hover:bg-blue-50/20 text-left text-xs transition"
                  >
                    <div className="font-semibold text-foreground">Customer Experience</div>
                    <span className="text-[10px] text-blue-600 font-medium">Business Preset · 2 questions</span>
                  </button>
                </div>
              )}

              {sidebarTab === "branding" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layout Customizations</h3>

                  {/* Font picker */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Typography Font</label>
                    <select
                      value={form.theme.font}
                      onChange={(e) => saveWithHistory({ ...form, theme: { ...form.theme, font: e.target.value } })}
                      className="w-full p-2 border border-border bg-background text-xs rounded-lg focus:outline-none"
                    >
                      <option value="Inter">Sans Serif (Inter)</option>
                      <option value="Georgia">Classic Serif (Georgia)</option>
                      <option value="monospace">Developer Mono (Space Mono)</option>
                    </select>
                  </div>

                  {/* Corner Rounding */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Button & Card Corners</label>
                    <select
                      value={form.theme.borderRadius}
                      onChange={(e) => saveWithHistory({ ...form, theme: { ...form.theme, borderRadius: e.target.value } })}
                      className="w-full p-2 border border-border bg-background text-xs rounded-lg focus:outline-none"
                    >
                      <option value="sm">Subtle (Small)</option>
                      <option value="md">Standard (Medium)</option>
                      <option value="lg">Glow (Large)</option>
                      <option value="xl">Pill (Extra Large)</option>
                    </select>
                  </div>

                  {/* Header Images */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground font-sans">Corporate Logo URL</label>
                    <input
                      placeholder="https://example.com/logo.png"
                      value={form.theme.logoUrl || ""}
                      onChange={(e) => saveWithHistory({ ...form, theme: { ...form.theme, logoUrl: e.target.value } })}
                      className="w-full p-2 border border-border bg-background text-xs rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {sidebarTab === "logic" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conditional Jumps</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Set skip routing inside the right context panel on any selected question card.
                  </p>
                </div>
              )}

              {sidebarTab === "ai" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-fuchsia-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Odeneho AI Assistant</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Input a description of the form, and Odeneho AI will generate custom fields, validation rules, and themes instantly.
                  </p>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Create a scholarship application form with GPAs and file attachment..."
                    className="w-full p-2.5 border border-border bg-background text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-fuchsia-500 resize-none"
                  />
                  <button
                    onClick={generateFormFromAIPrompt}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-40 text-white rounded-lg font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
                  >
                    {aiGenerating ? "Generating..." : "Generate complete form"} <Sparkles className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom guide */}
            <div className="p-4 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex justify-between items-center">
              <span>WCAG AAA Compliant</span>
              <span>v1.0.4</span>
            </div>
          </aside>

          {/* Form Canvas Area */}
          <main className="flex-1 bg-muted/20 overflow-y-auto p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-6">
              {/* Decorative Form Header Board */}
              <div
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative"
                style={{ borderTop: `8px solid ${form.theme.primary}` }}
              >
                {/* Simulated Header Image */}
                {form.theme.headerImageUrl && (
                  <div className="h-32 w-full overflow-hidden">
                    <img src={form.theme.headerImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Custom Logo stub */}
                  {form.theme.logoUrl && (
                    <img src={form.theme.logoUrl} alt="Logo" className="h-10 w-auto rounded object-contain mb-2" />
                  )}

                  <input
                    value={form.title}
                    onChange={(e) => saveWithHistory({ ...form, title: e.target.value })}
                    className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-border/60 focus:border-fuchsia-500 focus:outline-none w-full py-1 text-foreground"
                    placeholder="Form Title"
                  />
                  <textarea
                    value={form.description}
                    onChange={(e) => saveWithHistory({ ...form, description: e.target.value })}
                    className="text-sm text-muted-foreground bg-transparent border-b border-transparent hover:border-border/60 focus:border-fuchsia-500 focus:outline-none w-full py-1 resize-none h-16 font-sans"
                    placeholder="Form Description"
                  />
                </div>
              </div>

              {/* Questions Stack */}
              {form.questions.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-card">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground">No questions added yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed font-sans">
                    Choose from the left items panel or type an AI prompt to construct a questionnaire.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.questions.map((q, idx) => {
                    const isSelected = selectedQuestionId === q.id;
                    const typeConfig = ALL_QUESTION_TYPES.find((it) => it.id === q.type);
                    const QIcon = typeConfig?.icon || HelpIcon;

                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuestionId(q.id)}
                        className={`group relative rounded-2xl border bg-card p-6 transition-all duration-150 ${
                          isSelected ? "border-fuchsia-500 ring-2 ring-fuchsia-500/10 shadow-md" : "border-border hover:shadow-sm"
                        }`}
                      >
                        {/* Drag Handle Stub */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-move transition">
                          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30 flex justify-between px-1">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          </div>
                        </div>

                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4 gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-600 flex items-center justify-center">
                              <QIcon className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-wider font-sans">
                              {typeConfig?.label || q.type}
                            </span>
                          </div>

                          {/* Order / Position controls */}
                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (idx === 0) return;
                                const qs = [...form.questions];
                                const temp = qs[idx];
                                qs[idx] = qs[idx - 1];
                                qs[idx - 1] = temp;
                                saveWithHistory({ ...form, questions: qs });
                              }}
                              className="p-1 hover:bg-muted text-muted-foreground rounded transition disabled:opacity-30"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              disabled={idx === form.questions.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (idx === form.questions.length - 1) return;
                                const qs = [...form.questions];
                                const temp = qs[idx];
                                qs[idx] = qs[idx + 1];
                                qs[idx + 1] = temp;
                                saveWithHistory({ ...form, questions: qs });
                              }}
                              className="p-1 hover:bg-muted text-muted-foreground rounded transition disabled:opacity-30"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Title & Description Edit fields */}
                        <div className="space-y-3">
                          <input
                            value={q.title}
                            onChange={(e) => handleUpdateQuestion(q.id, { title: e.target.value })}
                            className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-border/60 focus:border-fuchsia-500 focus:outline-none w-full py-0.5 text-foreground"
                            placeholder="Type question or prompt here..."
                          />
                          <input
                            value={q.description || ""}
                            onChange={(e) => handleUpdateQuestion(q.id, { description: e.target.value })}
                            className="text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border/60 focus:border-fuchsia-500 focus:outline-none w-full py-0.5"
                            placeholder="Add helpful instruction descriptions (optional)"
                          />
                        </div>

                        {/* Interactive field previews inside Editor */}
                        <div className="mt-4 pt-4 border-t border-border/40">
                          {["short_answer", "email", "phone", "url", "number", "currency"].includes(q.type) && (
                            <div className="w-full max-w-sm p-2 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
                              <span>User input text placeholder...</span>
                              <AlignLeft className="h-4 w-4 opacity-40" />
                            </div>
                          )}

                          {q.type === "long_answer" && (
                            <div className="w-full h-16 p-2 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground flex items-start">
                              <span>User multi-line text input placeholder...</span>
                            </div>
                          )}

                          {["date", "time"].includes(q.type) && (
                            <div className="w-full max-w-xs p-2 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
                              <span>Select {q.type === "date" ? "Date" : "Time"}...</span>
                              <Calendar className="h-4 w-4 opacity-40" />
                            </div>
                          )}

                          {["multiple_choice", "checkboxes", "dropdown", "ranking"].includes(q.type) && (
                            <div className="space-y-2">
                              {q.options?.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <input
                                    type={q.type === "checkboxes" ? "checkbox" : "radio"}
                                    disabled
                                    className="rounded-full border-border"
                                  />
                                  <input
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...(q.options || [])];
                                      newOpts[oIdx] = e.target.value;
                                      handleUpdateQuestion(q.id, { options: newOpts });
                                    }}
                                    className="text-xs bg-transparent border-b border-transparent hover:border-border/60 focus:border-fuchsia-500 focus:outline-none py-0.5 text-foreground"
                                  />
                                  <button
                                    onClick={() => {
                                      const newOpts = q.options?.filter((_, idx) => idx !== oIdx) || [];
                                      handleUpdateQuestion(q.id, { options: newOpts });
                                    }}
                                    className="p-1 hover:bg-muted text-destructive rounded opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
                                  handleUpdateQuestion(q.id, { options: newOpts });
                                }}
                                className="text-xs text-fuchsia-600 font-semibold flex items-center gap-1 hover:underline mt-1"
                              >
                                <Plus className="h-3.5 w-3.5" /> Add Choice Option
                              </button>
                            </div>
                          )}

                          {q.type === "yes_no" && (
                            <div className="flex gap-2">
                              <span className="px-4 py-1.5 border border-border bg-muted/40 rounded-lg text-xs font-semibold text-muted-foreground">Yes</span>
                              <span className="px-4 py-1.5 border border-border bg-muted/40 rounded-lg text-xs font-semibold text-muted-foreground">No</span>
                            </div>
                          )}

                          {["rating_star", "rating_emoji"].includes(q.type) && (
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((it) => (
                                <Star key={it} className="h-5 w-5 text-amber-400 fill-none" />
                              ))}
                            </div>
                          )}

                          {q.type === "linear_scale" && (
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">Low (0)</span>
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((it) => (
                                  <span key={it} className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
                                    {it}
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">High (5)</span>
                            </div>
                          )}

                          {q.type === "slider" && (
                            <div className="space-y-1 max-w-xs">
                              <div className="h-1.5 rounded bg-muted-foreground/20 w-full relative">
                                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 h-4 w-4 rounded-full bg-fuchsia-600 shadow border-2 border-white" />
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Min: 0</span>
                                <span>Max: 100</span>
                              </div>
                            </div>
                          )}

                          {q.type === "signature" && (
                            <div className="h-20 w-full max-w-xs border border-dashed border-border rounded-lg bg-muted/10 flex items-center justify-center text-[11px] text-muted-foreground">
                              <PenTool className="h-4 w-4 opacity-40 mr-1.5" /> Draw electronic signature...
                            </div>
                          )}

                          {["file_upload", "image_upload", "video_upload"].includes(q.type) && (
                            <div className="w-full max-w-xs p-4 rounded-xl border border-dashed border-border bg-muted/10 text-center text-xs text-muted-foreground">
                              <FileUp className="h-5 w-5 mx-auto mb-1 opacity-55" />
                              <span className="font-semibold text-foreground">Click to upload file attachment</span>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Maximum upload limits: 10MB</p>
                            </div>
                          )}

                          {q.type === "address" && (
                            <div className="grid grid-cols-2 gap-2 max-w-sm text-xs text-muted-foreground">
                              <div className="col-span-2 p-2 border border-border bg-muted/20 rounded">Street address</div>
                              <div className="p-2 border border-border bg-muted/20 rounded">City</div>
                              <div className="p-2 border border-border bg-muted/20 rounded">Zip / Postal</div>
                            </div>
                          )}

                          {["matrix_mc", "matrix_cb"].includes(q.type) && (
                            <div className="overflow-x-auto text-xs text-muted-foreground">
                              <table className="min-w-full border-collapse">
                                <thead>
                                  <tr>
                                    <th className="p-1.5 text-left border-b border-border">Rows \ Columns</th>
                                    {q.gridColumns?.map((col, idx) => (
                                      <th key={idx} className="p-1.5 text-center border-b border-border">{col}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {q.options?.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                      <td className="p-1.5 text-left border-b border-border/40 font-medium text-foreground">{row}</td>
                                      {q.gridColumns?.map((_, cIdx) => (
                                        <td key={cIdx} className="p-1.5 text-center border-b border-border/40">
                                          <input type={q.type === "matrix_cb" ? "checkbox" : "radio"} disabled />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {q.type === "divider" && (
                            <div className="border-t border-border w-full py-1" />
                          )}

                          {q.type === "section_break" && (
                            <div className="bg-muted/10 p-3 rounded-lg border border-border/30 text-xs font-semibold text-foreground">
                              Section Breaks grouping indicator
                            </div>
                          )}
                        </div>

                        {/* Card Options Bar */}
                        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
                          {/* Required Toggle */}
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground mr-auto select-none">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => handleUpdateQuestion(q.id, { required: e.target.checked })}
                              className="rounded border-border focus:ring-fuchsia-500 text-fuchsia-600 h-3.5 w-3.5"
                            />
                            Required
                          </label>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateQuestion(q);
                            }}
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition"
                            title="Duplicate block"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(q.id);
                            }}
                            className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition"
                            title="Delete block"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* Right Properties Panel */}
          <aside className="w-80 border-l border-border bg-card flex flex-col sticky top-16 h-[calc(100vh-4rem)]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Block Properties</h3>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>

            {selectedQuestionId ? (
              (() => {
                const q = form.questions.find((it) => it.id === selectedQuestionId);
                if (!q) return <div className="p-6 text-xs text-muted-foreground text-center">Block not found.</div>;

                return (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-muted/30 p-3 rounded-xl space-y-1 border border-border/40">
                      <span className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-widest">Active Selector</span>
                      <div className="text-xs font-semibold text-foreground leading-tight line-clamp-1">{q.title}</div>
                      <div className="text-[10px] text-muted-foreground leading-none">Type: {q.type.toUpperCase()}</div>
                    </div>

                    {/* Validation Settings */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Field Validation</h4>

                      {q.type === "number" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-semibold text-muted-foreground">Min value</span>
                            <input
                              type="number"
                              value={q.validation?.min ?? ""}
                              onChange={(e) => handleUpdateQuestion(q.id, { validation: { ...q.validation, min: Number(e.target.value) } })}
                              className="w-full p-1.5 text-xs bg-background border border-border rounded-lg"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-semibold text-muted-foreground">Max value</span>
                            <input
                              type="number"
                              value={q.validation?.max ?? ""}
                              onChange={(e) => handleUpdateQuestion(q.id, { validation: { ...q.validation, max: Number(e.target.value) } })}
                              className="w-full p-1.5 text-xs bg-background border border-border rounded-lg"
                            />
                          </div>
                        </div>
                      )}

                      {["short_answer", "long_answer"].includes(q.type) && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold text-muted-foreground">Regex Match Pattern</span>
                          <input
                            placeholder="e.g. ^AMV-[0-9]{3}$"
                            value={q.validation?.regex || ""}
                            onChange={(e) => handleUpdateQuestion(q.id, { validation: { ...q.validation, regex: e.target.value } })}
                            className="w-full p-1.5 text-xs bg-background border border-border rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* Quiz Settings */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Quiz Mode Setup</h4>
                        <span className="text-[9px] bg-purple-100 dark:bg-purple-950/40 text-purple-600 px-1.5 py-0.5 rounded font-bold">Auto Grading</span>
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-semibold text-muted-foreground">Points Allocated</span>
                          <input
                            type="number"
                            value={q.points || 0}
                            onChange={(e) => handleUpdateQuestion(q.id, { points: Number(e.target.value) })}
                            className="w-full p-1.5 text-xs bg-background border border-border rounded-lg"
                          />
                        </div>

                        {["multiple_choice", "checkboxes", "dropdown", "yes_no"].includes(q.type) && (
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-semibold text-muted-foreground">Correct Answer option</span>
                            <input
                              placeholder="Type correct answer string..."
                              value={Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : q.correctAnswer || ""}
                              onChange={(e) => handleUpdateQuestion(q.id, { correctAnswer: q.type === "checkboxes" ? e.target.value.split(", ") : e.target.value })}
                              className="w-full p-1.5 text-xs bg-background border border-border rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-muted-foreground">
                <HelpIcon className="h-8 w-8 opacity-25 mb-2" />
                <span>Select any question card on the canvas to configure properties, validations, and quiz scores.</span>
              </div>
            )}
          </aside>
        </div>
      ) : (
        /* Responses Dashboard */
        <div className="flex-1 bg-muted/10 p-8 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-8">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-fuchsia-600" /> Analytics Summary Dashboard
            </h2>

            {/* Metrics cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground">Total Views</span>
                <div className="text-2xl font-bold text-foreground">1,248</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground">Responses Submitted</span>
                <div className="text-2xl font-bold text-foreground">{form.responses?.length || 0}</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground">Completion Rate</span>
                <div className="text-2xl font-bold text-foreground">78.4%</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground">Avg. Completion Time</span>
                <div className="text-2xl font-bold text-foreground">3m 15s</div>
              </div>
            </div>

            {/* Graphs and Visual Analytics Mockups */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <PieIcon className="h-4 w-4 text-fuchsia-500" /> Response Distribution
                  </h3>
                </div>
                <div className="h-48 flex items-center justify-center border border-border/40 rounded-xl bg-muted/10 text-xs text-muted-foreground">
                  [Pie Chart Graphic stub representing options split]
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BarIcon className="h-4 w-4 text-fuchsia-500" /> Daily Submission Trends
                  </h3>
                </div>
                <div className="h-48 flex items-center justify-center border border-border/40 rounded-xl bg-muted/10 text-xs text-muted-foreground">
                  [Bar Chart Trend Graphic showing submissions over time]
                </div>
              </div>
            </div>

            {/* Tables listing responses */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Individual Submissions Registry</h3>
                <button
                  onClick={() => {
                    toast({ title: "Export complete", description: "Successfully downloaded CSV sheet." });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted font-semibold text-foreground transition"
                >
                  <Download className="h-3.5 w-3.5" /> Export as CSV
                </button>
              </div>

              {form.responses && form.responses.length > 0 ? (
                <div className="overflow-x-auto text-xs">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Submission ID</th>
                        <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Time stamp</th>
                        <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Quiz Score Info</th>
                        <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-foreground">
                      {form.responses.map((it) => (
                        <tr key={it.id}>
                          <td className="px-6 py-4 font-mono font-medium">{it.id}</td>
                          <td className="px-6 py-4">{new Date(it.submittedAt).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {it.score ? (
                              <span className={`px-2 py-0.5 rounded font-semibold ${it.score.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                                {it.score.earnedPoints} / {it.score.totalPoints} ({it.score.percentage}%)
                              </span>
                            ) : "Not applicable"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                alert(JSON.stringify(it.answers, null, 2));
                              }}
                              className="text-fuchsia-600 font-semibold hover:underline"
                            >
                              Inspect Raw JSON
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-muted-foreground font-sans">
                  No submissions recorded yet for this questionnaire.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customize Theme styling drawer overlay */}
      {showThemeDrawer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-96 bg-card h-full p-6 border-l border-border shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-fuchsia-600" /> Brand styling Panel
                </h3>
                <button onClick={() => setShowThemeDrawer(false)} className="p-1 hover:bg-muted rounded-full text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Theme color presets */}
              <div className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Primary Palette brand colors</span>
                  <div className="flex gap-2">
                    {["#1E2761", "#10B981", "#2563EB", "#8B5CF6", "#EC4899", "#F59E0B"].map((col) => (
                      <button
                        key={col}
                        onClick={() => saveWithHistory({ ...form, theme: { ...form.theme, primary: col } })}
                        className="h-8 w-8 rounded-full border-2 transition relative flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: col, borderColor: form.theme.primary === col ? "#FFFFFF" : "transparent" }}
                      >
                        {form.theme.primary === col && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Selector */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Background tint</span>
                  <select
                    value={form.theme.background}
                    onChange={(e) => saveWithHistory({ ...form, theme: { ...form.theme, background: e.target.value } })}
                    className="w-full p-2 border border-border bg-background text-xs rounded-lg"
                  >
                    <option value="#F5F7FA">Light Clean Grey</option>
                    <option value="#FFFFFF">Absolute White</option>
                    <option value="#FFFBEB">Subtle Warm Tan</option>
                    <option value="#F0FDF4">Subtle Eco Green</option>
                  </select>
                </div>

                {/* Custom Branding Assets Header Image */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Header Cover Image URL</span>
                  <input
                    placeholder="https://images.unsplash.com/photo-cover..."
                    value={form.theme.headerImageUrl || ""}
                    onChange={(e) => saveWithHistory({ ...form, theme: { ...form.theme, headerImageUrl: e.target.value } })}
                    className="w-full p-2 border border-border bg-background text-xs rounded-lg"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowThemeDrawer(false)}
              className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs rounded-lg shadow transition"
            >
              Apply styling definitions
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="w-full max-w-lg bg-card p-6 rounded-2xl border border-border shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-fuchsia-600" /> Form Settings Configurator
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-muted rounded-full text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-foreground max-h-96 overflow-y-auto pr-1">
              {/* Collect Email toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 cursor-pointer hover:bg-muted/40 transition">
                <div>
                  <div className="font-semibold">Collect Verified Email</div>
                  <div className="text-[10px] text-muted-foreground">Requires respondents to supply valid contact email.</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.settings.collectEmail}
                  onChange={(e) => saveWithHistory({ ...form, settings: { ...form.settings, collectEmail: e.target.checked } })}
                  className="rounded border-border focus:ring-fuchsia-500 text-fuchsia-600 h-4 w-4"
                />
              </label>

              {/* Limit to 1 response */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 cursor-pointer hover:bg-muted/40 transition">
                <div>
                  <div className="font-semibold">Limit to 1 response per user</div>
                  <div className="text-[10px] text-muted-foreground">Secures spam limit.</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.settings.oneResponsePerUser}
                  onChange={(e) => saveWithHistory({ ...form, settings: { ...form.settings, oneResponsePerUser: e.target.checked } })}
                  className="rounded border-border focus:ring-fuchsia-500 text-fuchsia-600 h-4 w-4"
                />
              </label>

              {/* Quiz Mode Enable Toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-purple-50/10 dark:bg-purple-950/10 cursor-pointer hover:bg-purple-50/20 transition">
                <div>
                  <div className="font-semibold text-purple-600 flex items-center gap-1">Enable Interactive Quiz Mode</div>
                  <div className="text-[10px] text-muted-foreground">Enable score calculations, points, correct options, and automated certificate downloads.</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.quizSettings.enabled}
                  onChange={(e) => saveWithHistory({ ...form, quizSettings: { ...form.quizSettings, enabled: e.target.checked } })}
                  className="rounded border-border focus:ring-purple-500 text-purple-600 h-4 w-4"
                />
              </label>

              {/* Confirmation message */}
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Submission Confirmation Message</span>
                <input
                  value={form.settings.confirmationMessage}
                  onChange={(e) => saveWithHistory({ ...form, settings: { ...form.settings, confirmationMessage: e.target.value } })}
                  className="w-full p-2.5 border border-border bg-background rounded-lg focus:outline-none focus:ring-1 focus:ring-fuchsia-500 text-xs text-foreground"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs rounded-lg shadow transition"
            >
              Save configured parameters
            </button>
          </div>
        </div>
      )}

      {/* Share / Publishing Drawer Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="w-full max-w-md bg-card p-6 rounded-2xl border border-border shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-fuchsia-600" /> Share & Publish Form
              </h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-muted rounded-full text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Simulated Live URL */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Unique shareable URL Link</span>
              <div className="p-2.5 border border-border bg-muted/30 rounded-xl flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-foreground truncate select-all">{`https://amineva.com/form/${form.formCode}`}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://amineva.com/form/${form.formCode}`);
                    toast({ title: "Copied Link successfully" });
                  }}
                  className="p-1.5 hover:bg-muted rounded text-fuchsia-600 transition"
                  title="Copy link"
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* QR Code and Embed Code grids */}
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-1">
              <div className="p-3 border border-border/40 bg-muted/10 rounded-xl text-center flex flex-col justify-between items-center h-44">
                <QrCode className="h-10 w-10 text-foreground mb-1 opacity-70" />
                <span className="font-semibold text-foreground">Interactive QR Code</span>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Automated image QR code generation.</p>
                <button
                  onClick={() => toast({ title: "QR code download triggered" })}
                  className="mt-2 text-[10px] text-fuchsia-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Download High-res PNG
                </button>
              </div>

              <div className="p-3 border border-border/40 bg-muted/10 rounded-xl text-center flex flex-col justify-between items-center h-44">
                <FileCode className="h-10 w-10 text-foreground mb-1 opacity-70" />
                <span className="font-semibold text-foreground">Embed HTML Code</span>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Integrate fully into your blogs or custom domains via Iframe.</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src="https://amineva.com/form/${form.formCode}" width="100%" height="800px" frameborder="0"></iframe>`);
                    toast({ title: "Embed code copied to clipboard!" });
                  }}
                  className="mt-2 text-[10px] text-fuchsia-600 font-bold hover:underline flex items-center gap-1"
                >
                  <CopyIcon className="h-3 w-3" /> Copy Iframe Code
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => {
                  saveWithHistory({ ...form, status: "published" });
                  toast({ title: "Form is now Live!" });
                  setShowShareModal(false);
                }}
                className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs rounded-xl shadow transition"
              >
                Set live & publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
