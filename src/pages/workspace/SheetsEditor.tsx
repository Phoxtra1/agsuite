import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSheet, updateSheet, EMPTY_WORKBOOK, cellId, colToLetter, parseCell,
  type WorkspaceSheet, type Workbook, type SheetPage, type CellFormat, flattenWorkbookText,
} from "@/lib/workspace/sheets/documents";
import { buildEngine, type EngineHandle } from "@/lib/workspace/sheets/engine";
import { SheetGrid } from "@/components/workspace/sheets/SheetGrid";
import { SheetRibbon } from "@/components/workspace/sheets/SheetRibbon";
import { FormulaBar } from "@/components/workspace/sheets/FormulaBar";
import { SheetTabs } from "@/components/workspace/sheets/SheetTabs";
import { AnalysisPanel } from "@/components/workspace/sheets/AnalysisPanel";
import { exportCSV, exportJSON, exportXLSX, importXLSX } from "@/components/workspace/sheets/exporters";
import { ArrowLeft, ChevronLeft, CloudUpload, Download, Loader2, Share2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SheetsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<WorkspaceSheet | null>(null);
  const [wb, setWb] = useState<Workbook>(EMPTY_WORKBOOK);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [selection, setSelection] = useState({ r1: 0, c1: 0, r2: 0, c2: 0 });
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const engineRef = useRef<EngineHandle | null>(null);
  const [engineTick, setEngineTick] = useState(0); // force re-render on calc
  const saveTimer = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const d = await getSheet(id);
      if (!d) { toast({ title: "Sheet not found", variant: "destructive" as any }); navigate("/workspace/sheets"); return; }
      setDoc(d); setTitle(d.title);
      const workbook = d.workbook_json && d.workbook_json.sheets ? d.workbook_json : EMPTY_WORKBOOK;
      setWb(workbook);
      document.title = `${d.title} - Amineva Sheets`;
    })();
  }, [id, navigate]);

  // Rebuild engine whenever workbook structure changes
  useEffect(() => {
    if (!wb.sheets.length) return;
    engineRef.current?.destroy();
    engineRef.current = buildEngine(wb);
    setEngineTick((t) => t + 1);
    return () => { engineRef.current?.destroy(); engineRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wb.sheets.length, wb.sheets.map((s) => s.name).join("|")]);

  const activeSheet = wb.sheets[activeSheetIdx] ?? wb.sheets[0];

  function persist(nextWb: Workbook, nextTitle = title) {
    setSaving("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      if (!id) return;
      const ok = await updateSheet(id, {
        workbook_json: nextWb as any,
        content_text: flattenWorkbookText(nextWb),
        title: nextTitle,
      });
      setSaving(ok ? "saved" : "idle");
    }, 800) as any;
  }

  function mutateActive(mut: (s: SheetPage) => SheetPage) {
    setWb((prev) => {
      const next = { ...prev, sheets: prev.sheets.map((s, i) => i === activeSheetIdx ? mut(s) : s) };
      persist(next);
      return next;
    });
  }

  function setCell(id: string, raw: string) {
    const pos = parseCell(id); if (!pos) return;
    mutateActive((s) => {
      const cells = { ...s.cells };
      if (raw === "") delete cells[id];
      else if (raw.startsWith("=")) cells[id] = raw;
      else if (!isNaN(Number(raw)) && raw.trim() !== "") cells[id] = Number(raw);
      else cells[id] = raw;
      // push into engine
      engineRef.current?.setCell(s.name, pos.row, pos.col, raw);
      setEngineTick((t) => t + 1);
      return { ...s, cells };
    });
  }

  function applyFormatToSelection(patch: Partial<CellFormat>) {
    mutateActive((s) => {
      const formats = { ...(s.formats ?? {}) };
      const [r1, r2] = [Math.min(selection.r1, selection.r2), Math.max(selection.r1, selection.r2)];
      const [c1, c2] = [Math.min(selection.c1, selection.c2), Math.max(selection.c1, selection.c2)];
      for (let r = r1; r <= r2; r++)
        for (let c = c1; c <= c2; c++) {
          const id = cellId(r, c);
          formats[id] = { ...(formats[id] ?? {}), ...patch };
        }
      return { ...s, formats };
    });
  }

  function insertFormula(fn: string) {
    const [r1, r2] = [Math.min(selection.r1, selection.r2), Math.max(selection.r1, selection.r2)];
    const [c1, c2] = [Math.min(selection.c1, selection.c2), Math.max(selection.c1, selection.c2)];
    // Guess: if a single cell selected, put formula there referencing the column above.
    const target = cellId(r1, c1);
    let arg = "";
    if (r1 === r2 && c1 === c2) {
      // reference all non-empty cells above in same column
      let start = 0;
      for (let r = r1 - 1; r >= 0; r--) {
        const id = cellId(r, c1);
        if (activeSheet.cells[id] == null) { start = r + 1; break; }
      }
      arg = `${cellId(start, c1)}:${cellId(r1 - 1 < 0 ? 0 : r1 - 1, c1)}`;
    } else {
      arg = `${cellId(r1, c1)}:${cellId(r2, c2)}`;
    }
    const formula = fn === "IF" ? `=IF(${arg}>0,"Yes","No")` :
                    fn === "VLOOKUP" ? `=VLOOKUP(A1, ${arg}, 2, FALSE)` :
                    `=${fn}(${arg})`;
    // Put formula in row below selection when range; otherwise in selected cell
    const outRow = r1 === r2 && c1 === c2 ? r1 : r2 + 1;
    setCell(cellId(outRow, c1), formula);
    setSelection({ r1: outRow, c1, r2: outRow, c2: c1 });
  }

  function addSheet() {
    setWb((prev) => {
      const name = `Sheet${prev.sheets.length + 1}`;
      const next = { ...prev, sheets: [...prev.sheets, { name, cells: {} }] };
      persist(next);
      return next;
    });
    setActiveSheetIdx(wb.sheets.length);
  }
  function renameSheet(i: number, name: string) {
    setWb((prev) => {
      const next = { ...prev, sheets: prev.sheets.map((s, k) => k === i ? { ...s, name } : s) };
      persist(next);
      return next;
    });
  }
  function deleteSheetTab(i: number) {
    setWb((prev) => {
      const next = { ...prev, sheets: prev.sheets.filter((_, k) => k !== i) };
      persist(next);
      return next;
    });
    if (activeSheetIdx >= i) setActiveSheetIdx((k) => Math.max(0, k - 1));
  }

  async function onImportFile(file: File) {
    try {
      const imported = await importXLSX(file);
      setWb(imported);
      persist(imported);
      toast({ title: "Imported", description: `${imported.sheets.length} sheet(s) loaded.` });
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" as any });
    }
  }

  const activeId = cellId(selection.r1, selection.c1);
  const formulaBarValue = useMemo(() => {
    const raw = activeSheet?.cells[activeId];
    return raw == null ? "" : String(raw);
  }, [activeSheet, activeId, engineTick]);

  if (!doc) return null;

  return (
    <div className="h-screen flex flex-col bg-muted/30 overflow-hidden">
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate("/workspace/sheets")}
            className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1.5">
            <span>Workspace</span>
            <ChevronLeft className="h-3 w-3 rotate-180 opacity-50" />
            <span className="text-emerald-600 font-semibold">Amineva Sheets</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex flex-col min-w-0">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); persist(wb, e.target.value); }}
              className="text-base font-semibold text-foreground bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-2 py-0.5 min-w-[180px] truncate"
            />
            <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground">
              {saving === "saving" ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Saving…</span> :
               saving === "saved" ? <span className="flex items-center gap-1 text-success"><CloudUpload className="h-3 w-3"/> Saved</span> :
               <span>Edited just now</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border text-xs font-medium hover:bg-secondary/80 flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <ExportMenu
            onXLSX={() => exportXLSX(title, wb)}
            onCSV={() => exportCSV(title, activeSheet)}
            onJSON={() => exportJSON(title, wb)}
          />
          <button className="px-4 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 inline-flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </header>

      <SheetRibbon
        onFormat={applyFormatToSelection}
        onFormula={insertFormula}
        onAddRow={() => {/* rows are virtual */}}
        onAddCol={() => {/* cols are virtual */}}
        onDeleteRow={() => {
          mutateActive((s) => {
            const cells = { ...s.cells };
            const [r1, r2] = [Math.min(selection.r1, selection.r2), Math.max(selection.r1, selection.r2)];
            for (const k of Object.keys(cells)) {
              const p = parseCell(k); if (!p) continue;
              if (p.row >= r1 && p.row <= r2) delete cells[k];
            }
            return { ...s, cells };
          });
        }}
        onDeleteCol={() => {
          mutateActive((s) => {
            const cells = { ...s.cells };
            const [c1, c2] = [Math.min(selection.c1, selection.c2), Math.max(selection.c1, selection.c2)];
            for (const k of Object.keys(cells)) {
              const p = parseCell(k); if (!p) continue;
              if (p.col >= c1 && p.col <= c2) delete cells[k];
            }
            return { ...s, cells };
          });
        }}
        onClear={() => {
          mutateActive((s) => {
            const cells = { ...s.cells };
            const [r1, r2] = [Math.min(selection.r1, selection.r2), Math.max(selection.r1, selection.r2)];
            const [c1, c2] = [Math.min(selection.c1, selection.c2), Math.max(selection.c1, selection.c2)];
            for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) delete cells[cellId(r, c)];
            return { ...s, cells };
          });
        }}
      />

      <FormulaBar
        activeCell={activeId}
        value={formulaBarValue}
        onCommit={(v) => setCell(activeId, v)}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <SheetGrid
            sheet={activeSheet}
            engine={engineRef.current}
            selection={selection}
            onSelect={setSelection}
            onCellEdit={setCell}
          />
          <SheetTabs
            sheets={wb.sheets}
            active={activeSheetIdx}
            onSelect={setActiveSheetIdx}
            onAdd={addSheet}
            onRename={renameSheet}
            onDelete={deleteSheetTab}
          />
        </div>

        <AnalysisPanel
          sheet={activeSheet}
          selection={selection}
          collapsed={rightCollapsed}
          onToggleCollapsed={() => setRightCollapsed((v) => !v)}
          engine={engineRef.current}
        />
      </div>

      <footer className="h-7 border-t border-border bg-card flex items-center justify-between px-4 text-[11px] text-muted-foreground flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>Cell <span className="text-foreground font-medium font-mono">{activeId}</span></span>
          <span>Sheet <span className="text-foreground font-medium">{activeSheet?.name}</span></span>
          <span>Selection {Math.abs(selection.r2 - selection.r1) + 1}R × {Math.abs(selection.c2 - selection.c1) + 1}C</span>
        </div>
        <div className="text-emerald-600">Amineva Intelligence · Sheets</div>
      </footer>
    </div>
  );
}

function ExportMenu({ onXLSX, onCSV, onJSON }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border text-xs font-medium hover:bg-secondary/80 flex items-center gap-1.5">
        <Download className="h-3.5 w-3.5" /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover shadow-xl py-1 text-sm">
            {[["XLSX", onXLSX], ["CSV (this sheet)", onCSV], ["JSON", onJSON]].map(([l, fn]: any) => (
              <button key={l} onClick={() => { setOpen(false); fn(); }} className="w-full text-left px-3 py-1.5 hover:bg-muted text-foreground">{l}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
