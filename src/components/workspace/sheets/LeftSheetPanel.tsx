import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Sheet as SheetIcon, ChevronLeft, ChevronRight, MoreVertical, Pencil, Copy, Trash2, Search, Clock, Table2,
} from "lucide-react";
import {
  createSheet, deleteSheet, duplicateSheet, listSheets, updateSheet,
  type WorkspaceSheet,
} from "@/lib/workspace/sheets/documents";
import { toast } from "@/hooks/use-toast";

export function LeftSheetPanel({
  collapsed,
  onToggleCollapsed,
  currentId,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  currentId?: string;
}) {
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

  useEffect(() => {
    refresh();
  }, [currentId]);

  async function onCreate() {
    const s = await createSheet();
    if (s) {
      await refresh();
      navigate(`/workspace/sheets/${s.id}`);
    }
  }

  async function onRename(s: WorkspaceSheet) {
    const name = window.prompt("Rename spreadsheet", s.title);
    if (!name || name === s.title) return;
    await updateSheet(s.id, { title: name });
    refresh();
  }

  async function onDelete(s: WorkspaceSheet) {
    if (!window.confirm(`Delete "${s.title}"?`)) return;
    await deleteSheet(s.id);
    toast({ title: "Spreadsheet deleted" });
    if (s.id === currentId) navigate("/workspace/sheets");
    refresh();
  }

  async function onDuplicate(s: WorkspaceSheet) {
    const copy = await duplicateSheet(s);
    if (copy) refresh();
  }

  if (collapsed) {
    return (
      <aside className="w-12 border-r border-border bg-card flex flex-col items-center py-3 gap-2 flex-shrink-0 z-20">
        <button
          onClick={onToggleCollapsed}
          className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition"
          title="Expand spreadsheets panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={onCreate}
          className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition shadow-sm"
          title="New spreadsheet"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="rotate-180 [writing-mode:vertical-rl] text-[11px] font-semibold tracking-wider text-emerald-700 mt-3 flex items-center gap-1">
          <Table2 className="h-3 w-3 inline rotate-90" /> SPREADSHEETS
        </div>
      </aside>
    );
  }

  const filtered = sheets.filter(
    (s) =>
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      (s.content_text && s.content_text.toLowerCase().includes(q.toLowerCase()))
  );
  const recent = sheets.slice(0, 5);

  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col h-full overflow-hidden flex-shrink-0 z-20">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Spreadsheets</h2>
        </div>
        <button
          onClick={onToggleCollapsed}
          className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition"
          title="Collapse spreadsheets panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={onCreate}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Spreadsheet
        </button>
      </div>

      <div className="px-3 pb-2 relative">
        <Search className="h-3.5 w-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search spreadsheets…"
          className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {!q && recent.length > 0 && (
          <div className="mt-2">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Recent
            </div>
            {recent.map((s) => (
              <SheetRow
                key={`r-${s.id}`}
                sheet={s}
                active={s.id === currentId}
                menuOpen={menuFor === `r-${s.id}`}
                onMenuToggle={() => setMenuFor((m) => (m === `r-${s.id}` ? null : `r-${s.id}`))}
                onOpen={() => navigate(`/workspace/sheets/${s.id}`)}
                onRename={() => onRename(s)}
                onDuplicate={() => onDuplicate(s)}
                onDelete={() => onDelete(s)}
              />
            ))}
          </div>
        )}

        <div className="mt-3">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            {q ? "Results" : "All Spreadsheets"}
          </div>
          {loading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              {sheets.length === 0 ? "No spreadsheets yet." : "No matches."}
            </div>
          ) : (
            filtered.map((s) => (
              <SheetRow
                key={s.id}
                sheet={s}
                active={s.id === currentId}
                menuOpen={menuFor === s.id}
                onMenuToggle={() => setMenuFor((m) => (m === s.id ? null : s.id))}
                onOpen={() => navigate(`/workspace/sheets/${s.id}`)}
                onRename={() => onRename(s)}
                onDuplicate={() => onDuplicate(s)}
                onDelete={() => onDelete(s)}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

function SheetRow({
  sheet,
  active,
  menuOpen,
  onMenuToggle,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: any) {
  return (
    <div className="relative group">
      <button
        onClick={onOpen}
        className={`w-full flex items-start gap-2 px-2 py-2 rounded-md text-left text-sm transition ${
          active
            ? "bg-emerald-500/15 text-foreground font-medium"
            : "text-foreground/80 hover:bg-muted hover:text-foreground"
        }`}
      >
        <SheetIcon
          className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
            active ? "text-emerald-600" : "text-muted-foreground"
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium text-[13px]">{sheet.title || "Untitled Sheet"}</div>
          <div className="text-[10px] text-muted-foreground truncate">
            {new Date(sheet.updated_at).toLocaleDateString()}
          </div>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMenuToggle();
        }}
        className="absolute top-2 right-2 h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-background transition"
      >
        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {menuOpen && (
        <div className="absolute right-2 top-9 z-30 w-36 rounded-lg border border-border bg-popover shadow-lg py-1 text-xs">
          <button
            onClick={onRename}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-foreground"
          >
            <Pencil className="h-3 w-3" /> Rename
          </button>
          <button
            onClick={onDuplicate}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-foreground"
          >
            <Copy className="h-3 w-3" /> Duplicate
          </button>
          <button
            onClick={onDelete}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-destructive"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
