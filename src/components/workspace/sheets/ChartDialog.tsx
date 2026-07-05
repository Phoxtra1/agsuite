import { useMemo, useState } from "react";
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, AreaChart as AreaIcon, X } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cellId, parseCell, type SheetPage, type SheetChart } from "@/lib/workspace/sheets/documents";
import type { EngineHandle } from "@/lib/workspace/sheets/engine";

interface Props {
  sheet: SheetPage;
  engine: EngineHandle | null;
  defaultRange: string;
  onCancel: () => void;
  onInsert: (chart: SheetChart) => void;
}

const PALETTE = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function extractRangeData(
  sheet: SheetPage, engine: EngineHandle | null,
  range: string, headerRow: boolean,
): { rows: Array<Record<string, any>>; headers: string[] } {
  const m = range.match(/^([A-Z]+\d+):([A-Z]+\d+)$/i);
  if (!m) return { rows: [], headers: [] };
  const a = parseCell(m[1].toUpperCase())!;
  const b = parseCell(m[2].toUpperCase())!;
  const r1 = Math.min(a.row, b.row), r2 = Math.max(a.row, b.row);
  const c1 = Math.min(a.col, b.col), c2 = Math.max(a.col, b.col);
  const get = (r: number, c: number) => {
    const id = cellId(r, c);
    const raw = sheet.cells[id];
    if (typeof raw === "string" && raw.startsWith("=") && engine) return engine.getCell(sheet.name, r, c);
    return raw;
  };
  const headers: string[] = [];
  for (let c = c1; c <= c2; c++) headers.push(headerRow ? String(get(r1, c) ?? `Col${c}`) : `Col ${c - c1 + 1}`);
  const rows: any[] = [];
  const startR = headerRow ? r1 + 1 : r1;
  for (let r = startR; r <= r2; r++) {
    const row: any = { __label: String(get(r, c1) ?? `Row ${r + 1}`) };
    for (let c = c1; c <= c2; c++) {
      const v = get(r, c);
      const num = Number(v);
      row[headers[c - c1]] = Number.isFinite(num) ? num : v;
    }
    rows.push(row);
  }
  return { rows, headers };
}

