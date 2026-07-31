import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, BarChart3, TrendingUp, Sigma, GitBranch } from "lucide-react";
import {
  describe, frequencyTable, pearson, spearman, correlationMatrix,
  linearRegression, oneSampleT, twoSampleT, pairedT, oneWayAnova,
  chiSquare, outliersIQR, kmeans, movingAverage, exponentialSmoothing,
} from "@/lib/workspace/sheets/stats";
import type { SheetPage } from "@/lib/workspace/sheets/documents";
import { cellId, parseCell } from "@/lib/workspace/sheets/documents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell,
} from "recharts";

interface Selection { r1: number; c1: number; r2: number; c2: number; }
interface Props {
  sheet: SheetPage;
  selection: Selection;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  engine: any;
}

type Mode =
  | "descriptive" | "frequency" | "correlation" | "regression"
  | "ttest" | "anova" | "chi" | "outliers" | "cluster"
  | "timeseries" | "chart" | "intelligence";

const CHART_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

export function AnalysisPanel({ sheet, selection, collapsed, onToggleCollapsed, engine }: Props) {
  const [mode, setMode] = useState<Mode>("descriptive");
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const rangeData = useMemo(() => extractRange(sheet, selection, engine), [sheet, selection, engine]);
  const numericCols = useMemo(() => rangeData.columns.filter((c) => c.values.some((v) => Number.isFinite(Number(v)))), [rangeData]);

  async function runAI(action: string) {
    setAiBusy(true);
    try {
      const payload = { columns: numericCols.slice(0, 6).map((c) => ({ name: c.name, values: c.values.slice(0, 200) })) };
      const { data, error } = await supabase.functions.invoke("sheets-intelligence", { body: { action, payload } });
      if (error) throw error;
      setAiText((data as any)?.result ?? JSON.stringify(data));
    } catch (e: any) {
      toast({ title: "Intelligence failed", description: e.message, variant: "destructive" as any });
    } finally { setAiBusy(false); }
  }

  if (collapsed) {
    return (
      <div className="w-10 border-l border-border bg-card flex flex-col items-center py-2">
        <button onClick={onToggleCollapsed} className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-3 text-[10px] font-semibold text-muted-foreground vertical-writing" style={{ writingMode: "vertical-rl" }}>
          Dipa
        </div>
      </div>
    );
  }

  return (
    <aside className="w-[380px] border-l border-border bg-card flex flex-col overflow-hidden">
      <header className="h-11 px-3 flex items-center justify-between border-b border-border">
        <div className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold text-foreground">Dipa</span>
        </div>
        <button onClick={onToggleCollapsed} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center">
          <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      <div className="border-b border-border p-2 grid grid-cols-4 gap-1 text-[11px]">
        {[
          ["descriptive","Descriptive"],["frequency","Frequency"],
          ["correlation","Correlation"],["regression","Regression"],
          ["ttest","t-test"],["anova","ANOVA"],
          ["chi","Chi-sq"],["outliers","Outliers"],
          ["cluster","k-means"],["timeseries","Time-series"],
          ["chart","Chart"],["intelligence","Dipa"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id as Mode)}
            className={`px-1 py-1 rounded text-center ${mode === id ? "bg-accent text-accent-foreground" : "hover:bg-muted text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3 text-xs">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Selection: <span className="font-mono text-foreground">{cellId(selection.r1, selection.c1)}:{cellId(selection.r2, selection.c2)}</span> · {rangeData.columns.length} col × {rangeData.rowCount} row
        </div>

        {mode === "descriptive" && <DescriptiveView cols={numericCols} />}
        {mode === "frequency" && <FrequencyView cols={rangeData.columns} />}
        {mode === "correlation" && <CorrelationView cols={numericCols} />}
        {mode === "regression" && <RegressionView cols={numericCols} />}
        {mode === "ttest" && <TTestView cols={numericCols} />}
        {mode === "anova" && <AnovaView cols={numericCols} />}
        {mode === "chi" && <ChiView cols={rangeData.columns} />}
        {mode === "outliers" && <OutliersView cols={numericCols} />}
        {mode === "cluster" && <ClusterView cols={numericCols} />}
        {mode === "timeseries" && <TimeSeriesView cols={numericCols} />}
        {mode === "chart" && <ChartView cols={numericCols} />}
        {mode === "intelligence" && (
          <div className="space-y-2">
            <div className="text-muted-foreground">Ask Dipa about this selection.</div>
            <div className="grid gap-1.5">
              <button onClick={() => runAI("summarize")} disabled={aiBusy} className="text-left px-3 py-2 rounded border border-border hover:bg-muted">Explain this data</button>
              <button onClick={() => runAI("chart")} disabled={aiBusy} className="text-left px-3 py-2 rounded border border-border hover:bg-muted">Suggest a chart</button>
              <button onClick={() => runAI("anomalies")} disabled={aiBusy} className="text-left px-3 py-2 rounded border border-border hover:bg-muted">Detect anomalies</button>
              <button onClick={() => runAI("cleanup")} disabled={aiBusy} className="text-left px-3 py-2 rounded border border-border hover:bg-muted">Data cleanup suggestions</button>
            </div>
            {aiBusy && <div className="text-accent">Working…</div>}
            {aiText && (
              <div className="mt-2 p-3 rounded bg-muted whitespace-pre-wrap text-foreground text-[11px]">{aiText}</div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

/* ------------- Range extraction ------------- */
function extractRange(sheet: SheetPage, sel: Selection, engine: any) {
  const [r1, r2] = [Math.min(sel.r1, sel.r2), Math.max(sel.r1, sel.r2)];
  const [c1, c2] = [Math.min(sel.c1, sel.c2), Math.max(sel.c1, sel.c2)];
  const rowCount = r2 - r1 + 1;
  const columns: { name: string; values: any[] }[] = [];
  for (let c = c1; c <= c2; c++) {
    const values: any[] = [];
    // Use first row as header if it's non-numeric
    const headerRaw = sheet.cells[cellId(r1, c)];
    const useHeader = typeof headerRaw === "string" && isNaN(Number(headerRaw));
    const startRow = useHeader ? r1 + 1 : r1;
    const name = useHeader ? String(headerRaw) : `Col ${c - c1 + 1}`;
    for (let r = startRow; r <= r2; r++) {
      const id = cellId(r, c);
      const raw = sheet.cells[id];
      if (raw != null && typeof raw === "string" && raw.startsWith("=") && engine) {
        values.push(engine.getCell(sheet.name, r, c));
      } else values.push(raw);
    }
    columns.push({ name, values });
  }
  return { columns, rowCount };
}

/* ------------- Sub-views ------------- */
function StatRow({ label, value }: any) {
  return (
    <div className="flex justify-between py-0.5 border-b border-border last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{typeof value === "number" ? value.toFixed(4) : String(value)}</span>
    </div>
  );
}

function DescriptiveView({ cols }: any) {
  if (!cols.length) return <div className="text-muted-foreground">Select numeric data.</div>;
  return (
    <div className="space-y-4">
      {cols.map((c: any) => {
        const d = describe(c.values);
        if (!d) return null;
        return (
          <div key={c.name} className="border border-border rounded p-2 bg-background">
            <div className="font-semibold text-foreground mb-1">{c.name}</div>
            <StatRow label="N" value={d.n} />
            <StatRow label="Mean" value={d.mean} />
            <StatRow label="Median" value={d.median} />
            <StatRow label="Mode" value={d.mode} />
            <StatRow label="Std. Dev." value={d.stdev} />
            <StatRow label="Variance" value={d.variance} />
            <StatRow label="Std. Error" value={d.se} />
            <StatRow label="Min" value={d.min} />
            <StatRow label="Max" value={d.max} />
            <StatRow label="Range" value={d.range} />
            <StatRow label="Q1" value={d.q1} />
            <StatRow label="Q3" value={d.q3} />
            <StatRow label="IQR" value={d.iqr} />
            <StatRow label="Skewness" value={d.skewness} />
            <StatRow label="Kurtosis" value={d.kurtosis} />
            <StatRow label="Sum" value={d.sum} />
          </div>
        );
      })}
    </div>
  );
}

function FrequencyView({ cols }: any) {
  const col = cols[0];
  if (!col) return null;
  const t = frequencyTable(col.values);
  return (
    <div>
      <div className="font-semibold text-foreground mb-2">Frequency — {col.name}</div>
      <table className="w-full">
        <thead className="text-muted-foreground text-left">
          <tr><th>Value</th><th>Count</th><th>%</th><th>Cum %</th></tr>
        </thead>
        <tbody>
          {t.slice(0, 30).map((row) => (
            <tr key={row.value} className="border-t border-border">
              <td className="py-0.5">{row.value}</td>
              <td className="font-mono">{row.count}</td>
              <td className="font-mono">{row.percent.toFixed(1)}%</td>
              <td className="font-mono">{row.cumulative.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CorrelationView({ cols }: any) {
  if (cols.length < 2) return <div className="text-muted-foreground">Select at least 2 numeric columns.</div>;
  const { labels, matrix } = correlationMatrix(cols, "pearson");
  return (
    <div>
      <div className="font-semibold text-foreground mb-2">Pearson correlation</div>
      <table className="w-full text-[10px]">
        <thead><tr><th></th>{labels.map((l) => <th key={l} className="text-muted-foreground">{l}</th>)}</tr></thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th className="text-left text-muted-foreground pr-1">{labels[i]}</th>
              {row.map((v, j) => (
                <td key={j} className="font-mono text-center p-1" style={{
                  background: `rgba(${v > 0 ? "59,130,246" : "239,68,68"},${Math.abs(v) * 0.5})`,
                  color: Math.abs(v) > 0.5 ? "white" : undefined,
                }}>{isFinite(v) ? v.toFixed(2) : "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegressionView({ cols }: any) {
  if (cols.length < 2) return <div className="text-muted-foreground">Need at least 2 columns (X, Y).</div>;
  const x = cols[0].values.map(Number).filter((n: any) => Number.isFinite(n));
  const y = cols[1].values.map(Number).filter((n: any) => Number.isFinite(n));
  const r = linearRegression(x, y);
  if (!r) return <div className="text-muted-foreground">Insufficient data.</div>;
  const data = x.map((xi: number, i: number) => ({ x: xi, y: y[i], yhat: r.predictions[i] }));
  return (
    <div className="space-y-2">
      <div className="font-semibold text-foreground">Linear regression Y = a + bX</div>
      <StatRow label="Slope (b)" value={r.slope} />
      <StatRow label="Intercept (a)" value={r.intercept} />
      <StatRow label="R²" value={r.r2} />
      <StatRow label="Adj R²" value={r.adjustedR2} />
      <StatRow label="Std Error (b)" value={r.seSlope} />
      <StatRow label="t-statistic" value={r.tStat} />
      <StatRow label="N" value={r.n} />
      <div className="h-40 mt-2">
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" fontSize={9} />
            <YAxis fontSize={9} />
            <Tooltip />
            <Scatter data={data} fill="#3b82f6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TTestView({ cols }: any) {
  const [type, setType] = useState<"one" | "two" | "paired">("one");
  const [mu, setMu] = useState(0);
  const a = (cols[0]?.values ?? []).map(Number).filter((n: any) => Number.isFinite(n));
  const b = (cols[1]?.values ?? []).map(Number).filter((n: any) => Number.isFinite(n));
  const result =
    type === "one" ? oneSampleT(a, mu) :
    type === "two" ? twoSampleT(a, b) :
    pairedT(a, b);
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {(["one","two","paired"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`px-2 py-1 rounded text-[10px] ${type === t ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
            {t === "one" ? "One-sample" : t === "two" ? "Two-sample" : "Paired"}
          </button>
        ))}
      </div>
      {type === "one" && (
        <label className="flex gap-2 items-center mb-2">μ =
          <input type="number" value={mu} onChange={(e) => setMu(Number(e.target.value))}
            className="w-20 px-2 py-0.5 border border-border rounded" />
        </label>
      )}
      {result && Object.entries(result).map(([k, v]) => (
        <StatRow key={k} label={k} value={v as any} />
      ))}
    </div>
  );
}

