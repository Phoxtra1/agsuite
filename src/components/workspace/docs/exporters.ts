// Exporters for AG Docs — PDF, DOC-like, JSON, CSV.

export function exportJSON(filename: string, json: any) {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  download(blob, `${safeName(filename)}.json`);
}

export function exportDOC(filename: string, html: string, title: string) {
  const wrapped = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
    xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
    <body>${html}</body></html>`;
  const blob = new Blob([wrapped], { type: "application/msword" });
  download(blob, `${safeName(filename)}.doc`);
}

export async function exportPDF(filename: string, element: HTMLElement) {
  // @ts-ignore - no types
  const html2pdf = (await import("html2pdf.js")).default;
  html2pdf()
    .set({
      margin: 12,
      filename: `${safeName(filename)}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .save();
}

// Walk TipTap JSON, collect every `table` node, and emit CSV.
export function exportCSV(filename: string, json: any) {
  const tables = collectTables(json);
  if (!tables.length) {
    alert("No tables in this document to export as CSV.");
    return;
  }
  const csv = tables
    .map((t) => t.map((row) => row.map(csvCell).join(",")).join("\n"))
    .join("\n\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  download(blob, `${safeName(filename)}.csv`);
}

function collectTables(node: any, out: string[][][] = []): string[][][] {
  if (!node) return out;
  if (node.type === "table") {
    const rows: string[][] = [];
    for (const row of node.content || []) {
      if (row.type !== "tableRow") continue;
      const cells: string[] = [];
      for (const cell of row.content || []) {
        cells.push(extractText(cell).trim());
      }
      rows.push(cells);
    }
    if (rows.length) out.push(rows);
    return out;
  }
  for (const child of node.content || []) collectTables(child, out);
  return out;
}

function extractText(node: any): string {
  if (!node) return "";
  if (node.text) return node.text;
  return (node.content || []).map(extractText).join(" ");
}

function csvCell(value: string): string {
  const v = (value ?? "").replace(/\r?\n/g, " ");
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function safeName(s: string) {
  return (s || "document").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
