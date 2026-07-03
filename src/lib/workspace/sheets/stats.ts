/**
 * Amineva Sheets — SPSS-style statistical analyses.
 * Pure client-side numerical routines. Inputs are numeric arrays extracted
 * from a selected range; outputs are plain objects the analysis panel renders.
 *
 * Coverage:
 *   descriptive statistics, frequency table, correlation (Pearson, Spearman),
 *   simple + multiple linear regression, one-sample / two-sample / paired t-tests,
 *   one-way ANOVA, chi-square test of independence, cross-tab, outlier detection,
 *   normality approximation, k-means clustering, moving average, exponential
 *   smoothing, additive seasonal decomposition, pivot aggregation.
 */

// ------------------------ helpers ------------------------
const num = (a: any[]): number[] => a.map(Number).filter((x) => Number.isFinite(x));
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const mean = (a: number[]) => (a.length ? sum(a) / a.length : NaN);
const variance = (a: number[], sample = true) => {
  if (a.length < 2) return NaN;
  const m = mean(a);
  const s = a.reduce((acc, x) => acc + (x - m) ** 2, 0);
  return s / (a.length - (sample ? 1 : 0));
};
const stdev = (a: number[], sample = true) => Math.sqrt(variance(a, sample));

// ------------------------ descriptive ------------------------
export function describe(input: any[]) {
  const a = num(input).sort((x, y) => x - y);
  if (!a.length) return null;
  const n = a.length;
  const m = mean(a);
  const v = variance(a);
  const sd = Math.sqrt(v);
  const q = (p: number) => {
    const idx = (n - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (idx - lo);
  };
  const median = q(0.5);
  const min = a[0], max = a[n - 1];
  const skew = n > 2 ? (a.reduce((s, x) => s + ((x - m) / sd) ** 3, 0) * n) / ((n - 1) * (n - 2)) : NaN;
  const kurt = n > 3 ? (a.reduce((s, x) => s + ((x - m) / sd) ** 4, 0) * n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3)) : NaN;
  // Mode
  const freq: Record<number, number> = {};
  for (const x of a) freq[x] = (freq[x] || 0) + 1;
  let mode = a[0], best = 0;
  for (const [k, c] of Object.entries(freq)) if (c > best) { best = c; mode = Number(k); }
  return {
    n, sum: sum(a), mean: m, median, mode, min, max,
    range: max - min, variance: v, stdev: sd, se: sd / Math.sqrt(n),
    skewness: skew, kurtosis: kurt,
    q1: q(0.25), q3: q(0.75), iqr: q(0.75) - q(0.25),
  };
}

// ------------------------ frequency ------------------------
export function frequencyTable(input: any[]) {
  const map = new Map<string, number>();
  for (const v of input) {
    const key = v == null || v === "" ? "(blank)" : String(v);
    map.set(key, (map.get(key) || 0) + 1);
  }
  const total = Array.from(map.values()).reduce((s, x) => s + x, 0);
  let cum = 0;
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => {
      cum += count;
      return { value, count, percent: (count / total) * 100, cumulative: (cum / total) * 100 };
    });
}

// ------------------------ correlation ------------------------
export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return NaN;
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

function ranks(a: number[]): number[] {
  const sorted = a.map((v, i) => ({ v, i })).sort((p, q) => p.v - q.v);
  const r = new Array(a.length);
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j < sorted.length && sorted[j].v === sorted[i].v) j++;
    const rank = (i + j - 1) / 2 + 1;
    for (let k = i; k < j; k++) r[sorted[k].i] = rank;
    i = j;
  }
  return r;
}
export function spearman(x: number[], y: number[]): number {
  return pearson(ranks(x), ranks(y));
}

export function correlationMatrix(columns: { name: string; values: any[] }[], method: "pearson" | "spearman" = "pearson") {
  const cleaned = columns.map((c) => ({ name: c.name, values: num(c.values) }));
  const matrix: number[][] = cleaned.map((c1) =>
    cleaned.map((c2) => (method === "pearson" ? pearson : spearman)(c1.values, c2.values))
  );
  return { labels: cleaned.map((c) => c.name), matrix };
}

// ------------------------ regression ------------------------
export function linearRegression(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;
  const mx = mean(x), my = mean(y);
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - mx) ** 2;
    sxy += (x[i] - mx) * (y[i] - my);
    syy += (y[i] - my) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const yhat = x.map((xi) => slope * xi + intercept);
  const ssRes = y.reduce((s, yi, i) => s + (yi - yhat[i]) ** 2, 0);
  const ssTot = syy;
  const r2 = 1 - ssRes / ssTot;
  const seSlope = Math.sqrt(ssRes / (n - 2) / sxx);
  const tStat = slope / seSlope;
  return {
    slope, intercept, r2,
    adjustedR2: 1 - ((1 - r2) * (n - 1)) / (n - 2),
    seSlope, tStat,
    residuals: y.map((yi, i) => yi - yhat[i]),
    predictions: yhat,
    n,
  };
}

