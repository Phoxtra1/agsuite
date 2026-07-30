import { useState } from "react";
import {
  Sparkles, FileText, CheckCircle, Tag, Wand2, RefreshCw, Languages, FileOutput,
  ChevronRight, ChevronLeft, Loader2, Scale,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DipaLegalPanel } from "./DipaLegalPanel";

type Tab = "intelligence" | "legal" | "templates" | "analyzer" | "classification";

const ACTIONS: { id: string; label: string; icon: any; action: string }[] = [
  { id: "summarize", label: "Summarize Document", icon: FileText, action: "summarize" },
  { id: "rewrite", label: "Rewrite Selection", icon: RefreshCw, action: "rewrite" },
  { id: "grammar", label: "Improve Grammar", icon: CheckCircle, action: "grammar" },
  { id: "tone", label: "Improve Tone", icon: Sparkles, action: "tone" },
  { id: "translate", label: "Translate", icon: Languages, action: "translate" },
  { id: "expand", label: "Expand Content", icon: Wand2, action: "expand" },
  { id: "shorten", label: "Shorten Content", icon: Wand2, action: "shorten" },
  { id: "exec", label: "Executive Summary", icon: FileOutput, action: "executive_summary" },
  { id: "actions", label: "Extract Action Items", icon: CheckCircle, action: "action_items" },
  { id: "decisions", label: "Extract Decisions", icon: Tag, action: "decisions" },
  { id: "risks", label: "Extract Risks", icon: FileText, action: "risks" },
];

const TEMPLATES = [
  "Business Proposal", "Company Profile", "Press Release", "Project Report",
  "Investment Pitch", "Partnership Proposal", "Contract Draft", "Meeting Minutes",
  "Research Report", "Operational Report",
];

const TAGS = ["Business", "Finance", "Legal", "Research", "News", "Marketing", "Operations", "Personal"];

export function AmnivaIntelligencePanel({
  editor,
  collapsed,
  onToggleCollapsed,
  onApplyTemplate,
  classification,
  onSetClassification,
}: {
  editor: Editor | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onApplyTemplate?: (name: string) => void;
  classification?: string | null;
  onSetClassification?: (tag: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("intelligence");
  const [busy, setBusy] = useState<string | null>(null);
  const [output, setOutput] = useState<string>("");

  if (collapsed) {
    return (
      <aside className="w-10 border-l border-border bg-card flex flex-col items-center py-3 gap-2">
        <button
          onClick={onToggleCollapsed}
          className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
          title="Expand Dipa"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="rotate-180 [writing-mode:vertical-rl] text-[11px] font-semibold tracking-wider text-muted-foreground mt-2">
          Dipa
        </div>
        <Sparkles className="h-4 w-4 text-accent mt-2" />
      </aside>
    );
  }

  async function runAction(action: string, label: string) {
    if (!editor) return;
    setBusy(action);
    setOutput("");
    try {
      const selection = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        " "
      );
      const text = selection || editor.getText();
      const { data, error } = await supabase.functions.invoke("docs-intelligence", {
        body: { action, text, scope: selection ? "selection" : "document" },
      });
      if (error) throw error;
      const result = (data as any)?.result || (data as any)?.text || "";
      if (!result) {
        toast({ title: `${label}: no result`, variant: "destructive" as any });
        return;
      }
      setOutput(result);
      toast({ title: `${label} ready`, description: "Review the output below." });
    } catch (e: any) {
      toast({ title: `${label} failed`, description: e?.message || "Try again.", variant: "destructive" as any });
    } finally {
      setBusy(null);
    }
  }

  function insertOutput(mode: "replace" | "append") {
    if (!editor || !output) return;
    const chain = editor.chain().focus();
    if (mode === "replace" && editor.state.selection.from !== editor.state.selection.to) {
      chain.deleteSelection().insertContent(output).run();
    } else {
      chain.insertContent(`\n\n${output}`).run();
    }
    setOutput("");
  }

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Dipa</h2>
        </div>
        <button
          onClick={onToggleCollapsed}
          className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
          title="Collapse panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-border">
        {(["intelligence", "legal", "templates", "analyzer", "classification"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium text-center capitalize border-b-2 ${
              tab === t ? "border-accent text-foreground bg-accent/5 font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "intelligence" ? "Dipa" : t === "legal" ? "Dipa Legal" : t === "classification" ? "Tags" : t}
          </button>
        ))}
      </div>

      {tab === "legal" ? (
        <div className="flex-1 overflow-hidden">
          <DipaLegalPanel editor={editor} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "intelligence" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select text or use the whole document. Dipa is ready to assist you.
              </p>
              <button
                onClick={() => setTab("legal")}
                className="flex items-center justify-between w-full px-3 py-2.5 bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-xl font-bold text-amber-700 dark:text-amber-300 hover:border-amber-500 transition text-xs"
              >
                <span className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-500" />
                  <span>Launch Dipa Legal Assessment</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <div className="grid gap-1.5">
                {ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    disabled={!!busy}
                    onClick={() => runAction(a.action, a.label)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-foreground bg-background border border-border rounded-lg hover:border-accent hover:text-accent transition disabled:opacity-50"
                  >
                    {busy === a.action ? <Loader2 className="h-4 w-4 animate-spin" /> : <a.icon className="h-4 w-4 opacity-70" />}
                    <span className="font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
              {output && (
                <div className="mt-3 border border-border rounded-lg bg-muted/30 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Result</div>
                  <div className="text-xs text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">{output}</div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => insertOutput("replace")} className="flex-1 text-xs px-2 py-1.5 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 font-medium">Replace selection</button>
                    <button onClick={() => insertOutput("append")} className="flex-1 text-xs px-2 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium">Append</button>
                  </div>
                </div>
              )}
            </div>
          )}

        {tab === "templates" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Start from a professional template.</p>
            <div className="grid gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => onApplyTemplate?.(t)}
                  className="px-3 py-2 text-left text-sm text-foreground bg-background border border-border rounded-lg hover:bg-muted transition"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "analyzer" && <AnalyzerTab editor={editor} />}

        {tab === "classification" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Classify this document.</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => onSetClassification?.(t)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
                    classification === t
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-muted text-foreground border-border hover:bg-accent/10 hover:text-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {classification && (
              <p className="text-[11px] text-muted-foreground mt-3">
                Current classification: <span className="text-foreground font-medium">{classification}</span>
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </aside>
  );
}

function AnalyzerTab({ editor }: { editor: Editor | null }) {
  const text = editor?.getText() || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const avgWordsPerSentence = Math.round(words / sentences);
  const readability =
    avgWordsPerSentence < 14 ? "High" : avgWordsPerSentence < 22 ? "Medium" : "Dense";
  const score = Math.min(100, Math.round((words / 5) + (readability === "High" ? 30 : 15)));

  return (
    <div className="space-y-5">
      <div className="p-4 bg-muted/40 rounded-xl border border-border flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-bold text-accent mb-1">{score}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Document Score</div>
      </div>
      <div className="space-y-2.5">
        {[
          { label: "Words", val: String(words) },
          { label: "Characters", val: String(chars) },
          { label: "Sentences", val: String(sentences) },
          { label: "Avg words / sentence", val: String(avgWordsPerSentence) },
          { label: "Readability", val: readability },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
