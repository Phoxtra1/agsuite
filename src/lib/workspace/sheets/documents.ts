import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceSheet {
  id: string;
  owner_id: string;
  title: string;
  workbook_json: Workbook;
  content_text: string;
  created_at: string;
  updated_at: string;
}

export interface SheetChart {
  id: string;
  type: "bar" | "line" | "pie" | "area" | "scatter";
  title?: string;
  range: string; // e.g. "A1:C10"
  headerRow?: boolean;
  x: number; y: number; w: number; h: number;
}

export interface SheetPage {
  name: string;
  cells: Record<string, CellValue>;
  colWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
  formats?: Record<string, CellFormat>;
  frozenRows?: number;
  frozenCols?: number;
  hiddenRows?: number[];
  hiddenCols?: number[];
  tabColor?: string;
  merges?: string[]; // "A1:C3"
  protected?: boolean;
  charts?: SheetChart[];
}

export interface Workbook {
  sheets: SheetPage[];
  namedRanges?: Record<string, string>;
  activeSheet?: number;
  activeSolution?: {
    type: "CRM" | "Inventory" | "HR" | "Registry" | "Project" | "Custom";
    meetings?: any[];
  };
}

export type CellValue = string | number | boolean | null;

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  bg?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  numberFormat?: "general" | "number" | "currency" | "percent" | "date" | "time" | "scientific";
  decimals?: number;
  fontFamily?: string;
  fontSize?: number;
  wrap?: boolean;
  border?: "all" | "outer" | "top" | "bottom" | "left" | "right" | "none";
  rotation?: number;
}

export interface SheetShare {
  id: string; sheet_id: string; token: string;
  mode: "view" | "edit"; revoked: boolean;
  expires_at: string | null; created_at: string;
}

export const EMPTY_WORKBOOK: Workbook = {
  sheets: [{ name: "Sheet1", cells: {} }],
  namedRanges: {},
  activeSheet: 0,
};

export async function listSheets(): Promise<WorkspaceSheet[]> {
  const { data, error } = await supabase.from("workspace_sheets" as any).select("*").order("updated_at", { ascending: false });
  if (error) { console.error("[sheets] list", error); return []; }
  return (data as any) || [];
}
export async function getSheet(id: string): Promise<WorkspaceSheet | null> {
  const { data, error } = await supabase.from("workspace_sheets" as any).select("*").eq("id", id).maybeSingle();
  if (error) { console.error("[sheets] get", error); return null; }
  return data as any;
}
export async function createSheet(title = "Untitled sheet"): Promise<WorkspaceSheet | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("workspace_sheets" as any)
    .insert({ title, owner_id: u.user.id, workbook_json: EMPTY_WORKBOOK, content_text: "" })
    .select().single();
  if (error) { console.error("[sheets] create", error); return null; }
  return data as any;
}
export async function updateSheet(id: string, patch: Partial<WorkspaceSheet>): Promise<boolean> {
  const { error } = await supabase.from("workspace_sheets" as any).update(patch).eq("id", id);
  if (error) { console.error("[sheets] update", error); return false; }
  return true;
}
export async function deleteSheet(id: string): Promise<boolean> {
  const { error } = await supabase.from("workspace_sheets" as any).delete().eq("id", id);
  return !error;
}
export async function duplicateSheet(s: WorkspaceSheet): Promise<WorkspaceSheet | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("workspace_sheets" as any)
    .insert({ owner_id: u.user.id, title: `${s.title} (copy)`, workbook_json: s.workbook_json, content_text: s.content_text })
    .select().single();
  if (error) return null;
  return data as any;
}

export function flattenWorkbookText(wb: Workbook): string {
  return wb.sheets.map((s) => Object.values(s.cells).map((v) => (v == null ? "" : String(v))).join(" ")).join("\n");
}

export function colToLetter(col: number): string {
  let s = "", n = col;
  while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
  return s;
}
export function letterToCol(letter: string): number {
  let n = 0;
  for (let i = 0; i < letter.length; i++) n = n * 26 + (letter.charCodeAt(i) - 64);
  return n - 1;
}
export function cellId(row: number, col: number): string { return `${colToLetter(col)}${row + 1}`; }
export function parseCell(id: string): { row: number; col: number } | null {
  const m = id.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { col: letterToCol(m[1]), row: parseInt(m[2], 10) - 1 };
}

/* ---------- Structural ops that shift cells + formats ---------- */
type Remap = (row: number, col: number) => { row: number; col: number } | null;

function remapPage(page: SheetPage, remap: Remap): SheetPage {
  const cells: Record<string, CellValue> = {};
  const formats: Record<string, CellFormat> = {};
  for (const [k, v] of Object.entries(page.cells)) {
    const p = parseCell(k); if (!p) continue;
    const n = remap(p.row, p.col); if (!n) continue;
    cells[cellId(n.row, n.col)] = v;
  }
  for (const [k, v] of Object.entries(page.formats ?? {})) {
    const p = parseCell(k); if (!p) continue;
    const n = remap(p.row, p.col); if (!n) continue;
    formats[cellId(n.row, n.col)] = v;
  }
  return { ...page, cells, formats };
}

export function insertRow(page: SheetPage, at: number, count = 1): SheetPage {
  return remapPage(page, (r, c) => ({ row: r >= at ? r + count : r, col: c }));
}
export function deleteRow(page: SheetPage, at: number, count = 1): SheetPage {
  return remapPage(page, (r, c) => {
    if (r >= at && r < at + count) return null;
    return { row: r >= at + count ? r - count : r, col: c };
  });
}
export function insertCol(page: SheetPage, at: number, count = 1): SheetPage {
  return remapPage(page, (r, c) => ({ row: r, col: c >= at ? c + count : c }));
}
export function deleteCol(page: SheetPage, at: number, count = 1): SheetPage {
  return remapPage(page, (r, c) => {
    if (c >= at && c < at + count) return null;
    return { row: r, col: c >= at + count ? c - count : c };
  });
}

export function getSheetBounds(page: SheetPage): { rows: number; cols: number } {
  let rows = 0, cols = 0;
  for (const k of Object.keys(page.cells)) {
    const p = parseCell(k); if (!p) continue;
    if (p.row + 1 > rows) rows = p.row + 1;
    if (p.col + 1 > cols) cols = p.col + 1;
  }
  return { rows, cols };
}

export function formatCellValue(raw: CellValue, fmt?: CellFormat): string {
  if (raw == null || raw === "") return "";
  const s = String(raw);
  if (!fmt || !fmt.numberFormat || fmt.numberFormat === "general") return s;
  const n = Number(raw);
  if (!Number.isFinite(n)) return s;
  const d = fmt.decimals ?? 2;
  switch (fmt.numberFormat) {
    case "currency": return "$" + n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
    case "percent": return (n * 100).toFixed(d) + "%";
    case "number": return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
    case "scientific": return n.toExponential(d);
    case "date": { try { return new Date(n).toLocaleDateString(); } catch { return s; } }
    case "time": { try { return new Date(n).toLocaleTimeString(); } catch { return s; } }
    default: return s;
  }
}
