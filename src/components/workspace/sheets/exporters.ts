import * as XLSX from "xlsx";
import type { Workbook } from "@/lib/workspace/sheets/documents";
import { parseCell } from "@/lib/workspace/sheets/documents";

function toAoa(sheet: Workbook["sheets"][0]): any[][] {
  let maxRow = 0, maxCol = 0;
  for (const k of Object.keys(sheet.cells)) {
    const p = parseCell(k); if (!p) continue;
    if (p.row > maxRow) maxRow = p.row;
    if (p.col > maxCol) maxCol = p.col;
  }
  const rows: any[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const row: any[] = [];
    for (let c = 0; c <= maxCol; c++) row.push(null);
    rows.push(row);
  }
  for (const [k, v] of Object.entries(sheet.cells)) {
    const p = parseCell(k); if (!p) continue;
    rows[p.row][p.col] = v;
  }
  return rows;
}

export function exportXLSX(title: string, wb: Workbook) {
  const book = XLSX.utils.book_new();
  for (const s of wb.sheets) {
    const ws = XLSX.utils.aoa_to_sheet(toAoa(s));
    XLSX.utils.book_append_sheet(book, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(book, `${title || "sheet"}.xlsx`);
}

export function exportCSV(title: string, sheet: Workbook["sheets"][0]) {
  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(toAoa(sheet)));
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title || "sheet"}.csv`;
  a.click();
}

export function exportJSON(title: string, wb: Workbook) {
  const blob = new Blob([JSON.stringify(wb, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title || "sheet"}.json`;
  a.click();
}

export async function importXLSX(file: File): Promise<Workbook> {
  const buf = await file.arrayBuffer();
  const book = XLSX.read(buf, { type: "array" });
  const sheets = book.SheetNames.map((name) => {
    const aoa = XLSX.utils.sheet_to_json<any[]>(book.Sheets[name], { header: 1, defval: null });
    const cells: Record<string, any> = {};
    aoa.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v == null || v === "") return;
        const col = String.fromCharCode(65 + c); // rough (works for <26 cols)
        cells[`${col}${r + 1}`] = v;
      })
    );
    return { name, cells };
  });
  return { sheets };
}
