import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FileText, MoreVertical, Trash2, Copy, Pencil } from "lucide-react";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  updateDocument,
  type WorkspaceDocument,
} from "@/lib/workspace/documents";
import { toast } from "@/hooks/use-toast";

export default function DocsList() {
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
  useEffect(() => { refresh(); }, []);

  async function onCreate() {
    const d = await createDocument();
    if (d) navigate(`/workspace/docs/${d.id}`);
  }

  async function onRename(d: WorkspaceDocument) {
    const name = window.prompt("Rename document", d.title);
    if (!name || name === d.title) return;
    await updateDocument(d.id, { title: name });
    refresh();
  }

  async function onDelete(d: WorkspaceDocument) {
    if (!window.confirm(`Delete "${d.title}"? This can't be undone.`)) return;
    await deleteDocument(d.id);
    toast({ title: "Document deleted" });
    refresh();
  }

  async function onDuplicate(d: WorkspaceDocument) {
    const copy = await duplicateDocument(d);
    if (copy) refresh();
  }

  const filtered = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(q.toLowerCase()) ||
      d.content_text.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AG Docs</h1>
          <p className="text-sm text-muted-foreground">Structured documents with intelligence tagging and exports.</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" /> New document
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search documents…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {docs.length === 0 ? "No documents yet." : "No matching documents."}
          </p>
          {docs.length === 0 && (
            <button onClick={onCreate} className="text-sm font-medium text-accent hover:underline">
              Create your first document
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="relative group">
              <button
                onClick={() => navigate(`/workspace/docs/${d.id}`)}
                className="w-full text-left p-5 rounded-xl border border-border bg-card hover:border-accent/60 hover:shadow-sm transition"
              >
                <FileText className="h-6 w-6 text-accent mb-3" />
                <h3 className="font-semibold text-foreground line-clamp-1">{d.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                  {d.content_text || "Empty document"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Updated {new Date(d.updated_at).toLocaleDateString()}
                </p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === d.id ? null : d.id); }}
                className="absolute top-3 right-3 h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              {menuFor === d.id && (
                <div
                  onMouseLeave={() => setMenuFor(null)}
                  className="absolute top-10 right-3 z-10 w-40 rounded-lg border border-border bg-popover shadow-lg py-1 text-sm"
                >
                  <MenuItem icon={Pencil} label="Rename" onClick={() => { setMenuFor(null); onRename(d); }} />
                  <MenuItem icon={Copy} label="Duplicate" onClick={() => { setMenuFor(null); onDuplicate(d); }} />
                  <MenuItem icon={Trash2} label="Delete" destructive onClick={() => { setMenuFor(null); onDelete(d); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, destructive }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left ${
        destructive ? "text-destructive" : "text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
