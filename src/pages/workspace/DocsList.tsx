import ImportButton from "@/components/workspace/ImportButton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FileText, MoreVertical, Trash2, Copy, Pencil, Share2 } from "lucide-react";
import {
  createDocument, deleteDocument, duplicateDocument, listDocuments, updateDocument,
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
    if (!window.confirm(`Delete "${d.title}"?`)) return;
    await deleteDocument(d.id);
    toast({ title: "Document deleted" });
    refresh();
  }
  async function onDuplicate(d: WorkspaceDocument) {
    const copy = await duplicateDocument(d);
    if (copy) refresh();
  }

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(q.toLowerCase()) ||
    d.content_text.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Amineva Docs</h1>
          <p className="text-sm text-muted-foreground">Professional document workspace with intelligence and Dipa assistance.</p>
        </div>
        <div className="flex items-center gap-2"><ImportButton kind="docs" /><button onClick={onCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90">
          <Plus className="h-4 w-4" /> New Document
        </button></div>
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {/* New document tile */}
          <button
            onClick={onCreate}
            className="group aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-muted/20 hover:border-accent hover:bg-accent/5 flex flex-col items-center justify-center transition"
          >
            <div className="h-12 w-12 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold text-foreground">New Document</div>
            <div className="text-[11px] text-muted-foreground mt-1">Start from scratch</div>
          </button>

          {filtered.map((d) => (
            <div key={d.id} className="relative group">
              <button
                onClick={() => navigate(`/workspace/docs/${d.id}`)}
                className="w-full aspect-[3/4] rounded-xl border border-border bg-card hover:border-accent/60 hover:shadow-lg transition overflow-hidden flex flex-col text-left"
              >
                {/* Paper preview */}
                <div className="flex-1 bg-white p-3 overflow-hidden border-b border-border relative">
                  <div className="text-[8px] text-gray-700 leading-[1.5] font-serif whitespace-pre-wrap line-clamp-[14]">
                    {d.content_text || ""}
                  </div>
                  {!d.content_text && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-200" />
                    </div>
                  )}
                  {/* Faux ruled lines for empty docs */}
                  {!d.content_text && (
                    <div className="absolute inset-x-3 top-3 bottom-3 opacity-30">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-2.5 border-b border-gray-200" />
                      ))}
                    </div>
                  )}
                </div>
                {/* Meta strip */}
                <div className="p-3 bg-card">
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-accent mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-sm truncate">{d.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold">Document</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(d.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === d.id ? null : d.id); }}
                className="absolute top-2 right-2 h-7 w-7 rounded-md bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white shadow-sm"
              >
                <MoreVertical className="h-4 w-4 text-foreground" />
              </button>
              {menuFor === d.id && (
                <div onMouseLeave={() => setMenuFor(null)} className="absolute top-10 right-2 z-20 w-40 rounded-lg border border-border bg-popover shadow-lg py-1 text-sm">
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