function AnovaView({ cols }: any) {
  const groups = cols.map((c: any) => c.values.map(Number).filter((n: any) => Number.isFinite(n)));
  const r = oneWayAnova(groups);
  if (!r) return <div className="text-muted-foreground">Need ≥2 numeric columns.</div>;
  return <div>{Object.entries(r).map(([k, v]) => <StatRow key={k} label={k} value={v as any} />)}</div>;
}

function ChiView({ cols }: any) {
  if (cols.length < 2) return <div className="text-muted-foreground">Select a contingency table (rows × columns).</div>;
  const observed = cols.map((c: any) => c.values.map(Number).map((v: number) => Number.isFinite(v) ? v : 0));
  // transpose so rows in original selection become rows in test
  const rows = observed[0].length;
  const table: number[][] = [];
  for (let i = 0; i < rows; i++) table.push(observed.map((c: number[]) => c[i]));
  const r = chiSquare(table);
  return <div>{Object.entries(r).map(([k, v]) => <StatRow key={k} label={k} value={v as any} />)}</div>;
}

function OutliersView({ cols }: any) {
  return (
    <div className="space-y-3">
      {cols.map((c: any) => {
        const a = c.values.map(Number).filter((n: any) => Number.isFinite(n));
        const o = outliersIQR(a);
        return (
          <div key={c.name} className="border border-border rounded p-2 bg-background">
            <div className="font-semibold text-foreground mb-1">{c.name}</div>
            <StatRow label="Lower bound" value={o.lower ?? NaN} />
            <StatRow label="Upper bound" value={o.upper ?? NaN} />
            <StatRow label="Outlier count" value={o.indices.length} />
            {o.values.length > 0 && (
              <div className="mt-1 font-mono text-[10px] text-destructive">{o.values.join(", ")}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClusterView({ cols }: any) {
  const [k, setK] = useState(3);
  if (cols.length < 2) return <div className="text-muted-foreground">Select ≥2 numeric columns.</div>;
  const rows = cols[0].values.length;
  const points: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const p = cols.map((c: any) => Number(c.values[i]));
    if (p.every((n: number) => Number.isFinite(n))) points.push(p);
  }
  const r = kmeans(points, k);
  if (!r) return null;
  return (
    <div>
      <label className="flex gap-2 items-center mb-2">k =
        <input type="number" value={k} min={2} max={8} onChange={(e) => setK(Number(e.target.value))}
          className="w-16 px-2 py-0.5 border border-border rounded" />
      </label>
      <div className="font-semibold text-foreground mb-1">Centroids</div>
      {r.centroids.map((c, i) => (
        <div key={i} className="font-mono text-[10px] text-muted-foreground">
          C{i}: [{c.map((n) => n.toFixed(2)).join(", ")}]
        </div>
      ))}
    </div>
  );
}

function TimeSeriesView({ cols }: any) {
  const [window, setWindow] = useState(3);
  const [alpha, setAlpha] = useState(0.3);
  const a = (cols[0]?.values ?? []).map(Number).filter((n: any) => Number.isFinite(n));
  const ma = movingAverage(a, window);
  const es = exponentialSmoothing(a, alpha);
  const data = a.map((v: number, i: number) => ({ i, value: v, ma: ma[i], es: es[i] }));
  return (
    <div>
      <div className="flex gap-3 mb-2">
        <label className="text-[10px]">Window
          <input type="number" min={2} max={12} value={window} onChange={(e) => setWindow(Number(e.target.value))}
            className="ml-1 w-12 px-1 border border-border rounded" />
        </label>
        <label className="text-[10px]">α
          <input type="number" step={0.1} min={0} max={1} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))}
            className="ml-1 w-12 px-1 border border-border rounded" />
        </label>
      </div>
      <div className="h-40">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="i" fontSize={9} />
            <YAxis fontSize={9} />
            <Tooltip />
            <Line dataKey="value" stroke="#94a3b8" dot={false} />
            <Line dataKey="ma" stroke="#3b82f6" dot={false} />
            <Line dataKey="es" stroke="#f59e0b" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartView({ cols }: any) {
  const [type, setType] = useState<"bar" | "line" | "pie" | "scatter">("bar");
  const rows = cols[0]?.values?.length ?? 0;
  const data = Array.from({ length: rows }).map((_, i) => {
    const row: any = { i: i + 1 };
    cols.forEach((c: any) => { row[c.name] = Number(c.values[i]); });
    return row;
  });
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {(["bar","line","pie","scatter"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`px-2 py-1 rounded text-[10px] ${type === t ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="h-48 bg-white border border-border rounded p-1">
        <ResponsiveContainer>
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="i" fontSize={9} /><YAxis fontSize={9} /><Tooltip />
              {cols.map((c: any, i: number) => <Bar key={c.name} dataKey={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </BarChart>
          ) : type === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="i" fontSize={9} /><YAxis fontSize={9} /><Tooltip />
              {cols.map((c: any, i: number) => <Line key={c.name} dataKey={c.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} dot={false} />)}
            </LineChart>
          ) : type === "scatter" ? (
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey={cols[0]?.name} fontSize={9} />
              <YAxis type="number" dataKey={cols[1]?.name} fontSize={9} />
              <Tooltip /><Scatter data={data} fill="#3b82f6" />
            </ScatterChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey={cols[0]?.name} nameKey="i" outerRadius={70}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie><Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
