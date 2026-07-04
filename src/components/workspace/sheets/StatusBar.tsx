import { useMemo } from "react";
import type { SheetPage } from "@/lib/workspace/sheets/documents";
import { cellId } from "@/lib/workspace/sheets/documents";
import { Minus, Plus } from "lucide-react";

interface Selection { r1: number; c1: number; r2: number; c2: number; }

interface Props {
  sheet: SheetPage;
  selection: Selection;
  engine: any;
  zoom: number;
  onZoom: (z: number) => void;
  saving: "idle" | "saving" | "saved";
}

export function StatusBar({ sheet, selection, engine, zoom, onZoom, saving }: Props) {
  const stats = useMemo(() => {
    const [r1, r2] = [Math.min(selection.r1, selection.r2), Math.max(selection.r1, selection.r2)];
    const [c1, c2] = [Math.min(selection.c1, selection.c2), Math.max(selection.c1, selection.c2)];
    let sum = 0, count = 0, numCount = 0, min = Infinity, max = -Infinity;
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const id = cellId(r, c);
        let v: any = sheet.cells[id];
        if (v == null || v === "") continue;
        count++;
        if (typeof v === "string" && v.startsWith("=") && engine) v = engine.getCell(sheet.name, r, c);
        const n = Number(v);
        if (Number.isFinite(n)) { sum += n; numCount++; if (n < min) min = n; if (n > max) max = n; }
      }
    }
    return {
      count, numCount, sum,
      avg: numCount ? sum / numCount : null,
      min: numCount ? min : null,
      max: numCount ? max : null,
    };
  }, [sheet, selection, engine]);

  const rows = Math.abs(selection.r2 - selection.r1) + 1;
  const cols = Math.abs(selection.c2 - selection.c1) + 1;

  const chip = (label: string, val: any) =>
    val === null || val === undefined ? null : (
      <span className="px-2 py-0.5 rounded bg-muted/50 border border-border font-mono text-[10.5px]">
        <span className="text-muted-foreground">{label}:</span>{" "}
        <span className="text-foreground">{typeof val === "number" ? val.toLocaleString(undefined, { maximumFractionDigits: 4 }) : val}</span>
      </span>
    );

  return (
    <footer className="h-8 border-t border-border bg-card flex items-center justify-between px-3 text-[11px] text-muted-foreground flex-shrink-0 gap-3">
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
        <span className="text-emerald-600 font-medium">
          {saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : "Ready"}
        </span>
        <span className="opacity-40">·</span>
        <span>{rows}R × {cols}C</span>
        {stats.count > 1 && (
          <>
            {chip("Sum", stats.sum)}
            {chip("Avg", stats.avg)}
            {chip("Min", stats.min)}
            {chip("Max", stats.max)}
            {chip("Count", stats.count)}
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onZoom(Math.max(50, zoom - 10))}
          className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center"
          aria-label="Zoom out"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="range" min={50} max={200} step={10} value={zoom}
          onChange={(e) => onZoom(Number(e.target.value))}
          className="w-28 accent-accent"
        />
        <button
          onClick={() => onZoom(Math.min(200, zoom + 10))}
          className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center"
          aria-label="Zoom in"
        >
          <Plus className="h-3 w-3" />
        </button>
        <span className="w-10 text-right font-mono tabular-nums">{zoom}%</span>
      </div>
    </footer>
  );
}
