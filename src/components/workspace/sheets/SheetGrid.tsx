import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { SheetPage, CellFormat } from "@/lib/workspace/sheets/documents";
import { colToLetter, cellId, parseCell } from "@/lib/workspace/sheets/documents";
import type { EngineHandle } from "@/lib/workspace/sheets/engine";

interface Selection {
  r1: number; c1: number; r2: number; c2: number;
}

interface Props {
  sheet: SheetPage;
  engine: EngineHandle | null;
  rowCount?: number;
  colCount?: number;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onCellEdit: (id: string, raw: string) => void;
  onFormatChange?: (ids: string[], patch: Partial<CellFormat>) => void;
}

const DEFAULT_ROW_H = 26;
const DEFAULT_COL_W = 96;
const HEADER_H = 28;
const ROW_HEADER_W = 44;

export function SheetGrid({
  sheet, engine, rowCount = 200, colCount = 26,
  selection, onSelect, onCellEdit,
}: Props) {
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const inSelection = useCallback((r: number, c: number) => {
    const [r1, r2] = [Math.min(selection.r1, selection.r2), Math.max(selection.r1, selection.r2)];
    const [c1, c2] = [Math.min(selection.c1, selection.c2), Math.max(selection.c1, selection.c2)];
    return r >= r1 && r <= r2 && c >= c1 && c <= c2;
  }, [selection]);

  const activeId = cellId(selection.r1, selection.c1);

  const displayValue = useCallback((r: number, c: number) => {
    const id = cellId(r, c);
    const raw = sheet.cells[id];
    if (raw == null || raw === "") return "";
    if (typeof raw === "string" && raw.startsWith("=") && engine) {
      const v = engine.getCell(sheet.name, r, c);
      return v == null ? "" : String(v);
    }
    return String(raw);
  }, [sheet, engine]);

  const dragStart = useRef<{ r: number; c: number } | null>(null);

  function beginEdit(r: number, c: number, initial?: string) {
    const id = cellId(r, c);
    const raw = sheet.cells[id];
    setEditing({ id, value: initial ?? (raw == null ? "" : String(raw)) });
  }
  function commitEdit(next?: { r: number; c: number }) {
    if (!editing) return;
    onCellEdit(editing.id, editing.value);
    setEditing(null);
    if (next) onSelect({ r1: next.r, c1: next.c, r2: next.r, c2: next.c });
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return;
    const { r1, c1 } = selection;
    let nr = r1, nc = c1;
    if (e.key === "ArrowDown") nr = Math.min(rowCount - 1, r1 + 1);
    else if (e.key === "ArrowUp") nr = Math.max(0, r1 - 1);
    else if (e.key === "ArrowRight" || e.key === "Tab") { nc = Math.min(colCount - 1, c1 + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") nc = Math.max(0, c1 - 1);
    else if (e.key === "Enter") { beginEdit(r1, c1); e.preventDefault(); return; }
    else if (e.key === "Delete" || e.key === "Backspace") { onCellEdit(cellId(r1, c1), ""); e.preventDefault(); return; }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { beginEdit(r1, c1, e.key); e.preventDefault(); return; }
    else return;
    onSelect({ r1: nr, c1: nc, r2: nr, c2: nc });
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex-1 overflow-auto bg-white outline-none focus:ring-0"
    >
      <table
        className="border-collapse select-none"
        style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}
      >
        <thead className="sticky top-0 z-20">
          <tr>
            <th
              className="bg-muted border-r border-b border-border sticky left-0 z-30"
              style={{ width: ROW_HEADER_W, height: HEADER_H }}
            />
            {Array.from({ length: colCount }).map((_, c) => (
              <th
                key={c}
                className={`bg-muted border-r border-b border-border font-medium text-[11px] text-muted-foreground ${
                  c >= Math.min(selection.c1, selection.c2) && c <= Math.max(selection.c1, selection.c2) ? "!bg-accent/15 !text-accent" : ""
                }`}
                style={{ width: DEFAULT_COL_W, height: HEADER_H }}
              >
                {colToLetter(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, r) => (
            <tr key={r}>
              <th
                className={`bg-muted border-r border-b border-border text-[11px] text-muted-foreground font-medium sticky left-0 z-10 ${
                  r >= Math.min(selection.r1, selection.r2) && r <= Math.max(selection.r1, selection.r2) ? "!bg-accent/15 !text-accent" : ""
                }`}
                style={{ width: ROW_HEADER_W, height: DEFAULT_ROW_H }}
              >
                {r + 1}
              </th>
              {Array.from({ length: colCount }).map((_, c) => {
                const id = cellId(r, c);
                const fmt = sheet.formats?.[id];
                const isActive = r === selection.r1 && c === selection.c1;
                const isSel = inSelection(r, c);
                const editingHere = editing?.id === id;
                return (
                  <td
                    key={c}
                    onMouseDown={(e) => {
                      dragStart.current = { r, c };
                      onSelect({ r1: r, c1: c, r2: r, c2: c });
                    }}
                    onMouseEnter={(e) => {
                      if (e.buttons === 1 && dragStart.current) {
                        onSelect({ r1: dragStart.current.r, c1: dragStart.current.c, r2: r, c2: c });
                      }
                    }}
                    onDoubleClick={() => beginEdit(r, c)}
                    className={`border-r border-b border-border align-middle relative ${
                      isActive ? "outline outline-2 outline-accent -outline-offset-2 z-[5]" : isSel ? "bg-accent/10" : ""
                    }`}
                    style={{
                      width: DEFAULT_COL_W,
                      height: DEFAULT_ROW_H,
                      padding: "0 6px",
                      fontWeight: fmt?.bold ? 600 : undefined,
                      fontStyle: fmt?.italic ? "italic" : undefined,
                      textDecoration: fmt?.underline ? "underline" : undefined,
                      color: fmt?.color,
                      background: !isSel && !isActive ? fmt?.bg : undefined,
                      textAlign: fmt?.align ?? (typeof sheet.cells[id] === "number" ? "right" : "left"),
                      cursor: "cell",
                    }}
                  >
                    {editingHere ? (
                      <input
                        ref={inputRef}
                        value={editing!.value}
                        onChange={(e) => setEditing({ id, value: e.target.value })}
                        onBlur={() => commitEdit()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { commitEdit({ r: r + 1, c }); e.preventDefault(); }
                          else if (e.key === "Tab") { commitEdit({ r, c: c + 1 }); e.preventDefault(); }
                          else if (e.key === "Escape") { setEditing(null); e.preventDefault(); }
                        }}
                        className="w-full h-full outline-none bg-white text-foreground border border-accent px-1"
                        style={{ fontSize: 13 }}
                      />
                    ) : (
                      <span className="block truncate">{displayValue(r, c)}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
