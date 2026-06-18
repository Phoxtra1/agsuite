import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus, FileText, ChevronLeft, ChevronRight, MoreVertical, Pencil, Copy, Trash2, Search, Clock,
} from "lucide-react";
import {
  createDocument, deleteDocument, duplicateDocument, listDocuments, updateDocument,
  type WorkspaceDocument,
} from "@/lib/workspace/documents";
import { toast } from "@/hooks/use-toast";

export function LeftDocPanel({
  collapsed,
  onToggleCollapsed,
  currentId,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  currentId?: string;
}) {
  const [docs, setDocs] = useState<WorkspaceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true);
    setDocs(await listDocuments());
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [currentId]);

  async function onCreate() {
    const d = await createDocument();
    if (d) { await refresh(); navigate(`/workspace/docs/${d.id}`); }
  }
  async function onRename(d: WorkspaceDocument) {
    const name = window.prompt("Rename document", d.title);
    if (!name || name === d.title) return;
    await updateDocument(d.id, { title: name });
    refresh();
  }
  async function onDelete(d: WorkspaceDocument) {
    if (!window.confirm(`Delete "${d.title}"?`)) return;
    await deleteDocument(d.id);
    toast({ title: "Document deleted" });
    if (d.id === currentId) navigate("/workspace/docs");
    refresh();
  }
  async function onDuplicate(d: WorkspaceDocument) {
    const copy = await duplicateDocument(d);
    if (copy) refresh();
  }

  if (collapsed) {
    return (
      <aside className="w-12 border-r border-border bg-card flex flex-col items-center py-3 gap-2">
        <button
          onClick={onToggleCollapsed}
          className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
          title="Expand documents"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={onCreate}
          className="h-9 w-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90"
          title="New document"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="rotate-180 [writing-mode:vertical-rl] text-[11px] font-semibold tracking-wider text-muted-foreground mt-3">
          DOCUMENTS
        </div>
      </aside>
    );
  }

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(q.toLowerCase()) ||
    d.content_text.toLowerCase().includes(q.toLowerCase())
  );
  const recent = docs.slice(0, 5);

  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Documents</h2>
        <button
          onClick={onToggleCollapsed}
          className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
          title="Collapse documents"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={onCreate}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Document
        </button>
      </div>

      <div className="px-3 pb-2 relative">
        <Search className="h-3.5 w-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {!q && recent.length > 0 && (
          <div className="mt-2">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Recent
            </div>
            {recent.map((d) => (
              <DocRow
                key={`r-${d.id}`}
                doc={d}
                active={d.id === currentId}
                menuOpen={menuFor === `r-${d.id}`}
                onMenuToggle={() => setMenuFor((m) => (m === `r-${d.id}` ? null : `r-${d.id}`))}
                onOpen={() => navigate(`/workspace/docs/${d.id}`)}
                onRename={() => onRename(d)}
                onDuplicate={() => onDuplicate(d)}
                onDelete={() => onDelete(d)}
              />
            ))}
          </div>
        )}

        <div className="mt-3">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            {q ? "Results" : "All Documents"}
          </div>
          {loading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              {docs.length === 0 ? "No documents yet." : "No matches."}
            </div>
          ) : (
            filtered.map((d) => (
              <DocRow
                key={d.id}
                doc={d}
                active={d.id === currentId}
                menuOpen={menuFor === d.id}
                onMenuToggle={() => setMenuFor((m) => (m === d.id ? null : d.id))}
                onOpen={() => navigate(`/workspace/docs/${d.id}`)}
                onRename={() => onRename(d)}
                onDuplicate={() => onDuplicate(d)}
                onDelete={() => onDelete(d)}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

function DocRow({
  doc, active, menuOpen, onMenuToggle, onOpen, onRename, onDuplicate, onDelete,
}: any) {
  return (
    <div className="relative group">
      <button
        onClick={onOpen}
        className={`w-full flex items-start gap-2 px-2 py-2 rounded-md text-left text-sm transition ${
          active ? "bg-accent/15 text-foreground" : "text-foreground/80 hover:bg-muted hover:text-foreground"
        }`}
      >
        <FileText className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${active ? "text-accent" : "text-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium text-[13px]">{doc.title || "Untitled"}</div>
          <div className="text-[10px] text-muted-foreground truncate">
            {new Date(doc.updated_at).toLocaleDateString()}
          </div>
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
        className="absolute top-2 right-2 h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-background"
      >
        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {menuOpen && (
        <div className="absolute right-2 top-9 z-30 w-36 rounded-lg border border-border bg-popover shadow-lg py-1 text-xs">
          <button onClick={onRename} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-foreground">
            <Pencil className="h-3 w-3" /> Rename
          </button>
          <button onClick={onDuplicate} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-foreground">
            <Copy className="h-3 w-3" /> Duplicate
          </button>
          <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-destructive">
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
