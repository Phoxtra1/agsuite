import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDocument,
  updateDocument,
  snapshotVersion,
  type WorkspaceDocument,
} from "@/lib/workspace/documents";
import { useDocEditor, EditorSurface } from "@/components/workspace/docs/DocEditor";
import { MenuBar, FormattingToolbar } from "@/components/workspace/docs/EditorChrome";
import { AGIntelligencePanel } from "@/components/workspace/docs/AGIntelligencePanel";
import { ShareDialog } from "@/components/workspace/docs/ShareDialog";
import { exportCSV, exportDOC, exportJSON, exportPDF } from "@/components/workspace/docs/exporters";
import { ChevronLeft, CloudUpload, Loader2, Download, Search, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DocsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocument | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [showShare, setShowShare] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [zoom, setZoom] = useState(1);

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const saveTimer = useRef<number | null>(null);
  const versionTimer = useRef<number | null>(null);

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
      editor?.commands.setContent(d.content_json || { type: "doc", content: [{ type: "paragraph" }] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor]);

  function scheduleSave() {
    if (!id || !editor) return;
    setSaving("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const json = editor.getJSON();
      const text = editor.getText();
      const ok = await updateDocument(id, { content_json: json, content_text: text, title });
      setSaving(ok ? "saved" : "idle");
    }, 800) as any;

    if (versionTimer.current) window.clearTimeout(versionTimer.current);
    versionTimer.current = window.setTimeout(() => {
      if (editor) snapshotVersion(id, editor.getJSON());
    }, 30000) as any;
  }

  async function commitTitle() {
    if (!id) return;
    await updateDocument(id, { title });
    setDoc((d) => (d ? { ...d, title } : d));
  }

  async function handleAction(action: string) {
    if (!editor) return;
    const json = editor.getJSON();
    const text = editor.getText();
    const html = editor.getHTML();

    switch (action) {
      case "file:new": navigate("/workspace/docs"); break;
      case "file:open": navigate("/workspace/docs"); break;
      case "file:save": {
        if (!id) return;
        await updateDocument(id, { title, content_json: json, content_text: text });
        await snapshotVersion(id, json);
        setSaving("saved");
        toast({ title: "Saved" });
        break;
      }
      case "file:rename": {
        const name = window.prompt("Rename document", title);
        if (name) { setTitle(name); if (id) await updateDocument(id, { title: name }); }
        break;
      }
      case "file:export-pdf":
        if (surfaceRef.current) exportPDF(title, surfaceRef.current);
        break;
      case "file:export-doc": exportDOC(title, html, title); break;
      case "file:export-json": exportJSON(title, json); break;
      case "file:export-csv": exportCSV(title, json); break;
      case "file:share": setShowShare(true); break;
      case "file:print": window.print(); break;

      case "edit:undo": editor.chain().focus().undo().run(); break;
      case "edit:redo": editor.chain().focus().redo().run(); break;
      case "edit:find": {
        const term = window.prompt("Find text");
        if (term) {
          const idx = text.toLowerCase().indexOf(term.toLowerCase());
          toast({ title: idx >= 0 ? `Found at position ${idx}` : "Not found" });
        }
        break;
      }
      case "edit:replace": {
        const term = window.prompt("Find");
        if (!term) break;
        const repl = window.prompt(`Replace "${term}" with`);
        if (repl === null) break;
        const newText = text.split(term).join(repl);
        editor.chain().focus().selectAll().insertContent(newText).run();
        break;
      }

      case "insert:image": {
        const url = window.prompt("Image URL");
        if (url) editor.chain().focus().setImage({ src: url }).run();
        break;
      }
      case "insert:table":
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break;
      case "insert:link": {
        const url = window.prompt("Link URL", "https://");
        if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        break;
      }
      case "insert:divider": editor.chain().focus().setHorizontalRule().run(); break;

      case "fmt:bold": editor.chain().focus().toggleBold().run(); break;
      case "fmt:italic": editor.chain().focus().toggleItalic().run(); break;
      case "fmt:underline": editor.chain().focus().toggleUnderline().run(); break;
      case "fmt:clear": editor.chain().focus().clearNodes().unsetAllMarks().run(); break;

      case "tool:wordcount": {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        toast({ title: `${words} words`, description: `${text.length} characters` });
        break;
      }
      case "tool:structure": setShowStructure((v) => !v); break;

      case "view:zoom-in": setZoom((z) => Math.min(2.0, +(z + 0.1).toFixed(2))); break;
      case "view:zoom-out": setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2))); break;
      case "view:zoom-reset": setZoom(1); break;
      case "view:fullscreen":
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
        break;
    }
  }

  const headings = useMemo(() => {
    if (!doc?.content_json) return [];
    const out: { level: number; text: string }[] = [];
    const walk = (n: any) => {
      if (!n) return;
      if (n.type === "heading") {
        out.push({ level: n.attrs?.level || 1, text: (n.content || []).map((c: any) => c.text || "").join("") });
      }
      (n.content || []).forEach(walk);
    };
    walk(doc.content_json);
    return out;
  }, [doc]);

  if (!editor) return null;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/workspace/docs")} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium">
            Workspace
            <ChevronLeft className="h-4 w-4 opacity-50" />
            <span className="text-accent font-semibold">AG Docs</span>
          </button>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          <div className="flex flex-col">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); scheduleSave(); }}
              onBlur={commitTitle}
              placeholder="Untitled Document"
              className="text-lg font-bold text-foreground bg-transparent border-0 outline-none focus:ring-2 focus:ring-accent/40 rounded px-2 py-0.5 min-w-[200px]"
            />
            <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground mt-0.5">
              {saving === "saving" ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin text-accent"/> Saving...</span> :
               saving === "saved" ? <span className="flex items-center gap-1"><CloudUpload className="h-3 w-3 text-success"/> Saved</span> : null}
              <span className="opacity-50">•</span>
              <span>Last edited just now</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
            <button
              onClick={() => handleAction('edit:find')}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-background"
              title="Search Document"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => handleAction('file:export-pdf')}
            className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border text-xs font-medium hover:bg-secondary/80 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="px-4 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90"
          >
            Share
          </button>
          <Avatar className="h-8 w-8 ml-2 border border-border cursor-pointer hover:ring-2 hover:ring-accent/50 transition-all">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AG</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <MenuBar editor={editor} onAction={handleAction} />
      <FormattingToolbar editor={editor} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Outline */}
        {showStructure && (
          <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
            <div className="p-3 border-b border-border bg-card">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Outline</h3>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {headings.length === 0 ? (
                <p className="text-xs text-muted-foreground">Add headings to build a structure outline.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {headings.map((h, i) => (
                    <li key={i} style={{ paddingLeft: (h.level - 1) * 12 }} className="text-foreground/80 hover:text-foreground hover:bg-muted/50 px-2 py-1 rounded cursor-pointer truncate transition-colors">
                      {h.text || "Untitled section"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}

        {/* Center - Editor Surface */}
        <main className="flex-1 overflow-auto py-8 px-4 bg-muted/20 relative" id="doc-scroll-container">
          <div ref={surfaceRef} style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: "min(850px, 100%)", margin: "0 auto", paddingBottom: "100px" }}>
            <EditorSurface editor={editor} />
          </div>
        </main>

        {/* Right Sidebar - AG Intelligence */}
        <AGIntelligencePanel editor={editor} />
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 border-t border-border bg-card flex items-center justify-between px-4 text-[11px] font-medium text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
            Words: {editor.storage.characterCount?.words() || 0}
          </span>
          <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
            Characters: {editor.storage.characterCount?.characters() || 0}
          </span>
          <span>Page 1</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-foreground cursor-pointer">English (US)</span>
          <div className="flex items-center gap-2 bg-muted/50 px-2 py-0.5 rounded">
            <button onClick={() => handleAction('view:zoom-out')} className="hover:text-foreground">-</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleAction('view:zoom-in')} className="hover:text-foreground">+</button>
          </div>
          <span className="text-success">{saving === "saved" ? "Saved" : saving === "saving" ? "Saving..." : "Saved"}</span>
        </div>
      </footer>

      {showShare && id && <ShareDialog documentId={id} onClose={() => setShowShare(false)} />}
    </div>
  );
}
