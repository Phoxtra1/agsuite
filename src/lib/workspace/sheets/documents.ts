import { supabase } from "@/integrations/supabase/client";
import { wsKey } from "@/lib/workspace/scope";

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
    type: "CRM" | "Inventory" | "HR" | "Registry" | "Project" | "Tasks" | "ProjectManagement" | "Custom";
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

const CACHE_BASE = "amineva_workspace_sheets";
const CACHE_KEY = () => wsKey(CACHE_BASE);

function getLocalSheets(): WorkspaceSheet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSheets(sheets: WorkspaceSheet[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY(), JSON.stringify(sheets));
  } catch (e) {
    console.error("[sheets] Failed to save local sheets", e);
  }
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function listSheets(): Promise<WorkspaceSheet[]> {
  const local = getLocalSheets();
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return local;
  }
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return [];
    const { data, error } = await supabase.from("workspace_sheets" as any).select("*").eq("owner_id", userId).order("updated_at", { ascending: false });
    if (!error && data && Array.isArray(data)) {
      const remote = data as any as WorkspaceSheet[];
      const merged = [...local];
      for (const sheet of remote) {
        const idx = merged.findIndex((item) => item.id === sheet.id);
        if (idx < 0) merged.push(sheet);
        else if (new Date(sheet.updated_at).getTime() > new Date(merged[idx].updated_at).getTime()) merged[idx] = sheet;
      }
      merged.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      saveLocalSheets(merged);
      return merged;
    }
  } catch (e) {
    console.warn("[sheets] Offline fetch fallback", e);
  }
  if (local.length > 0) return local;
  return [];
}

export async function getSheet(id: string): Promise<WorkspaceSheet | null> {
  const local = getLocalSheets();
  const cached = local.find((s) => s.id === id);
  if (cached || (typeof navigator !== "undefined" && !navigator.onLine)) return cached ?? null;
  try {
    const { data, error } = await supabase.from("workspace_sheets" as any).select("*").eq("id", id).maybeSingle();
    if (!error && data) {
      const idx = local.findIndex((s) => s.id === id);
      if (idx >= 0) {
        if (new Date((data as any).updated_at).getTime() > new Date(local[idx].updated_at).getTime()) local[idx] = data as any;
      } else local.unshift(data as any);
      saveLocalSheets(local);
      return idx >= 0 ? local[idx] : data as any;
    }
  } catch (e) {
    console.warn("[sheets] Offline get sheet", e);
  }
  const found = local.find((s) => s.id === id);
  if (found) return found;

  return null;
}

export async function createSheet(title = "Untitled sheet"): Promise<WorkspaceSheet | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const now = new Date().toISOString();
  const localId = `sheet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newSheet: WorkspaceSheet = {
    id: localId,
    owner_id: userId,
    title,
    workbook_json: EMPTY_WORKBOOK,
    content_text: "",
    created_at: now,
    updated_at: now,
  };

  const local = getLocalSheets();
  local.unshift(newSheet);
  saveLocalSheets(local);

  try {
    const { data, error } = await supabase.from("workspace_sheets" as any)
      .insert({ title, owner_id: userId, workbook_json: EMPTY_WORKBOOK, content_text: "" })
      .select().single();
    if (!error && data) {
      const updatedLocal = getLocalSheets();
      const idx = updatedLocal.findIndex((s) => s.id === localId);
      if (idx >= 0) {
        updatedLocal[idx] = data as any;
      } else {
        updatedLocal.unshift(data as any);
      }
      saveLocalSheets(updatedLocal);
      return data as any;
    }
  } catch (e) {
    console.warn("[sheets] Failed to create sheet in Supabase, using offline fallback", e);
  }

  return newSheet;
}

export async function updateSheet(id: string, patch: Partial<WorkspaceSheet>): Promise<boolean> {
  const now = new Date().toISOString();
  const local = getLocalSheets();
  const idx = local.findIndex((s) => s.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...patch, updated_at: now };
    saveLocalSheets(local);
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  try {
    const { error } = await supabase.from("workspace_sheets" as any).update(patch).eq("id", id);
    if (!error) return true;
  } catch (e) {
    console.warn("[sheets] Offline update queued locally", e);
  }
  return true;
}

export async function deleteSheet(id: string): Promise<boolean> {
  const local = getLocalSheets();
  const filtered = local.filter((s) => s.id !== id);
  saveLocalSheets(filtered);

  try {
    await supabase.from("workspace_sheets" as any).delete().eq("id", id);
  } catch {}
  return true;
}

export async function duplicateSheet(s: WorkspaceSheet): Promise<WorkspaceSheet | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const now = new Date().toISOString();
  const localId = `sheet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const duplicated: WorkspaceSheet = {
    id: localId,
    owner_id: userId,
    title: `${s.title} (copy)`,
    workbook_json: s.workbook_json,
    content_text: s.content_text,
    created_at: now,
    updated_at: now,
  };
  const local = getLocalSheets();
  local.unshift(duplicated);
  saveLocalSheets(local);
  return duplicated;
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

export interface MergeRange {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export function parseMergeRange(rangeStr: string): MergeRange | null {
  const parts = rangeStr.split(":");
  if (parts.length !== 2) return null;
  const p1 = parseCell(parts[0]);
  const p2 = parseCell(parts[1]);
  if (!p1 || !p2) return null;
  return {
    r1: Math.min(p1.row, p2.row),
    c1: Math.min(p1.col, p2.col),
    r2: Math.max(p1.row, p2.row),
    c2: Math.max(p1.col, p2.col),
  };
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
