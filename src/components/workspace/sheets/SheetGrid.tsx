import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SheetPage, CellFormat, CellValue, SheetChart } from "@/lib/workspace/sheets/documents";
import { colToLetter, cellId, parseCell, formatCellValue, parseMergeRange, type MergeRange } from "@/lib/workspace/sheets/documents";
import type { EngineHandle } from "@/lib/workspace/sheets/engine";
import { CellContextMenu, RowContextMenu, ColContextMenu } from "./ContextMenus";
import { SheetChartOverlay } from "./ChartDialog";

export interface Selection { r1: number; c1: number; r2: number; c2: number; }

interface Props {
  sheet: SheetPage;
  engine: EngineHandle | null;
  rowCount?: number;
  colCount?: number;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onCellEdit: (id: string, raw: string) => void;
  onFillDown?: (source: Selection, targetRow: number) => void;
  gridlines?: boolean;
  showHeaders?: boolean;
  zoom?: number;
  copiedRange?: Selection | null;
  contextActions: {
    cell: any; row: (r: number) => any; col: (c: number) => any;
  };
  onUpdateChart?: (id: string, patch: Partial<SheetChart>) => void;
  onDeleteChart?: (id: string) => void;
}

const DEFAULT_ROW_H = 24;
const DEFAULT_COL_W = 96;
const HEADER_H = 24;
const ROW_HEADER_W = 42;
const MIN_COL_W = 32;
const MIN_ROW_H = 18;

interface CellInputProps {
  initialValue: string;
  selectOnFocus: boolean;
  onCommit: (val: string, next?: { r: number; c: number }) => void;
  onDraft: (val: string) => void;
  onCancel: () => void;
  row: number;
  col: number;
  scale: number;
}

function CellInput({
  initialValue,
  selectOnFocus,
  onCommit,
  onDraft,
  onCancel,
  row,
  col,
  scale,
}: CellInputProps) {
  const [val, setVal] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasCommitted = useRef(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (selectOnFocus) {
        inputRef.current.select();
      } else {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [selectOnFocus]);

  const handleCommit = (finalVal: string, next?: { r: number; c: number }) => {
    if (hasCommitted.current) return;
    hasCommitted.current = true;
    onCommit(finalVal, next);
  };

  return (
    <input
      ref={inputRef}
      value={val}
      onChange={(e) => {
        const next = e.target.value;
        setVal(next);
        onDraft(next);
      }}
      onBlur={() => handleCommit(val)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleCommit(val, { r: row + 1, c: col });
          e.preventDefault();
        } else if (e.key === "Tab") {
          if (e.shiftKey) {
            handleCommit(val, { r: row, c: Math.max(0, col - 1) });
          } else {
            handleCommit(val, { r: row, c: col + 1 });
          }
          e.preventDefault();
        } else if (e.key === "Escape") {
          onCancel();
          e.preventDefault();
        }
      }}
      className="absolute inset-0 w-full h-full outline-none bg-white text-foreground border-2 border-accent px-1.5 z-50 shadow-md animate-in fade-in-50 duration-75"
      style={{ fontSize: 13 * scale }}
    />
  );
}

