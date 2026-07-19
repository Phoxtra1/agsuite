import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Sheet as SheetIcon, MoreVertical, Trash2, Copy, Pencil } from "lucide-react";
import {
  createSheet, deleteSheet, duplicateSheet, listSheets, updateSheet,
  type WorkspaceSheet,
} from "@/lib/workspace/sheets/documents";
import { toast } from "@/hooks/use-toast";

export default function SheetsList() {
  const [sheets, setSheets] = useState<WorkspaceSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true);
    setSheets(await listSheets());
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function onCreate() {
    const s = await createSheet();
    if (s) navigate(`/workspace/sheets/${s.id}`);
  }

  const filtered = sheets.filter((s) =>
    s.title.toLowerCase().includes(q.toLowerCase()) ||
    s.content_text.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Amineva Sheets</h1>
          <p className="text-sm text-muted-foreground">Intelligence-grade spreadsheets with SPSS-style analytics and Odeneho-assisted insight.</p>
        </div>
        <button onClick={onCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90">
          <Plus className="h-4 w-4" /> New Sheet
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search sheets…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <button onClick={onCreate}
            className="group aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-muted/20 hover:border-accent hover:bg-accent/5 flex flex-col items-center justify-center transition">
            <div className="h-12 w-12 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold text-foreground">New Sheet</div>
            <div className="text-[11px] text-muted-foreground mt-1">Start from scratch</div>
          </button>

          {filtered.map((s) => (
            <div key={s.id} className="relative group">
              <button
                onClick={() => navigate(`/workspace/sheets/${s.id}`)}
                className="w-full aspect-[3/4] rounded-xl border border-border bg-card hover:border-accent/60 hover:shadow-lg transition overflow-hidden flex flex-col text-left"
              >
                <div className="flex-1 bg-white p-2 overflow-hidden border-b border-border relative">
                  <div className="grid grid-cols-5 gap-px bg-gray-200 h-full">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="bg-white text-[6px] text-gray-500 p-0.5" />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SheetIcon className="h-10 w-10 text-emerald-200" />
                  </div>
                </div>
                <div className="p-3 bg-card">
                  <div className="flex items-start gap-2">
                    <SheetIcon className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-sm truncate">{s.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">Sheet</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(s.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === s.id ? null : s.id); }}
                className="absolute top-2 right-2 h-7 w-7 rounded-md bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white shadow-sm"
              >
                <MoreVertical className="h-4 w-4 text-foreground" />
              </button>
              {menuFor === s.id && (
                <div onMouseLeave={() => setMenuFor(null)} className="absolute top-10 right-2 z-20 w-40 rounded-lg border border-border bg-popover shadow-lg py-1 text-sm">
                  <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                    onClick={async () => {
                      setMenuFor(null);
                      const name = window.prompt("Rename sheet", s.title);
                      if (name && name !== s.title) { await updateSheet(s.id, { title: name }); refresh(); }
                    }}><Pencil className="h-3.5 w-3.5" /> Rename</button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                    onClick={async () => { setMenuFor(null); const c = await duplicateSheet(s); if (c) refresh(); }}>
                    <Copy className="h-3.5 w-3.5" /> Duplicate</button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-destructive"
                    onClick={async () => {
                      setMenuFor(null);
                      if (!window.confirm(`Delete "${s.title}"?`)) return;
                      await deleteSheet(s.id); toast({ title: "Sheet deleted" }); refresh();
                    }}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
