import ImportButton from "@/components/workspace/ImportButton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ClipboardList,
  MoreVertical,
  Trash2,
  Copy,
  Pencil,
  Eye,
  FileText,
  CheckCircle2,
  GraduationCap,
  Users,
  Settings,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  listForms,
  createForm,
  deleteForm,
  duplicateForm,
  updateForm,
  FORM_TEMPLATES,
  type FormDocument,
} from "@/lib/workspace/forms/documents";
import { toast } from "@/hooks/use-toast";

export default function FormsList() {
  const [forms, setForms] = useState<FormDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const navigate = useNavigate();

  async function loadData() {
    setLoading(true);
    const list = await listForms();
    setForms(list);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateNew(templateId?: string) {
    let title = "Untitled Form";
    if (templateId) {
      const found = FORM_TEMPLATES.find((t) => t.id === templateId);
      if (found) title = found.title || "Untitled Form";
    } else {
      const prompted = window.prompt("Enter form title:", "Untitled Form");
      if (prompted === null) return;
      if (prompted.trim()) title = prompted.trim();
    }

    const created = await createForm(title, templateId);
    if (created) {
      toast({
        title: "Form created",
        description: `Successfully instantiated "${created.title}".`,
      });
      navigate(`/workspace/forms/${created.id}`);
    } else {
      toast({
        title: "Error",
        description: "Could not create form.",
        variant: "destructive",
      });
    }
  }

  async function handleRename(f: FormDocument) {
    const prompted = window.prompt("Rename form:", f.title);
    if (prompted && prompted.trim() !== f.title) {
      const ok = await updateForm(f.id, { title: prompted.trim() });
      if (ok) {
        toast({ title: "Renamed successfully" });
        loadData();
      }
    }
    setMenuForId(null);
  }

  async function handleDuplicate(f: FormDocument) {
    const duplicated = await duplicateForm(f);
    if (duplicated) {
      toast({ title: "Form duplicated" });
      loadData();
    }
    setMenuForId(null);
  }

  async function handleDelete(f: FormDocument) {
    if (window.confirm(`Are you sure you want to delete "${f.title}"?`)) {
      const ok = await deleteForm(f.id);
      if (ok) {
        toast({ title: "Form deleted" });
        loadData();
      }
    }
    setMenuForId(null);
  }

  const filteredForms = forms.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-600 text-xs font-semibold">
              Module
            </span>
            <span className="text-muted-foreground text-xs">Amineva Forms Builder</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Amineva Forms</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Enterprise-grade data capture, surveys, and auto-graded assessments powered by Dipa AI. Custom styling, interactive grids, advanced logic skip triggers, and professional reporting dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2"><ImportButton kind="forms" /><button
          onClick={() => handleCreateNew()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700 shadow transition-all duration-150 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" /> Create Form
        </button></div>
      </div>

      {/* Template Gallery Header */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" /> Start from an Dipa Template Preset
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Blank */}
          <button
            onClick={() => handleCreateNew()}
            className="group p-5 rounded-2xl border-2 border-dashed border-border bg-card/40 hover:border-fuchsia-500 hover:bg-fuchsia-500/5 hover:shadow-md transition text-left flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Blank Canvas</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Build a form from scratch with complete drag-and-drop customization.
              </p>
            </div>
            <span className="text-[10px] text-fuchsia-600 font-semibold mt-4 block">
              Start scratch · 0 questions
            </span>
          </button>

          {/* Presets */}
          <button
            onClick={() => handleCreateNew("tpl-scholarship")}
            className="group p-5 rounded-2xl border border-border bg-card hover:border-fuchsia-500/60 hover:shadow-md transition text-left flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Scholarship Application</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Personal info, academic GPAs, research proposals, uploads, and signature fields.
              </p>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-4 block">
              Education Preset · 8 questions
            </span>
          </button>

          <button
            onClick={() => handleCreateNew("tpl-customer-feedback")}
            className="group p-5 rounded-2xl border border-border bg-card hover:border-fuchsia-500/60 hover:shadow-md transition text-left flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Customer Experience</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Star metrics, support emojis, recommendation NPS scales, checkboxes, and comment fields.
              </p>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold mt-4 block">
              Business Preset · 5 questions
            </span>
          </button>

          <button
            onClick={() => handleCreateNew("tpl-quiz")}
            className="group p-5 rounded-2xl border border-border bg-card hover:border-fuchsia-500/60 hover:shadow-md transition text-left flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Knowledge Assessment Quiz</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Auto-grading MCQ, checkboxes, points allocation, timers, and passing score triggers.
              </p>
            </div>
            <span className="text-[10px] text-purple-600 font-semibold mt-4 block">
              Quiz Mode Preset · 3 questions
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search forms by title, keywords or description…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 transition-all"
        />
      </div>

      {/* Forms Listing Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600" />
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/10">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-foreground">No forms found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try starting with a blank canvas or picking one of our template presets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredForms.map((f) => {
            const totalQuestions = f.questions?.length || 0;
            const isQuiz = f.quizSettings?.enabled;

            return (
              <div key={f.id} className="group relative">
                <div
                  onClick={() => navigate(`/workspace/forms/${f.id}`)}
                  className="cursor-pointer h-full rounded-2xl border border-border bg-card hover:border-fuchsia-500/50 hover:shadow-lg transition-all duration-250 flex flex-col justify-between overflow-hidden"
                >
                  {/* Decorative Banner */}
                  <div
                    className="h-3 relative"
                    style={{ backgroundColor: f.theme?.primary || "#1E2761" }}
                  />

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground text-base group-hover:text-fuchsia-600 transition-colors line-clamp-1">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-sans">
                        {f.description || "No description provided."}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3 pt-3 border-t border-border">
                      {/* Meta Pills */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {f.status === "published" ? (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                            Live
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                            Draft
                          </span>
                        )}

                        {isQuiz && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold">
                            Quiz
                          </span>
                        )}

                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-600 font-bold">
                          {totalQuestions} Qs
                        </span>
                      </div>

                      {/* Info Row */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Updated {new Date(f.updatedAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1 text-fuchsia-600 font-semibold group-hover:underline">
                          Open Editor <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* More actions overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuForId(menuForId === f.id ? null : f.id);
                  }}
                  className="absolute top-5 right-4 h-8 w-8 rounded-lg bg-background/80 backdrop-blur border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-background shadow-sm transition"
                >
                  <MoreVertical className="h-4 w-4 text-foreground" />
                </button>

                {menuForId === f.id && (
                  <div
                    onMouseLeave={() => setMenuForId(null)}
                    className="absolute top-14 right-4 z-30 w-44 rounded-xl border border-border bg-popover shadow-xl py-1 text-sm animate-fade-in"
                  >
                    <button
                      onClick={() => {
                        navigate(`/workspace/forms/${f.id}`);
                        setMenuForId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                    >
                      <Pencil className="h-4 w-4" /> Open Editor
                    </button>
                    <button
                      onClick={() => handleRename(f)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                    >
                      <FileText className="h-4 w-4" /> Rename Form
                    </button>
                    <button
                      onClick={() => handleDuplicate(f)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                    >
                      <Copy className="h-4 w-4" /> Duplicate
                    </button>
                    <button
                      onClick={() => {
                        window.open(`/form/${f.formCode}`, "_blank");
                        setMenuForId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                    >
                      <Eye className="h-4 w-4" /> View Public
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => handleDelete(f)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-left text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Form
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