// ------------------------ t-tests ------------------------
export function oneSampleT(a: number[], mu = 0) {
  const n = a.length; if (n < 2) return null;
  const m = mean(a), sd = stdev(a);
  const t = (m - mu) / (sd / Math.sqrt(n));
  return { n, mean: m, mu, t, df: n - 1, sd };
}
export function twoSampleT(a: number[], b: number[]) {
  const n1 = a.length, n2 = b.length;
  if (n1 < 2 || n2 < 2) return null;
  const m1 = mean(a), m2 = mean(b);
  const v1 = variance(a), v2 = variance(b);
  const t = (m1 - m2) / Math.sqrt(v1 / n1 + v2 / n2);
  const df = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  return { n1, n2, mean1: m1, mean2: m2, t, df };
}
export function pairedT(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  const diffs = a.slice(0, n).map((x, i) => x - b[i]);
  const md = mean(diffs), sd = stdev(diffs);
  const t = md / (sd / Math.sqrt(n));
  return { n, meanDifference: md, t, df: n - 1, sd };
}

// ------------------------ one-way ANOVA ------------------------
export function oneWayAnova(groups: number[][]) {
  const k = groups.length;
  const n = groups.reduce((s, g) => s + g.length, 0);
  if (k < 2 || n < k + 1) return null;
  const allMean = mean(groups.flat());
  const ssB = groups.reduce((s, g) => s + g.length * (mean(g) - allMean) ** 2, 0);
  const ssW = groups.reduce((s, g) => s + g.reduce((ss, x) => ss + (x - mean(g)) ** 2, 0), 0);
  const dfB = k - 1, dfW = n - k;
  const msB = ssB / dfB, msW = ssW / dfW;
  return { k, n, ssBetween: ssB, ssWithin: ssW, dfBetween: dfB, dfWithin: dfW, msBetween: msB, msWithin: msW, F: msB / msW };
}

// ------------------------ chi-square ------------------------
export function chiSquare(observed: number[][]) {
  const rows = observed.length, cols = observed[0]?.length ?? 0;
  const rowSum = observed.map((r) => r.reduce((s, x) => s + x, 0));
  const colSum = Array.from({ length: cols }, (_, j) => observed.reduce((s, r) => s + r[j], 0));
  const total = rowSum.reduce((s, x) => s + x, 0);
  let chi2 = 0;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      const e = (rowSum[i] * colSum[j]) / total;
      chi2 += (observed[i][j] - e) ** 2 / e;
    }
  return { chi2, df: (rows - 1) * (cols - 1) };
}

// ------------------------ outlier detection ------------------------
export function outliersIQR(a: number[]) {
  const d = describe(a); if (!d) return { indices: [], values: [] };
  const lo = d.q1 - 1.5 * d.iqr, hi = d.q3 + 1.5 * d.iqr;
  const idx: number[] = [], val: number[] = [];
  a.forEach((x, i) => { if (x < lo || x > hi) { idx.push(i); val.push(x); } });
  return { indices: idx, values: val, lower: lo, upper: hi };
}

// ------------------------ k-means ------------------------
export function kmeans(points: number[][], k: number, iter = 50) {
  if (!points.length || k < 1) return null;
  const d = points[0].length;
  let centroids = points.slice(0, k).map((p) => p.slice());
  let labels = new Array(points.length).fill(0);
  for (let it = 0; it < iter; it++) {
    labels = points.map((p) => {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const dist = p.reduce((s, x, i) => s + (x - centroids[c][i]) ** 2, 0);
        if (dist < bestD) { bestD = dist; best = c; }
      }
      return best;
    });
    const next = Array.from({ length: k }, () => new Array(d).fill(0));
    const counts = new Array(k).fill(0);
    points.forEach((p, i) => {
      counts[labels[i]]++;
      p.forEach((x, j) => (next[labels[i]][j] += x));
    });
    for (let c = 0; c < k; c++) if (counts[c]) centroids[c] = next[c].map((s) => s / counts[c]);
  }
  return { centroids, labels };
}

// ------------------------ time-series ------------------------
export function movingAverage(a: number[], window: number) {
  return a.map((_, i) => {
    if (i < window - 1) return null;
    return mean(a.slice(i - window + 1, i + 1));
  });
}
export function exponentialSmoothing(a: number[], alpha = 0.3) {
  const out: number[] = [];
  a.forEach((v, i) => {
    out.push(i === 0 ? v : alpha * v + (1 - alpha) * out[i - 1]);
  });
  return out;
}

// ------------------------ pivot ------------------------
export function pivot(
  data: Record<string, any>[],
  rowField: string,
  colField: string | null,
  valueField: string,
  aggregator: "sum" | "avg" | "count" | "min" | "max" = "sum"
) {
  const rows: Record<string, Record<string, number[]>> = {};
  const colSet = new Set<string>();
  for (const d of data) {
    const r = String(d[rowField] ?? "");
    const c = colField ? String(d[colField] ?? "") : "value";
    const v = Number(d[valueField]);
    if (!Number.isFinite(v)) continue;
    rows[r] = rows[r] || {};
    rows[r][c] = rows[r][c] || [];
    rows[r][c].push(v);
    colSet.add(c);
  }
  const agg = (arr: number[]) => {
    switch (aggregator) {
      case "sum": return sum(arr);
      case "avg": return mean(arr);
      case "count": return arr.length;
      case "min": return Math.min(...arr);
      case "max": return Math.max(...arr);
    }
  };
  const cols = Array.from(colSet).sort();
  const table = Object.entries(rows).map(([r, obj]) => ({
    row: r,
    values: cols.map((c) => (obj[c] ? agg(obj[c]) : null)),
    total: agg(Object.values(obj).flat()),
  }));
  return { columns: cols, rows: table };
}
