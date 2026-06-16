import { useEffect, useState } from "react";
import { Copy, Trash2, X } from "lucide-react";
import { createShare, listShares, revokeShare, type DocumentShare } from "@/lib/workspace/documents";
import { toast } from "@/hooks/use-toast";

export function ShareDialog({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    setShares(await listShares(documentId));
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [documentId]);

  async function onCreate(mode: "view" | "edit") {
    setBusy(true);
    await createShare(documentId, mode);
    setBusy(false);
    refresh();
  }

  function linkFor(token: string) {
    return `${window.location.origin}/share/doc/${token}`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Share document</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4"/></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => onCreate("view")} disabled={busy} className="flex-1 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 disabled:opacity-50">
              Create view-only link
            </button>
            <button onClick={() => onCreate("edit")} disabled={busy} className="flex-1 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50">
              Create editable link
            </button>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active links</h4>
            {loading ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : shares.filter((s) => !s.revoked).length === 0 ? (
              <div className="text-xs text-muted-foreground">No share links yet.</div>
            ) : (
              <ul className="space-y-2">
                {shares.filter((s) => !s.revoked).map((s) => (
                  <li key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${s.mode === "edit" ? "bg-amber-500/15 text-amber-600" : "bg-blue-500/15 text-blue-600"}`}>
                      {s.mode}
                    </span>
                    <input readOnly value={linkFor(s.token)} className="flex-1 bg-transparent text-xs text-muted-foreground outline-none truncate" />
                    <button
                      onClick={() => { navigator.clipboard.writeText(linkFor(s.token)); toast({ title: "Link copied" }); }}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy"
                    ><Copy className="h-3.5 w-3.5"/></button>
                    <button
                      onClick={async () => { await revokeShare(s.id); refresh(); }}
                      className="text-muted-foreground hover:text-destructive"
                      title="Revoke"
                    ><Trash2 className="h-3.5 w-3.5"/></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