export function SheetGrid({
  sheet, engine, rowCount = 200, colCount = 26,
  selection, onSelect, onCellEdit, onFillDown,
  gridlines = true, showHeaders = true, zoom = 100,
  copiedRange, contextActions, onUpdateChart, onDeleteChart,
}: Props) {
  const [editing, setEditing] = useState<{ id: string; value: string; selectOnFocus: boolean } | null>(null);
  const editingRef = useRef<{ id: string; value: string; selectOnFocus: boolean } | null>(null);
  editingRef.current = editing;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ r: number; c: number } | null>(null);
  const [resizing, setResizing] = useState<{ type: "col" | "row"; index: number; start: number; origin: number } | null>(null);
  const [fillDrag, setFillDrag] = useState<{ toRow: number } | null>(null);

  const commitCurrentEdit = useCallback(() => {
    if (editingRef.current) {
      onCellEdit(editingRef.current.id, editingRef.current.value);
      setEditing(null);
      editingRef.current = null;
    }
  }, [onCellEdit]);

  const scale = zoom / 100;
  const rowH = (r: number) => (sheet.rowHeights?.[r] ?? DEFAULT_ROW_H) * scale;

  const mergeInfo = useMemo(() => {
    const merges = sheet.merges ?? [];
    const parsed: MergeRange[] = [];
    for (const m of merges) {
      const parsedRange = parseMergeRange(m);
      if (parsedRange) parsed.push(parsedRange);
    }

    const cellMap = new Map<string, {
      isPrimary: boolean;
      primaryRow: number;
      primaryCol: number;
      rowSpan: number;
      colSpan: number;
      range: MergeRange;
    }>();

    for (const range of parsed) {
      for (let r = range.r1; r <= range.r2; r++) {
        for (let c = range.c1; c <= range.c2; c++) {
          const key = `${r},${c}`;
          const isPrimary = r === range.r1 && c === range.c1;
          cellMap.set(key, {
            isPrimary,
            primaryRow: range.r1,
            primaryCol: range.c1,
            rowSpan: range.r2 - range.r1 + 1,
            colSpan: range.c2 - range.c1 + 1,
            range,
          });
        }
      }
    }
    return cellMap;
  }, [sheet.merges]);

  // Auto-expand columns based on content length so text/figures never hide.
  // User-set widths (from resize) win; otherwise pick max(default, longest content).
  const autoColW = useMemo(() => {
    const widths: Record<number, number> = {};
    const CHAR_PX = 7.2; // ~7.2px per char at 13px Inter
    const PAD = 16;
    for (const [id, raw] of Object.entries(sheet.cells)) {
      const p = parseCell(id); if (!p) continue;
      let text = "";
      if (typeof raw === "string" && raw.startsWith("=") && engine) {
        const v = engine.getCell(sheet.name, p.row, p.col);
        text = v == null ? "" : String(v);
      } else {
        text = raw == null ? "" : String(raw);
      }
      const fmt = sheet.formats?.[id];
      text = formatCellValue(raw as any, fmt) || text;
      const w = text.length * CHAR_PX + PAD;
      if (!widths[p.col] || w > widths[p.col]) widths[p.col] = w;
    }
    return widths;
  }, [sheet.cells, sheet.formats, sheet.name, engine]);

  const colW = (c: number) => {
    if (sheet.colWidths?.[c] != null) return sheet.colWidths[c] * scale;
    const auto = autoColW[c];
    const base = Math.max(DEFAULT_COL_W, Math.min(auto ?? 0, 480));
    return base * scale;
  };

  const norm = (s: Selection) => ({
    r1: Math.min(s.r1, s.r2), r2: Math.max(s.r1, s.r2),
    c1: Math.min(s.c1, s.c2), c2: Math.max(s.c1, s.c2),
  });

  const inSel = useCallback((r: number, c: number) => {
    const n = norm(selection);
    return r >= n.r1 && r <= n.r2 && c >= n.c1 && c <= n.c2;
  }, [selection]);

  const displayValue = useCallback((r: number, c: number): string => {
    const id = cellId(r, c);
    const raw = sheet.cells[id];
    const fmt = sheet.formats?.[id];
    if (raw == null || raw === "") return "";
    let val: CellValue = raw;
    if (typeof raw === "string" && raw.startsWith("=") && engine) {
      val = engine.getCell(sheet.name, r, c);
    }
    return formatCellValue(val as any, fmt);
  }, [sheet, engine]);

  function beginEdit(r: number, c: number, initial?: string) {
    const id = cellId(r, c);
    const raw = sheet.cells[id];
    const initialVal = initial ?? (raw == null ? "" : String(raw));
    const editObj = {
      id,
      value: initialVal,
      selectOnFocus: initial === undefined,
    };
    editingRef.current = editObj;
    setEditing(editObj);
  }
  function commitEdit(val: string, next?: { r: number; c: number }) {
    if (!editingRef.current && !editing) return;
    const targetId = editingRef.current?.id ?? editing?.id;
    if (targetId) {
      onCellEdit(targetId, val);
    }
    setEditing(null);
    editingRef.current = null;
    if (next) onSelect({ r1: next.r, c1: next.c, r2: next.r, c2: next.c });
  }

  // Global keyboard
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return;
    if (e.ctrlKey || e.metaKey) return; // let editor-level shortcuts handle
    const { r1, c1 } = selection;
    let nr = r1, nc = c1;
    if (e.key === "ArrowDown") nr = Math.min(rowCount - 1, r1 + 1);
    else if (e.key === "ArrowUp") nr = Math.max(0, r1 - 1);
    else if (e.key === "Tab") {
      if (e.shiftKey) {
        nc = Math.max(0, c1 - 1);
      } else {
        nc = Math.min(colCount - 1, c1 + 1);
      }
      e.preventDefault();
    }
    else if (e.key === "ArrowRight") nc = Math.min(colCount - 1, c1 + 1);
    else if (e.key === "ArrowLeft") nc = Math.max(0, c1 - 1);
    else if (e.key === "Home") nc = 0;
    else if (e.key === "End") nc = colCount - 1;
    else if (e.key === "PageDown") nr = Math.min(rowCount - 1, r1 + 20);
    else if (e.key === "PageUp") nr = Math.max(0, r1 - 20);
    else if (e.key === "Enter" || e.key === "F2") { beginEdit(r1, c1); e.preventDefault(); return; }
    else if (e.key === "Delete" || e.key === "Backspace") {
      const n = norm(selection);
      for (let r = n.r1; r <= n.r2; r++) for (let c = n.c1; c <= n.c2; c++) onCellEdit(cellId(r, c), "");
      e.preventDefault(); return;
    }
    else if (e.key.length === 1) { beginEdit(r1, c1, e.key); e.preventDefault(); return; }
    else return;
    if (e.shiftKey) onSelect({ ...selection, r2: nr, c2: nc });
    else onSelect({ r1: nr, c1: nc, r2: nr, c2: nc });
    e.preventDefault();
  };

  useEffect(() => {
    const onGlobalMouseUp = () => {
      dragStart.current = null;
    };
    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => window.removeEventListener("mouseup", onGlobalMouseUp);
  }, []);

  // Resize handlers
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const delta = (e.clientX - (resizing.type === "col" ? resizing.start : 0)) + (resizing.type === "row" ? (e.clientY - resizing.start) : 0);
      const _ = delta; // not used directly below
      if (resizing.type === "col") {
        const w = Math.max(MIN_COL_W, resizing.origin + (e.clientX - resizing.start));
        if (!sheet.colWidths) sheet.colWidths = {};
        sheet.colWidths[resizing.index] = w / scale;
        containerRef.current?.style.setProperty("--force", String(Math.random()));
        setResizing({ ...resizing }); // trigger re-render
      } else {
        const h = Math.max(MIN_ROW_H, resizing.origin + (e.clientY - resizing.start));
        if (!sheet.rowHeights) sheet.rowHeights = {};
        sheet.rowHeights[resizing.index] = h / scale;
        setResizing({ ...resizing });
      }
    };
    const onUp = () => setResizing(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resizing, sheet, scale]);

  const n = norm(selection);
  const copyN = copiedRange ? norm(copiedRange) : null;
  const frozenRows = sheet.frozenRows ?? 0;
  const frozenCols = sheet.frozenCols ?? 0;

  const isFullRowSel = n.c1 === 0 && n.c2 === colCount - 1;
  const isFullColSel = n.r1 === 0 && n.r2 === rowCount - 1;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex-1 overflow-auto bg-white outline-none focus:ring-0 relative"
      style={{ fontSize: 13 * scale, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <table
        className={`border-separate ${gridlines ? "" : ""} select-none`}
        style={{ borderSpacing: 0 }}
      >
        {showHeaders && (
          <thead className="sticky top-0 z-20">
            <tr>
              <th
                onMouseDown={() => {
                  commitCurrentEdit();
                  onSelect({ r1: 0, c1: 0, r2: rowCount - 1, c2: colCount - 1 });
                }}
                className="bg-muted border-r border-b border-border sticky left-0 z-30 cursor-pointer hover:bg-accent/20 transition"
                style={{ width: ROW_HEADER_W, minWidth: ROW_HEADER_W, height: HEADER_H }}
                title="Select All"
              />
              {Array.from({ length: colCount }).map((_, c) => {
                const isColInSel = c >= n.c1 && c <= n.c2;
                const isColActive = isColInSel && !isFullRowSel;
                return (
                  <ColContextMenu key={c} actions={contextActions.col(c)}>
                    <th
                      onMouseDown={() => {
                        commitCurrentEdit();
                        onSelect({ r1: 0, c1: c, r2: rowCount - 1, c2: c });
                      }}
                      className={`bg-muted border-r border-b border-border font-medium text-[11px] text-muted-foreground cursor-pointer relative select-none
                        ${isColActive ? (isFullColSel ? "!bg-accent/25 !text-accent font-bold" : "!bg-accent/15 !text-accent") : ""}
                        ${frozenCols > 0 && c === frozenCols - 1 ? "border-r-2 border-r-accent/60" : ""}`}
                      style={{ width: colW(c), minWidth: colW(c), height: HEADER_H }}
                    >
                      {colToLetter(c)}
                      <div
                        onMouseDown={(e) => { e.stopPropagation(); setResizing({ type: "col", index: c, start: e.clientX, origin: colW(c) / scale }); }}
                        className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-accent"
                      />
                    </th>
                  </ColContextMenu>
                );
              })}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rowCount }).map((_, r) => {
            if (sheet.hiddenRows?.includes(r)) return null;
            const isRowInSel = r >= n.r1 && r <= n.r2;
            const isRowActive = isRowInSel && !isFullColSel;
            return (
              <tr key={r} style={{ height: rowH(r) }}>
                {showHeaders && (
                  <RowContextMenu actions={contextActions.row(r)}>
                    <th
                      onMouseDown={() => {
                        commitCurrentEdit();
                        onSelect({ r1: r, c1: 0, r2: r, c2: colCount - 1 });
                      }}
                      className={`bg-muted border-r border-b border-border text-[11px] text-muted-foreground font-medium sticky left-0 z-20 cursor-pointer relative select-none
                        ${isRowActive ? (isFullRowSel ? "!bg-accent/25 !text-accent font-bold" : "!bg-accent/15 !text-accent font-semibold") : ""}
                        ${frozenRows > 0 && r === frozenRows - 1 ? "border-b-2 border-b-accent/60" : ""}`}
                      style={{ width: ROW_HEADER_W, minWidth: ROW_HEADER_W, height: rowH(r) }}
                    >
                      {r + 1}
                      <div
                        onMouseDown={(e) => { e.stopPropagation(); setResizing({ type: "row", index: r, start: e.clientY, origin: rowH(r) / scale }); }}
                        className="absolute left-0 bottom-0 w-full h-1 cursor-row-resize hover:bg-accent"
                      />
                    </th>
                  </RowContextMenu>
                )}
                {Array.from({ length: colCount }).map((_, c) => {
                  if (sheet.hiddenCols?.includes(c)) return null;

                  // Merged cells logic
                  const mergeDetails = mergeInfo.get(`${r},${c}`);
                  if (mergeDetails && !mergeDetails.isPrimary) {
                    return null;
                  }

                  const id = cellId(r, c);
                  const fmt = sheet.formats?.[id];
                  const raw = sheet.cells[id];
                  const isActive = r === selection.r1 && c === selection.c1;
                  const isSel = inSel(r, c);
                  const isCopy = copyN && r >= copyN.r1 && r <= copyN.r2 && c >= copyN.c1 && c <= copyN.c2;
                  const editingHere = editing?.id === id;
                  const isBottomRight = isActive && n.r1 === n.r2 && n.c1 === n.c2;
                  const isSelBottomRight = r === n.r2 && c === n.c2;

                  // Calculate custom dimension for merged cells
                  let width = colW(c);
                  let height = rowH(r);
                  if (mergeDetails && mergeDetails.isPrimary) {
                    let wSum = 0;
                    for (let colIdx = mergeDetails.range.c1; colIdx <= mergeDetails.range.c2; colIdx++) {
                      wSum += colW(colIdx);
                    }
                    width = wSum;

                    let hSum = 0;
                    for (let rowIdx = mergeDetails.range.r1; rowIdx <= mergeDetails.range.r2; rowIdx++) {
                      hSum += rowH(rowIdx);
                    }
                    height = hSum;
                  }

                  const cell = (
                    <td
                      rowSpan={mergeDetails?.rowSpan}
                      colSpan={mergeDetails?.colSpan}
                      onMouseDown={(e) => {
                        commitCurrentEdit();
                        dragStart.current = { r, c };
                        if (e.shiftKey) onSelect({ ...selection, r2: r, c2: c });
                        else onSelect({ r1: r, c1: c, r2: r, c2: c });
                      }}
                      onMouseEnter={(e) => {
                        if (fillDrag) { setFillDrag({ toRow: r }); return; }
                        if (e.buttons === 1 && dragStart.current) {
                          onSelect({ r1: dragStart.current.r, c1: dragStart.current.c, r2: r, c2: c });
                        }
                      }}
                      onMouseUp={() => {
                        if (fillDrag && onFillDown) {
                          onFillDown(selection, fillDrag.toRow);
                          setFillDrag(null);
                        }
                      }}
                      onDoubleClick={() => beginEdit(r, c)}
                      className={`border-r border-b ${gridlines ? "border-border" : "border-transparent"} relative
                        ${isActive ? "outline outline-2 outline-accent -outline-offset-2 z-[5]" : isSel ? "bg-accent/10" : ""}
                        ${isCopy ? "outline outline-1 outline-dashed outline-accent/70" : ""}`}
                      style={{
                        width: width, minWidth: width, height: height,
                        padding: "0 6px",
                        fontWeight: fmt?.bold ? 600 : undefined,
                        fontStyle: fmt?.italic ? "italic" : undefined,
                        textDecoration: [fmt?.underline && "underline", fmt?.strike && "line-through"].filter(Boolean).join(" ") || undefined,
                        color: fmt?.color,
                        background: !isSel && !isActive ? fmt?.bg : undefined,
                        textAlign: fmt?.align ?? (typeof raw === "number" ? "right" : "left"),
                        verticalAlign: fmt?.valign ?? "middle",
                        fontSize: fmt?.fontSize ? `${fmt.fontSize}px` : undefined,
                        fontFamily: fmt?.fontFamily,
                        whiteSpace: fmt?.wrap ? "normal" : "nowrap",
                        cursor: "cell",
                        // Custom borders
                        borderTop: fmt?.border === "all" || fmt?.border === "top" ? "1px solid #94a3b8" : fmt?.border === "none" ? "none" : undefined,
                        borderBottom: fmt?.border === "all" || fmt?.border === "bottom" ? "1px solid #94a3b8" : fmt?.border === "none" ? "none" : undefined,
                        borderLeft: fmt?.border === "all" || fmt?.border === "left" ? "1px solid #94a3b8" : fmt?.border === "none" ? "none" : undefined,
                        borderRight: fmt?.border === "all" || fmt?.border === "right" ? "1px solid #94a3b8" : fmt?.border === "none" ? "none" : undefined,
                      }}
                    >
                      {editingHere ? (
                        <CellInput
                          initialValue={editing!.value}
                          selectOnFocus={editing!.selectOnFocus}
                          onCommit={(val, next) => commitEdit(val, next)}
                          onDraft={(val) => {
                            if (editingRef.current) editingRef.current.value = val;
                            onCellEdit(id, val);
                          }}
                          onCancel={() => {
                            editingRef.current = null;
                            setEditing(null);
                          }}
                          row={r}
                          col={c}
                          scale={scale}
                        />
                      ) : (
                        <span className="block truncate">{displayValue(r, c)}</span>
                      )}
                      {isSelBottomRight && !editingHere && (
                        <div
                          onMouseDown={(e) => { e.stopPropagation(); setFillDrag({ toRow: r }); }}
                          className="absolute -right-1 -bottom-1 w-2 h-2 bg-accent border border-white cursor-crosshair z-10"
                          title="Fill handle"
                        />
                      )}
                    </td>
                  );
                  return isActive ? (
                    <CellContextMenu key={c} actions={contextActions.cell}>{cell}</CellContextMenu>
                  ) : cell;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Chart overlays */}
      {(sheet.charts ?? []).map((chart) => (
        <SheetChartOverlay
          key={chart.id}
          chart={chart}
          sheet={sheet}
          engine={engine}
          onChange={(patch) => onUpdateChart?.(chart.id, patch)}
          onDelete={() => onDeleteChart?.(chart.id)}
        />
      ))}
    </div>
  );
}