export function ChartDialog({ sheet, engine, defaultRange, onCancel, onInsert }: Props) {
  const [type, setType] = useState<SheetChart["type"]>("bar");
  const [range, setRange] = useState(defaultRange || "A1:B10");
  const [headerRow, setHeaderRow] = useState(true);
  const [title, setTitle] = useState("");

  const { rows, headers } = useMemo(
    () => extractRangeData(sheet, engine, range, headerRow),
    [sheet, engine, range, headerRow]
  );
  const seriesKeys = headers.slice(1);

  const preview = (
    <ResponsiveContainer width="100%" height={280}>
      {type === "bar" ? (
        <BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="__label" /><YAxis /><Tooltip /><Legend />
          {seriesKeys.map((k, i) => <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} />)}
        </BarChart>
      ) : type === "line" ? (
        <LineChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="__label" /><YAxis /><Tooltip /><Legend />
          {seriesKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} />)}
        </LineChart>
      ) : type === "area" ? (
        <AreaChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="__label" /><YAxis /><Tooltip /><Legend />
          {seriesKeys.map((k, i) => <Area key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.4} />)}
        </AreaChart>
      ) : type === "scatter" ? (
        <ScatterChart><CartesianGrid /><XAxis dataKey={headers[0]} type="number" /><YAxis dataKey={headers[1]} type="number" /><Tooltip /><Legend />
          <Scatter data={rows} fill={PALETTE[0]} />
        </ScatterChart>
      ) : (
        <PieChart><Tooltip /><Legend />
          <Pie data={rows} dataKey={seriesKeys[0]} nameKey="__label" outerRadius={100} label>
            {rows.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
        </PieChart>
      )}
    </ResponsiveContainer>
  );

  const types: Array<{ id: SheetChart["type"]; label: string; icon: any }> = [
    { id: "bar", label: "Column", icon: BarChart3 },
    { id: "line", label: "Line", icon: LineIcon },
    { id: "area", label: "Area", icon: AreaIcon },
    { id: "pie", label: "Pie", icon: PieIcon },
    { id: "scatter", label: "Scatter", icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Insert chart</h2>
          </div>
          <button onClick={onCancel} className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {types.map((t) => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5
                  ${type === t.id ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs">
              <span className="block text-muted-foreground mb-1">Data range</span>
              <input value={range} onChange={(e) => setRange(e.target.value.toUpperCase())}
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background font-mono text-xs" />
            </label>
            <label className="text-xs">
              <span className="block text-muted-foreground mb-1">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional"
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-xs" />
            </label>
            <label className="text-xs flex items-center gap-2 pt-5">
              <input type="checkbox" checked={headerRow} onChange={(e) => setHeaderRow(e.target.checked)} />
              First row is header
            </label>
          </div>

          {title && <div className="text-center font-semibold text-sm">{title}</div>}
          <div className="border border-border rounded-lg p-3 bg-background">
            {rows.length ? preview : <div className="text-xs text-muted-foreground text-center py-16">No data in range.</div>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-xs hover:bg-muted">Cancel</button>
          <button
            onClick={() => onInsert({
              id: crypto.randomUUID(), type, title, range, headerRow,
              x: 40, y: 40, w: 480, h: 320,
            })}
            disabled={!rows.length}
            className="px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 disabled:opacity-50"
          >Insert chart</button>
        </div>
      </div>
    </div>
  );
}

/** Chart rendered as a movable overlay on the sheet grid. */
export function SheetChartOverlay({
  chart, sheet, engine, onChange, onDelete,
}: {
  chart: SheetChart;
  sheet: SheetPage;
  engine: EngineHandle | null;
  onChange: (patch: Partial<SheetChart>) => void;
  onDelete: () => void;
}) {
  const { rows, headers } = useMemo(
    () => extractRangeData(sheet, engine, chart.range, chart.headerRow ?? true),
    [sheet, engine, chart.range, chart.headerRow]
  );
  const seriesKeys = headers.slice(1);

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox = chart.x, oy = chart.y;
    const move = (ev: MouseEvent) => onChange({ x: ox + (ev.clientX - sx), y: oy + (ev.clientY - sy) });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };
  const onResize = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, ow = chart.w, oh = chart.h;
    const move = (ev: MouseEvent) => onChange({
      w: Math.max(240, ow + (ev.clientX - sx)),
      h: Math.max(180, oh + (ev.clientY - sy)),
    });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };

  return (
    <div
      className="absolute bg-card border border-border rounded-lg shadow-xl overflow-hidden"
      style={{ left: chart.x, top: chart.y, width: chart.w, height: chart.h, zIndex: 20 }}
    >
      <div onMouseDown={onDragStart} className="flex items-center justify-between px-2 py-1 bg-muted/60 border-b border-border cursor-move">
        <span className="text-[11px] font-semibold truncate">{chart.title || `${chart.type.toUpperCase()} — ${chart.range}`}</span>
        <button onClick={onDelete} className="h-5 w-5 rounded hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
      </div>
      <div className="p-2" style={{ height: chart.h - 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "bar" ? (
            <BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="__label" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              {seriesKeys.map((k, i) => <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} />)}
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="__label" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              {seriesKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} />)}
            </LineChart>
          ) : chart.type === "area" ? (
            <AreaChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="__label" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              {seriesKeys.map((k, i) => <Area key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.4} />)}
            </AreaChart>
          ) : chart.type === "scatter" ? (
            <ScatterChart><CartesianGrid /><XAxis dataKey={headers[0]} type="number" fontSize={10} /><YAxis dataKey={headers[1]} type="number" fontSize={10} /><Tooltip />
              <Scatter data={rows} fill={PALETTE[0]} />
            </ScatterChart>
          ) : (
            <PieChart><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Pie data={rows} dataKey={seriesKeys[0]} nameKey="__label" outerRadius="70%" label={{ fontSize: 10 }}>
                {rows.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
      <div onMouseDown={onResize} className="absolute -right-1 -bottom-1 w-3 h-3 bg-accent border border-white rounded-sm cursor-nwse-resize" />
    </div>
  );
}
