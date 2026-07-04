import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSheet, updateSheet, EMPTY_WORKBOOK, cellId, parseCell,
  insertRow, deleteRow, insertCol, deleteCol,
  type WorkspaceSheet, type Workbook, type SheetPage, type CellFormat, flattenWorkbookText,
} from "@/lib/workspace/sheets/documents";
import { buildEngine, type EngineHandle } from "@/lib/workspace/sheets/engine";
import { SheetGrid, type Selection } from "@/components/workspace/sheets/SheetGrid";
import { RibbonTabs, type RibbonActions } from "@/components/workspace/sheets/ribbon/RibbonTabs";
import { FormulaBar } from "@/components/workspace/sheets/FormulaBar";
import { SheetTabs } from "@/components/workspace/sheets/SheetTabs";
import { StatusBar } from "@/components/workspace/sheets/StatusBar";
import { AnalysisPanel } from "@/components/workspace/sheets/AnalysisPanel";
import { exportCSV, exportJSON, exportXLSX, importXLSX } from "@/components/workspace/sheets/exporters";
import { useUndoRedo } from "@/components/workspace/sheets/hooks/useUndoRedo";
import { ArrowLeft, ChevronLeft, CloudUpload, Download, Loader2, Share2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SheetsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<WorkspaceSheet | null>(null);
  const wbUR = useUndoRedo<Workbook>(EMPTY_WORKBOOK, 50);
  const wb = wbUR.state;
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [selection, setSelection] = useState<Selection>({ r1: 0, c1: 0, r2: 0, c2: 0 });
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const engineRef = useRef<EngineHandle | null>(null);
  const [engineTick, setEngineTick] = useState(0);
  const saveTimer = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [clipboard, setClipboard] = useState<{ range: Selection; cut: boolean; cells: Record<string, any>; formats: Record<string, any> } | null>(null);
  const [copiedRange, setCopiedRange] = useState<Selection | null>(null);
  const [zoom, setZoom] = useState(100);
  const [gridlines, setGridlines] = useState(true);
  const [showHeaders, setShowHeaders] = useState(true);
  const [showFormulaBar, setShowFormulaBar] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const d = await getSheet(id);
      if (!d) { toast({ title: "Sheet not found", variant: "destructive" as any }); navigate("/workspace/sheets"); return; }
      setDoc(d); setTitle(d.title);
      const workbook = d.workbook_json && (d.workbook_json as any).sheets ? d.workbook_json : EMPTY_WORKBOOK;
      wbUR.reset(workbook);
      document.title = `${d.title} — Amineva Sheets`;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  useEffect(() => {
    if (!wb.sheets.length) return;
    engineRef.current?.destroy();
    engineRef.current = buildEngine(wb);
    setEngineTick((t) => t + 1);
    return () => { engineRef.current?.destroy(); engineRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wb.sheets.length, wb.sheets.map((s) => s.name).join("|")]);

  const activeSheet = wb.sheets[activeSheetIdx] ?? wb.sheets[0];

  const persist = useCallback((nextWb: Workbook, nextTitle = title) => {
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
  }, [id, title]);

  const setWb = useCallback((updater: (prev: Workbook) => Workbook, record = true) => {
    wbUR.set((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    }, record);
  }, [wbUR, persist]);

  const mutateActive = useCallback((mut: (s: SheetPage) => SheetPage, record = true) => {
    setWb((prev) => ({ ...prev, sheets: prev.sheets.map((s, i) => i === activeSheetIdx ? mut(s) : s) }), record);
  }, [setWb, activeSheetIdx]);

  const setCell = useCallback((cid: string, raw: string) => {
    const pos = parseCell(cid); if (!pos) return;
    mutateActive((s) => {
      const cells = { ...s.cells };
      if (raw === "") delete cells[cid];
      else if (raw.startsWith("=")) cells[cid] = raw;
      else if (!isNaN(Number(raw)) && raw.trim() !== "") cells[cid] = Number(raw);
      else cells[cid] = raw;
      engineRef.current?.setCell(s.name, pos.row, pos.col, raw);
      setEngineTick((t) => t + 1);
      return { ...s, cells };
    });
  }, [mutateActive]);

  const norm = (s: Selection) => ({
    r1: Math.min(s.r1, s.r2), r2: Math.max(s.r1, s.r2),
    c1: Math.min(s.c1, s.c2), c2: Math.max(s.c1, s.c2),
  });

  const applyFormat = useCallback((patch: Partial<CellFormat>) => {
    mutateActive((s) => {
      const formats = { ...(s.formats ?? {}) };
      const n = norm(selection);
      for (let r = n.r1; r <= n.r2; r++)
        for (let c = n.c1; c <= n.c2; c++) {
          const id2 = cellId(r, c);
          // Toggle booleans
          const existing = formats[id2] ?? {};
          const merged: any = { ...existing };
          for (const [k, v] of Object.entries(patch)) {
            if (typeof v === "boolean") merged[k] = !existing[k as keyof CellFormat];
            else merged[k] = v;
          }
          formats[id2] = merged;
        }
      return { ...s, formats };
    });
  }, [mutateActive, selection]);

  const insertFormulaFn = useCallback((fn: string) => {
    const n = norm(selection);
    const target = cellId(n.r1, n.c1);
    let arg = "";
    if (n.r1 === n.r2 && n.c1 === n.c2) {
      let start = 0;
      for (let r = n.r1 - 1; r >= 0; r--) {
        const id2 = cellId(r, n.c1);
        if (activeSheet.cells[id2] == null) { start = r + 1; break; }
      }
      arg = `${cellId(start, n.c1)}:${cellId(Math.max(0, n.r1 - 1), n.c1)}`;
    } else {
      arg = `${cellId(n.r1, n.c1)}:${cellId(n.r2, n.c2)}`;
    }
    const formula = fn === "IF" ? `=IF(${arg}>0,"Yes","No")` :
                    fn === "VLOOKUP" ? `=VLOOKUP(A1, ${arg}, 2, FALSE)` : `=${fn}(${arg})`;
    const outRow = n.r1 === n.r2 && n.c1 === n.c2 ? n.r1 : n.r2 + 1;
    setCell(cellId(outRow, n.c1), formula);
    setSelection({ r1: outRow, c1: n.c1, r2: outRow, c2: n.c1 });
  }, [selection, activeSheet, setCell]);

  // Clipboard
  const doCopy = useCallback((cut = false) => {
    const n = norm(selection);
    const cells: Record<string, any> = {}; const formats: Record<string, any> = {};
    for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) {
      const id2 = cellId(r, c);
      if (activeSheet.cells[id2] != null) cells[id2] = activeSheet.cells[id2];
      if (activeSheet.formats?.[id2]) formats[id2] = activeSheet.formats[id2];
    }
    setClipboard({ range: n, cut, cells, formats });
    setCopiedRange(n);
    // Also try native clipboard
    const rows: string[] = [];
    for (let r = n.r1; r <= n.r2; r++) {
      const row: string[] = [];
      for (let c = n.c1; c <= n.c2; c++) row.push(String(activeSheet.cells[cellId(r, c)] ?? ""));
      rows.push(row.join("\t"));
    }
    navigator.clipboard?.writeText(rows.join("\n")).catch(() => {});
  }, [selection, activeSheet]);

  const doPaste = useCallback(() => {
    if (!clipboard) return;
    const dst = norm(selection);
    const src = clipboard.range;
    const dr = dst.r1 - src.r1, dc = dst.c1 - src.c1;
    mutateActive((s) => {
      const cells = { ...s.cells };
      const formats = { ...(s.formats ?? {}) };
      for (const [k, v] of Object.entries(clipboard.cells)) {
        const p = parseCell(k)!;
        const nid = cellId(p.row + dr, p.col + dc);
        cells[nid] = v;
      }
      for (const [k, v] of Object.entries(clipboard.formats)) {
        const p = parseCell(k)!;
        const nid = cellId(p.row + dr, p.col + dc);
        formats[nid] = v;
      }
      if (clipboard.cut) {
        for (const k of Object.keys(clipboard.cells)) delete cells[k];
        for (const k of Object.keys(clipboard.formats)) delete formats[k];
      }
      return { ...s, cells, formats };
    });
    if (clipboard.cut) { setClipboard(null); setCopiedRange(null); }
  }, [clipboard, selection, mutateActive]);

  // Structural ops
  const rowOps = {
    insertAbove: () => mutateActive((s) => insertRow(s, norm(selection).r1)),
    insertBelow: () => mutateActive((s) => insertRow(s, norm(selection).r2 + 1)),
    delete: () => { const n = norm(selection); mutateActive((s) => deleteRow(s, n.r1, n.r2 - n.r1 + 1)); },
    duplicate: () => {
      const n = norm(selection);
      mutateActive((s) => {
        let out = insertRow(s, n.r2 + 1, n.r2 - n.r1 + 1);
        const cells = { ...out.cells };
        for (let r = n.r1; r <= n.r2; r++)
          for (const k of Object.keys(s.cells)) {
            const p = parseCell(k)!; if (p.row !== r) continue;
            cells[cellId(p.row + (n.r2 - n.r1 + 1), p.col)] = s.cells[k];
          }
        return { ...out, cells };
      });
    },
  };
  const colOps = {
    insertLeft: () => mutateActive((s) => insertCol(s, norm(selection).c1)),
    insertRight: () => mutateActive((s) => insertCol(s, norm(selection).c2 + 1)),
    delete: () => { const n = norm(selection); mutateActive((s) => deleteCol(s, n.c1, n.c2 - n.c1 + 1)); },
  };

  const ribbon: RibbonActions = {
    format: applyFormat,
    clipboard: {
      cut: () => doCopy(true), copy: () => doCopy(false), paste: doPaste,
      painter: () => toast({ title: "Format painter", description: "Copy a cell then click target to paint format." }),
    },
    edit: {
      undo: () => wbUR.undo(), redo: () => wbUR.redo(),
      save: () => persist(wb),
      canUndo: wbUR.canUndo, canRedo: wbUR.canRedo,
    },
    cells: {
      insertRowAbove: rowOps.insertAbove, insertRowBelow: rowOps.insertBelow,
      insertColLeft: colOps.insertLeft, insertColRight: colOps.insertRight,
      deleteRow: rowOps.delete, deleteCol: colOps.delete,
      clearContents: () => {
        const n = norm(selection);
        mutateActive((s) => {
          const cells = { ...s.cells };
          for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) delete cells[cellId(r, c)];
          return { ...s, cells };
        });
      },
      clearFormat: () => {
        const n = norm(selection);
        mutateActive((s) => {
          const formats = { ...(s.formats ?? {}) };
          for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) delete formats[cellId(r, c)];
          return { ...s, formats };
        });
      },
      mergeCells: () => {
        const n = norm(selection);
        const range = `${cellId(n.r1, n.c1)}:${cellId(n.r2, n.c2)}`;
        mutateActive((s) => ({ ...s, merges: [...(s.merges ?? []), range] }));
      },
    },
    data: {
      sortAsc: () => sortSelection(true), sortDesc: () => sortSelection(false),
      toggleFilter: () => toast({ title: "Filter", description: "Use header dropdowns (coming next turn)." }),
      find: () => { const q = prompt("Find:"); if (!q) return; findFirst(q); },
    },
    view: {
      freezeRow: () => mutateActive((s) => ({ ...s, frozenRows: (norm(selection).r1 + 1) })),
      freezeCol: () => mutateActive((s) => ({ ...s, frozenCols: (norm(selection).c1 + 1) })),
      unfreeze: () => mutateActive((s) => ({ ...s, frozenRows: 0, frozenCols: 0 })),
      toggleGridlines: () => setGridlines((v) => !v),
      toggleHeaders: () => setShowHeaders((v) => !v),
      toggleFormulaBar: () => setShowFormulaBar((v) => !v),
      gridlines, headers: showHeaders, formulaBar: showFormulaBar,
    },
    insert: {
      chart: () => toast({ title: "Chart", description: "Open the Amineva Intelligence panel → Chart." }),
      func: () => insertFormulaFn("SUM"),
      image: () => toast({ title: "Image insert coming soon" }),
      link: () => { const url = prompt("URL:"); if (url) setCell(cellId(selection.r1, selection.c1), url); },
      comment: () => toast({ title: "Comments coming soon" }),
      table: () => toast({ title: "Table formatting coming soon" }),
    },
    ai: {
      summarize: () => setRightCollapsed(false),
      suggestChart: () => setRightCollapsed(false),
      anomalies: () => setRightCollapsed(false),
      cleanup: () => setRightCollapsed(false),
      formula: () => setRightCollapsed(false),
    },
    formula: insertFormulaFn,
  };

  function sortSelection(asc: boolean) {
    const n = norm(selection);
    mutateActive((s) => {
      const rows: any[][] = [];
      for (let r = n.r1; r <= n.r2; r++) {
        const row: any[] = [];
        for (let c = n.c1; c <= n.c2; c++) row.push(s.cells[cellId(r, c)] ?? null);
        rows.push(row);
      }
      rows.sort((a, b) => {
        const av = a[0], bv = b[0];
        if (av == null) return 1; if (bv == null) return -1;
        const na = Number(av), nb = Number(bv);
        if (Number.isFinite(na) && Number.isFinite(nb)) return asc ? na - nb : nb - na;
        return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
      const cells = { ...s.cells };
      for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) delete cells[cellId(r, c)];
      rows.forEach((row, i) => row.forEach((v, j) => { if (v != null) cells[cellId(n.r1 + i, n.c1 + j)] = v; }));
      return { ...s, cells };
    });
  }
  function findFirst(q: string) {
    const s = activeSheet;
    for (const [k, v] of Object.entries(s.cells)) {
      if (String(v).toLowerCase().includes(q.toLowerCase())) {
        const p = parseCell(k)!;
        setSelection({ r1: p.row, c1: p.col, r2: p.row, c2: p.col });
        return;
      }
    }
    toast({ title: "Not found", description: q });
  }

  function jumpToCell(name: string) {
    const p = parseCell(name.toUpperCase());
    if (p) setSelection({ r1: p.row, c1: p.col, r2: p.row, c2: p.col });
  }

  // Sheet tab ops
  function addSheet() {
    const name = `Sheet${wb.sheets.length + 1}`;
    setWb((prev) => ({ ...prev, sheets: [...prev.sheets, { name, cells: {} }] }));
    setActiveSheetIdx(wb.sheets.length);
  }
  function renameSheet(i: number, name: string) {
    setWb((prev) => ({ ...prev, sheets: prev.sheets.map((s, k) => k === i ? { ...s, name } : s) }));
  }
  function deleteSheetTab(i: number) {
    setWb((prev) => ({ ...prev, sheets: prev.sheets.filter((_, k) => k !== i) }));
    if (activeSheetIdx >= i) setActiveSheetIdx((k) => Math.max(0, k - 1));
  }
  function duplicateSheetTab(i: number) {
    setWb((prev) => {
      const src = prev.sheets[i];
      const copy = { ...src, name: `${src.name} (copy)` };
      const sheets = [...prev.sheets.slice(0, i + 1), copy, ...prev.sheets.slice(i + 1)];
      return { ...prev, sheets };
    });
  }
  function reorderSheets(from: number, to: number) {
    setWb((prev) => {
      const sheets = [...prev.sheets];
      const [m] = sheets.splice(from, 1);
      sheets.splice(to, 0, m);
      return { ...prev, sheets };
    });
    if (activeSheetIdx === from) setActiveSheetIdx(to);
  }
  function colorSheet(i: number, color: string) {
    setWb((prev) => ({ ...prev, sheets: prev.sheets.map((s, k) => k === i ? { ...s, tabColor: color } : s) }));
  }

  // Keyboard shortcuts (workbook level)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      switch (e.key.toLowerCase()) {
        case "z": e.preventDefault(); wbUR.undo(); break;
        case "y": e.preventDefault(); wbUR.redo(); break;
        case "b": e.preventDefault(); applyFormat({ bold: true }); break;
        case "i": e.preventDefault(); applyFormat({ italic: true }); break;
        case "u": e.preventDefault(); applyFormat({ underline: true }); break;
        case "c": e.preventDefault(); doCopy(false); break;
        case "x": e.preventDefault(); doCopy(true); break;
        case "v": e.preventDefault(); doPaste(); break;
        case "s": e.preventDefault(); persist(wb); break;
        case "a": e.preventDefault(); setSelection({ r1: 0, c1: 0, r2: 199, c2: 25 }); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [wbUR, applyFormat, doCopy, doPaste, persist, wb]);

  const activeId = cellId(selection.r1, selection.c1);
  const formulaBarValue = useMemo(() => {
    const raw = activeSheet?.cells[activeId];
    return raw == null ? "" : String(raw);
  }, [activeSheet, activeId, engineTick]);

  // Context menus actions
  const contextActions = {
    cell: {
      cut: () => doCopy(true), copy: () => doCopy(false), paste: doPaste,
      pasteSpecial: () => toast({ title: "Paste special", description: "Values / formulas / formats — coming next turn." }),
      insertRowAbove: rowOps.insertAbove, insertRowBelow: rowOps.insertBelow,
      insertColLeft: colOps.insertLeft, insertColRight: colOps.insertRight,
      deleteRow: rowOps.delete, deleteCol: colOps.delete,
      clearContents: ribbon.cells.clearContents, clearFormat: ribbon.cells.clearFormat,
      mergeCells: ribbon.cells.mergeCells,
      splitCells: () => mutateActive((s) => ({ ...s, merges: [] })),
      addComment: () => toast({ title: "Comments coming soon" }),
      insertLink: ribbon.insert.link,
      conditionalFormat: () => toast({ title: "Conditional formatting coming soon" }),
      dataValidation: () => toast({ title: "Data validation coming soon" }),
      duplicate: rowOps.duplicate,
      hideRow: () => { const r = selection.r1; mutateActive((s) => ({ ...s, hiddenRows: [...(s.hiddenRows ?? []), r] })); },
      hideCol: () => { const c = selection.c1; mutateActive((s) => ({ ...s, hiddenCols: [...(s.hiddenCols ?? []), c] })); },
    },
    row: (r: number) => ({
      insertAbove: () => mutateActive((s) => insertRow(s, r)),
      insertBelow: () => mutateActive((s) => insertRow(s, r + 1)),
      delete: () => mutateActive((s) => deleteRow(s, r)),
      duplicate: () => rowOps.duplicate(),
      hide: () => mutateActive((s) => ({ ...s, hiddenRows: [...(s.hiddenRows ?? []), r] })),
      unhide: () => mutateActive((s) => ({ ...s, hiddenRows: [] })),
      resize: () => { const h = Number(prompt("Row height (px):", "24")); if (h) mutateActive((s) => ({ ...s, rowHeights: { ...(s.rowHeights ?? {}), [r]: h } })); },
      autoFit: () => mutateActive((s) => { const rh = { ...(s.rowHeights ?? {}) }; delete rh[r]; return { ...s, rowHeights: rh }; }),
      freezeAbove: () => mutateActive((s) => ({ ...s, frozenRows: r + 1 })),
      protect: () => toast({ title: "Row protection coming soon" }),
    }),
    col: (c: number) => ({
      insertLeft: () => mutateActive((s) => insertCol(s, c)),
      insertRight: () => mutateActive((s) => insertCol(s, c + 1)),
      delete: () => mutateActive((s) => deleteCol(s, c)),
      duplicate: () => toast({ title: "Duplicate column coming next turn" }),
      hide: () => mutateActive((s) => ({ ...s, hiddenCols: [...(s.hiddenCols ?? []), c] })),
      unhide: () => mutateActive((s) => ({ ...s, hiddenCols: [] })),
      resize: () => { const w = Number(prompt("Column width (px):", "96")); if (w) mutateActive((s) => ({ ...s, colWidths: { ...(s.colWidths ?? {}), [c]: w } })); },
      autoFit: () => mutateActive((s) => { const cw = { ...(s.colWidths ?? {}) }; delete cw[c]; return { ...s, colWidths: cw }; }),
      freezeLeft: () => mutateActive((s) => ({ ...s, frozenCols: c + 1 })),
      protect: () => toast({ title: "Column protection coming soon" }),
    }),
  };

  async function onImportFile(file: File) {
    try {
      const imported = await importXLSX(file);
      setWb(() => imported);
      toast({ title: "Imported", description: `${imported.sheets.length} sheet(s) loaded.` });
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" as any });
    }
  }

  const onFillDown = (source: Selection, toRow: number) => {
    const n = norm(source);
    if (toRow <= n.r2) return;
    mutateActive((s) => {
      const cells = { ...s.cells };
      for (let r = n.r2 + 1; r <= toRow; r++)
        for (let c = n.c1; c <= n.c2; c++) {
          const srcId = cellId(n.r2, c);
          const v = s.cells[srcId];
          if (v != null) cells[cellId(r, c)] = v;
        }
      return { ...s, cells };
    });
  };

  if (!doc) return null;

  return (
    <div className="h-screen flex flex-col bg-muted/30 overflow-hidden">
      <header className="h-12 flex items-center justify-between px-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate("/workspace/sheets")}
            className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1.5">
            <span>Workspace</span>
            <ChevronLeft className="h-3 w-3 rotate-180 opacity-50" />
            <span className="text-emerald-600 font-semibold">Amineva Sheets</span>
          </div>
          <div className="h-6 w-px bg-border mx-1" />
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); persist(wb, e.target.value); }}
            className="text-sm font-semibold text-foreground bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-2 py-0.5 min-w-[180px] truncate"
          />
          <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground">
            {saving === "saving" ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Saving…</span> :
             saving === "saved" ? <span className="flex items-center gap-1 text-emerald-600"><CloudUpload className="h-3 w-3"/> Saved</span> :
             null}
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

      <RibbonTabs actions={ribbon} />

      {showFormulaBar && (
        <FormulaBar
          activeCell={activeId}
          value={formulaBarValue}
          onCommit={(v) => setCell(activeId, v)}
          onNameBox={jumpToCell}
          onOpenFxPicker={() => insertFormulaFn("SUM")}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <SheetGrid
            sheet={activeSheet}
            engine={engineRef.current}
            selection={selection}
            onSelect={setSelection}
            onCellEdit={setCell}
            onFillDown={onFillDown}
            gridlines={gridlines}
            showHeaders={showHeaders}
            zoom={zoom}
            copiedRange={copiedRange}
            contextActions={contextActions}
          />
          <SheetTabs
            sheets={wb.sheets}
            active={activeSheetIdx}
            onSelect={setActiveSheetIdx}
            onAdd={addSheet}
            onRename={renameSheet}
            onDelete={deleteSheetTab}
            onDuplicate={duplicateSheetTab}
            onReorder={reorderSheets}
            onMove={reorderSheets}
            onColor={colorSheet}
            onHide={(i) => toast({ title: "Hide sheet", description: `Right-click again to unhide "${wb.sheets[i].name}"` })}
            onProtect={() => toast({ title: "Sheet protection coming soon" })}
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

      <StatusBar
        sheet={activeSheet}
        selection={selection}
        engine={engineRef.current}
        zoom={zoom}
        onZoom={setZoom}
        saving={saving}
      />
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
