import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDocument, updateDocument, snapshotVersion, type WorkspaceDocument,
} from "@/lib/workspace/documents";
import { useDocEditor } from "@/components/workspace/docs/DocEditor";
import { Ribbon } from "@/components/workspace/docs/Ribbon";
import { LeftDocPanel } from "@/components/workspace/docs/LeftDocPanel";
import { AmnivaIntelligencePanel } from "@/components/workspace/docs/AmnivaIntelligencePanel";
import { PageCanvas, DEFAULT_PAGE_SETTINGS, type PageSettings } from "@/components/workspace/docs/PageCanvas";
import { ShareDialog } from "@/components/workspace/docs/ShareDialog";
import { exportCSV, exportDOC, exportJSON, exportPDF } from "@/components/workspace/docs/exporters";
import {
  ChevronLeft, CloudUpload, Loader2, Download, Share2, ArrowLeft, Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

export default function DocsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const [doc, setDoc] = useState<WorkspaceDocument | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [showShare, setShowShare] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [pageSettings, setPageSettingsState] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS);
  const [classification, setClassification] = useState<string | null>(null);
  const [trackChanges, setTrackChanges] = useState(false);

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const saveTimer = useRef<number | null>(null);
  const versionTimer = useRef<number | null>(null);

  // Force light mode on first ever entry into the docs editor
  useEffect(() => {
    if (!localStorage.getItem("amineva_docs_theme_init")) {
      setTheme("light");
      localStorage.setItem("amineva_docs_theme_init", "1");
    }
  }, [setTheme]);

  const editor = useDocEditor({
    initialContent: { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: () => scheduleSave(),
  });

  // Load
  useEffect(() => {
    if (!id) return;
    (async () => {
      const d = await getDocument(id);
      if (!d) { toast({ title: "Document not found", variant: "destructive" as any }); navigate("/workspace/docs"); return; }
      setDoc(d);
      setTitle(d.title);
      document.title = d.title ? `${d.title} - Amineva Docs` : "Untitled - Amineva Docs";
      editor?.commands.setContent(d.content_json || { type: "doc", content: [{ type: "paragraph" }] });
      // Restore page settings + classification from outline json
      const outline = (d as any).outline || {};
      if (outline.__page__) setPageSettingsState({ ...DEFAULT_PAGE_SETTINGS, ...outline.__page__ });
      if ((d as any).classification) setClassification((d as any).classification);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor]);

  useEffect(() => {
    document.title = title ? `${title} - Amineva Docs` : "Untitled - Amineva Docs";
  }, [title]);

  function scheduleSave(extra: Partial<any> = {}) {
    if (!id || !editor) return;
    setSaving("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const json = editor.getJSON();
      const text = editor.getText();
      const ok = await updateDocument(id, { content_json: json, content_text: text, title, ...extra } as any);
      setSaving(ok ? "saved" : "idle");
    }, 800) as any;
    if (versionTimer.current) window.clearTimeout(versionTimer.current);
    versionTimer.current = window.setTimeout(() => {
      if (editor) snapshotVersion(id, editor.getJSON());
    }, 30000) as any;
  }

  function updatePageSettings(patch: Partial<PageSettings>) {
    const next = { ...pageSettings, ...patch };
    setPageSettingsState(next);
    if (id) {
      const outline = (doc as any)?.outline || {};
      updateDocument(id, { outline: { ...outline, __page__: next } } as any);
    }
  }
  function updateClassification(tag: string) {
    setClassification(tag);
    if (id) updateDocument(id, { classification: tag } as any);
  }

  async function commitTitle() {
    if (!id) return;
    await updateDocument(id, { title });
    setDoc((d) => (d ? { ...d, title } : d));
  }

  async function handleAction(action: string, payload?: any) {
    if (!editor) return;
    if (action === "toast") { toast({ title: payload?.title || "" }); return; }
    if (action === "track:toggle") { setTrackChanges((v) => !v); toast({ title: trackChanges ? "Track changes off" : "Track changes on" }); return; }
    if (action === "comment:add") {
      const c = window.prompt("Comment");
      if (c) editor.chain().focus().insertContent(`<mark>[Comment: ${c}]</mark>`).run();
      return;
    }
    if (action === "ai") {
      try {
        const { action: a, label } = payload || {};
        const sel = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ");
        const text = sel || editor.getText();
        toast({ title: `${label}…`, description: "Amineva Intelligence is working." });
        const { data, error } = await supabase.functions.invoke("docs-intelligence", { body: { action: a, text } });
        if (error) throw error;
        const result = (data as any)?.result || (data as any)?.text;
        if (result) {
          if (sel) editor.chain().focus().deleteSelection().insertContent(result).run();
          else editor.chain().focus().insertContent(`\n\n${result}`).run();
          toast({ title: `${label} applied` });
        }
      } catch (e: any) {
        toast({ title: "AI action failed", description: e?.message, variant: "destructive" as any });
      }
    }
  }

  function applyTemplate(name: string) {
    if (!editor) return;
    const html = TEMPLATES[name] || `<h1>${name}</h1><p>Start writing your ${name.toLowerCase()} here…</p>`;
    editor.chain().focus().setContent(html).run();
    setTitle(name);
    toast({ title: `${name} template applied` });
  }

  const words = (editor?.storage as any)?.characterCount?.words?.() || 0;
  const chars = (editor?.storage as any)?.characterCount?.characters?.() || 0;

  if (!editor) return null;

  return (
    <div className="h-screen flex flex-col bg-muted/30 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/workspace/docs")}
            className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
            title="Back to documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1.5">
            <span>Workspace</span>
            <ChevronLeft className="h-3 w-3 rotate-180 opacity-50" />
            <span className="text-accent font-semibold">Amineva Docs</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex flex-col min-w-0">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); scheduleSave(); }}
              onBlur={commitTitle}
              placeholder="Untitled Document"
              className="text-base font-semibold text-foreground bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-2 py-0.5 min-w-[180px] truncate"
            />
            <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground">
              {saving === "saving" ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Saving…</span> :
               saving === "saved" ? <span className="flex items-center gap-1 text-success"><CloudUpload className="h-3 w-3"/> All changes saved</span> :
               <span>Edited just now</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu onPDF={() => surfaceRef.current && exportPDF(title, surfaceRef.current)}
            onDOC={() => exportDOC(title, editor.getHTML(), title)}
            onJSON={() => exportJSON(title, editor.getJSON())}
            onCSV={() => exportCSV(title, editor.getJSON())}
            onPrint={() => window.print()}
          />
          <button onClick={() => setShowShare(true)} className="px-4 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 inline-flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </header>

      <Ribbon
        editor={editor}
        pageSettings={pageSettings}
        onPageSettings={updatePageSettings}
        onAction={handleAction}
        wordsCount={words}
        charCount={chars}
        onToggleLeftPanel={() => setLeftCollapsed((v) => !v)}
        onToggleRightPanel={() => setRightCollapsed((v) => !v)}
        onZoom={(z) => {
          if (z === "fit-width" || z === "fit-page") setZoom(z === "fit-width" ? 1 : 0.7);
          else setZoom(z as number);
        }}
        zoom={zoom}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler((v) => !v)}
      />

      <div className="flex-1 flex overflow-hidden">
        <LeftDocPanel
          collapsed={leftCollapsed}
          onToggleCollapsed={() => setLeftCollapsed((v) => !v)}
          currentId={id}
        />

        <main className="flex-1 overflow-auto bg-muted/30 py-8 px-4" id="doc-scroll-container">
          {showRuler && (
            <div className="max-w-[900px] mx-auto h-6 bg-card border border-border rounded mb-2 flex items-center px-2 text-[9px] text-muted-foreground">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="flex-1 border-l border-border h-3" />
              ))}
            </div>
          )}
          <PageCanvas
            editor={editor}
            settings={pageSettings}
            zoom={zoom}
            surfaceRef={surfaceRef}
            onHeaderChange={(s) => updatePageSettings({ header: s })}
            onFooterChange={(s) => updatePageSettings({ footer: s })}
          />
        </main>

        <AmnivaIntelligencePanel
          editor={editor}
          collapsed={rightCollapsed}
          onToggleCollapsed={() => setRightCollapsed((v) => !v)}
          onApplyTemplate={applyTemplate}
          classification={classification}
          onSetClassification={updateClassification}
        />
      </div>

      {/* Status bar */}
      <footer className="h-7 border-t border-border bg-card flex items-center justify-between px-4 text-[11px] text-muted-foreground flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>Words: <span className="text-foreground font-medium">{words}</span></span>
          <span>Chars: <span className="text-foreground font-medium">{chars}</span></span>
          <span>{pageSettings.size} · {pageSettings.orientation}</span>
          {classification && <span className="text-accent">#{classification}</span>}
          {trackChanges && <span className="text-warning">Track changes on</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>{pageSettings.mode === "print" ? "Print Layout" : pageSettings.mode === "web" ? "Web Layout" : "Reading"}</span>
          <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="hover:text-foreground">−</button>
            <span className="min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} className="hover:text-foreground">+</button>
          </div>
        </div>
      </footer>

      {showShare && id && <ShareDialog documentId={id} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function ExportMenu({ onPDF, onDOC, onJSON, onCSV, onPrint }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border text-xs font-medium hover:bg-secondary/80 flex items-center gap-1.5">
        <Download className="h-3.5 w-3.5" /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover shadow-xl py-1 text-sm">
            {[["PDF", onPDF], ["DOC", onDOC], ["JSON", onJSON], ["CSV", onCSV], ["Print", onPrint]].map(([l, fn]: any) => (
              <button key={l} onClick={() => { setOpen(false); fn(); }} className="w-full text-left px-3 py-1.5 hover:bg-muted text-foreground">{l}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TEMPLATES: Record<string, string> = {
  "Business Proposal": `<h1>Business Proposal</h1><h2>Executive Summary</h2><p>…</p><h2>Objectives</h2><p>…</p><h2>Approach</h2><p>…</p><h2>Timeline & Investment</h2><p>…</p>`,
  "Company Profile": `<h1>Company Profile</h1><h2>About Us</h2><p>…</p><h2>Mission & Vision</h2><p>…</p><h2>Services</h2><p>…</p><h2>Leadership</h2><p>…</p>`,
  "Press Release": `<h1>FOR IMMEDIATE RELEASE</h1><h2>Headline</h2><p><strong>City — Date —</strong> …</p><p>…</p><h3>About</h3><p>…</p>`,
  "Project Report": `<h1>Project Report</h1><h2>Overview</h2><p>…</p><h2>Progress</h2><p>…</p><h2>Risks</h2><p>…</p><h2>Next Steps</h2><p>…</p>`,
  "Investment Pitch": `<h1>Investment Pitch</h1><h2>Problem</h2><p>…</p><h2>Solution</h2><p>…</p><h2>Market</h2><p>…</p><h2>Financials</h2><p>…</p><h2>Ask</h2><p>…</p>`,
  "Partnership Proposal": `<h1>Partnership Proposal</h1><h2>Opportunity</h2><p>…</p><h2>Value</h2><p>…</p><h2>Terms</h2><p>…</p>`,
  "Contract Draft": `<h1>Agreement</h1><p>This Agreement is entered into on …</p><h2>1. Scope</h2><p>…</p><h2>2. Term</h2><p>…</p><h2>3. Compensation</h2><p>…</p><h2>4. Confidentiality</h2><p>…</p>`,
  "Meeting Minutes": `<h1>Meeting Minutes</h1><p><strong>Date:</strong> …<br/><strong>Attendees:</strong> …</p><h2>Agenda</h2><ul><li>…</li></ul><h2>Decisions</h2><ul><li>…</li></ul><h2>Action Items</h2><ul><li>…</li></ul>`,
  "Research Report": `<h1>Research Report</h1><h2>Abstract</h2><p>…</p><h2>Methodology</h2><p>…</p><h2>Findings</h2><p>…</p><h2>Conclusion</h2><p>…</p>`,
  "Operational Report": `<h1>Operational Report</h1><h2>Period</h2><p>…</p><h2>KPIs</h2><p>…</p><h2>Issues</h2><p>…</p><h2>Recommendations</h2><p>…</p>`,
};
