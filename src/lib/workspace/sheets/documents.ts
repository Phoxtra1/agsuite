import { supabase } from "@/integrations/appwrite/client";
import { getWorkspaceUser } from "@/lib/workspace/scope";
import { readWorkspaceCollection, writeWorkspaceCollection } from "@/lib/workspace/localStore";
import { reconcile, scheduleRemote, upsertRemote, deleteRemote, isRealUser, isRemoteId, suppressTombstonedRemoteRows } from "@/lib/workspace/remoteSync";
import { isWorkspaceOfflineMode } from "@/lib/workspace/localAccess";

const TBL = "workspace_sheets";
const toRow = (d: WorkspaceSheet, userId: string) => ({ ...d, owner_id: isRealUser(d.owner_id) ? d.owner_id : userId });
function pushSheet(d: WorkspaceSheet) {
  const owner = isRealUser(d.owner_id) ? d.owner_id : getWorkspaceUser();
  if (!isRealUser(owner) || !isRemoteId(d.id)) return;
  scheduleRemote(`${TBL}:${d.id}`, () => upsertRemote(TBL, d.id, toRow(d, owner)));
}

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

async function getLocalSheets(): Promise<WorkspaceSheet[]> {
  return readWorkspaceCollection("amineva_workspace_sheets");
}

async function saveLocalSheets(records: WorkspaceSheet[]): Promise<void> {
  await writeWorkspaceCollection("amineva_workspace_sheets", records);
}

async function getAuthenticatedUserId(): Promise<string> {
  if (isWorkspaceOfflineMode()) return getWorkspaceUser();
  try {
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null }; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null }, error: new Error("Timeout") }), 600)
    );
    const { data } = await Promise.race([getUserPromise, timeoutPromise]);
    if (data?.user?.id) return data.user.id;
  } catch {}
  const scopeUser = getWorkspaceUser();
  if (scopeUser && scopeUser !== "anon") return scopeUser;
  return "local-user";
}

export async function listSheets(): Promise<WorkspaceSheet[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const local = await getLocalSheets();
  if (isWorkspaceOfflineMode() || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return local;
  }
  try {
    const queryPromise = supabase.from("workspace_sheets" as any).select("*").eq("owner_id", userId).order("updated_at", { ascending: false });
    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Timeout") }), 2500)
    );
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (!error && data && Array.isArray(data)) {
      const remoteRows = await suppressTombstonedRemoteRows(TBL, data as any as WorkspaceSheet[]);
      const merged = reconcile({ table: TBL, local: await getLocalSheets(), remote: remoteRows, userId, updatedAt: (d) => d.updated_at, toRow });
      await saveLocalSheets(merged);
      return merged;
    }
  } catch (e) {
    console.warn("[sheets] Offline fetch fallback", e);
  }
  return local;
}

export async function getSheet(id: string): Promise<WorkspaceSheet | null> {
  const local = await getLocalSheets();
  const cached = local.find((s) => s.id === id);
  if (cached || isWorkspaceOfflineMode() || (typeof navigator !== "undefined" && !navigator.onLine)) return cached ?? null;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const { data, error } = await supabase.from("workspace_sheets" as any).select("*").eq("id", id).eq("owner_id", userId).maybeSingle();
    if (!error && data) {
      const idx = local.findIndex((s) => s.id === id);
      if (idx >= 0) {
        if (new Date((data as any).updated_at).getTime() > new Date(local[idx].updated_at).getTime()) local[idx] = data as any;
      } else local.unshift(data as any);
      await saveLocalSheets(local);
      return idx >= 0 ? local[idx] : data as any;
    }
  } catch (e) {
    console.warn("[sheets] Offline get sheet", e);
  }
  const found = local.find((s) => s.id === id);
  if (found) return found;

  return null;
}

export async function createSheet(title = "Untitled sheet"): Promise<WorkspaceSheet> {
  const userId = await getAuthenticatedUserId();

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

  const local = await getLocalSheets();
  local.unshift(newSheet);
  await saveLocalSheets(local);

  pushSheet(newSheet);
  return newSheet;
}

export async function updateSheet(id: string, patch: Partial<WorkspaceSheet>): Promise<boolean> {
  const now = new Date().toISOString();
  const local = await getLocalSheets();
  const idx = local.findIndex((s) => s.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...patch, updated_at: now };
    await saveLocalSheets(local);
    pushSheet(local[idx]);
  }
  return true;
}

export async function deleteSheet(id: string): Promise<boolean> {
  const local = await getLocalSheets();
  const filtered = local.filter((s) => s.id !== id);
  await saveLocalSheets(filtered);
  await deleteRemote(TBL, id);
  return true;
}

export async function duplicateSheet(s: WorkspaceSheet): Promise<WorkspaceSheet> {
  const userId = await getAuthenticatedUserId();

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
  const local = await getLocalSheets();
  local.unshift(duplicated);
  await saveLocalSheets(local);
  pushSheet(duplicated);
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
