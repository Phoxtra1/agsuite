import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchSharedDocument, pushSharedDocument, invalidateShareToken, type SharedDocPayload } from "@/lib/workspace/documents";
import { useDocEditor } from "@/components/workspace/docs/DocEditor";
import { PageCanvas, DEFAULT_PAGE_SETTINGS, type PageSettings } from "@/components/workspace/docs/PageCanvas";
import { ImageEditorDialog } from "@/components/workspace/docs/ImageEditorDialog";
import { Loader2, Printer } from "lucide-react";

export default function SharedDocViewer() {
  const { token } = useParams();
  const [payload, setPayload] = useState<SharedDocPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [saving, setSaving] = useState(false);
  const [pageSettings] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const saveTimer = useRef<number | null>(null);

  const editable = payload?.mode === "edit";

  const editor = useDocEditor({
    initialContent: { type: "doc", content: [{ type: "paragraph" }] },
    editable,
    onUpdate: () => {
      if (!editable || !token || !editor) return;
      setSaving(true);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        await pushSharedDocument(token, editor.getJSON(), editor.getText());
        setSaving(false);
      }, 800) as any;
    },
    onDoubleClickImage: () => {
      if (editable) {
        setShowImageEditor(true);
      }
    },
  });

  const invalidateAndSetMissing = async () => {
    if (!token || isInvalidating) return;
    setIsInvalidating(true);
    await invalidateShareToken(token);
    setStatus("missing");
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const handleAfterPrint = async () => {
      await invalidateAndSetMissing();
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [token, isInvalidating]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const p = await fetchSharedDocument(token);
      if (!p) { setStatus("missing"); return; }
      setPayload(p);
      editor?.commands.setContent(p.content_json || { type: "doc", content: [{ type: "paragraph" }] });
      editor?.setEditable(p.mode === "edit");
      setStatus("ready");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, editor]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading shared document…</div>;
  }
  if (status === "missing" || !payload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <h1 className="text-xl font-semibold text-foreground">Link unavailable</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          This share link has been revoked, expired, or never existed.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card sticky top-0 z-30 print:hidden">
        <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">Amineva Docs</span>
        <span className="font-medium text-foreground text-sm truncate">{payload.title}</span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${editable ? "bg-amber-500/15 text-amber-600" : "bg-blue-500/15 text-blue-600"}`}>
          {payload.mode === "edit" ? "Editable" : "View only"}
        </span>
        <div className="flex-1" />
        <button
          onClick={handlePrint}
          className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border text-xs font-medium hover:bg-secondary/80 flex items-center gap-1.5 transition"
          title="Print Document (Link will become invalid after printing)"
        >
          <Printer className="h-3.5 w-3.5" /> Print Document
        </button>
        {editable && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 animate-pulse ml-2">
            {saving ? <><Loader2 className="h-3 w-3 animate-spin"/> Saving…</> : "Synced"}
          </span>
        )}
      </header>

      <main className="py-8 px-4" id="doc-scroll-container">
        <PageCanvas
          editor={editor}
          settings={pageSettings}
          zoom={1}
          surfaceRef={surfaceRef}
        />
      </main>

      {showImageEditor && editor && (
        <ImageEditorDialog editor={editor} onClose={() => setShowImageEditor(false)} />
      )}
    </div>
  );
}
