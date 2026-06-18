import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchSharedDocument, pushSharedDocument, type SharedDocPayload } from "@/lib/workspace/documents";
import { useDocEditor, EditorSurface } from "@/components/workspace/docs/DocEditor";
import { FormattingToolbar } from "@/components/workspace/docs/EditorChrome";
import { Loader2 } from "lucide-react";

export default function SharedDocViewer() {
  const { token } = useParams();
  const [payload, setPayload] = useState<SharedDocPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [saving, setSaving] = useState(false);
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
  });

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
    <div className="min-h-screen bg-muted/20">
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card">
        <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">Amineva Docs</span>
        <span className="font-medium text-foreground text-sm">{payload.title}</span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${editable ? "bg-amber-500/15 text-amber-600" : "bg-blue-500/15 text-blue-600"}`}>
          {payload.mode === "edit" ? "Editable" : "View only"}
        </span>
        <div className="flex-1" />
        {editable && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            {saving ? <><Loader2 className="h-3 w-3 animate-spin"/> Saving…</> : "Synced"}
          </span>
        )}
      </header>

      {editable && editor && <FormattingToolbar editor={editor} />}

      <main className="py-8 px-4">
        <div style={{ width: "min(820px, 100%)", margin: "0 auto" }}>
          <EditorSurface editor={editor} />
        </div>
      </main>
    </div>
  );
}
