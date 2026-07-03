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

export interface SheetPage {
  name: string;
  cells: Record<string, CellValue>; // key = "A1", "B12"
  colWidths?: Record<string, number>;
  rowHeights?: Record<string, number>;
  formats?: Record<string, CellFormat>;
  frozenRows?: number;
  frozenCols?: number;
}

export interface Workbook {
  sheets: SheetPage[];
  namedRanges?: Record<string, string>;
}

export type CellValue = string | number | boolean | null;

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  bg?: string;
  align?: "left" | "center" | "right";
  numberFormat?: "general" | "number" | "currency" | "percent" | "date" | "scientific";
  fontFamily?: string;
  fontSize?: number;
  wrap?: boolean;
  border?: boolean;
}

export interface SheetShare {
  id: string;
  sheet_id: string;
  token: string;
  mode: "view" | "edit";
  revoked: boolean;
  expires_at: string | null;
  created_at: string;
}

export const EMPTY_WORKBOOK: Workbook = {
  sheets: [{ name: "Sheet1", cells: {} }],
  namedRanges: {},
};

export async function listSheets(): Promise<WorkspaceSheet[]> {
  const { data, error } = await supabase
    .from("workspace_sheets" as any)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) { console.error("[sheets] list", error); return []; }
  return (data as any) || [];
}

export async function getSheet(id: string): Promise<WorkspaceSheet | null> {
  const { data, error } = await supabase
    .from("workspace_sheets" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("[sheets] get", error); return null; }
  return data as any;
}

export async function createSheet(title = "Untitled sheet"): Promise<WorkspaceSheet | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("workspace_sheets" as any)
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
  if (error) return false;
  return true;
}

export async function duplicateSheet(s: WorkspaceSheet): Promise<WorkspaceSheet | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("workspace_sheets" as any)
    .insert({
      owner_id: u.user.id,
      title: `${s.title} (copy)`,
      workbook_json: s.workbook_json,
      content_text: s.content_text,
    })
    .select().single();
  if (error) return null;
  return data as any;
}

// ---- Utility ----

export function flattenWorkbookText(wb: Workbook): string {
  return wb.sheets
    .map((s) => Object.values(s.cells).map((v) => (v == null ? "" : String(v))).join(" "))
    .join("\n");
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
export function cellId(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`;
}
export function parseCell(id: string): { row: number; col: number } | null {
  const m = id.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { col: letterToCol(m[1]), row: parseInt(m[2], 10) - 1 };
}
