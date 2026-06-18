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

export function exportHTML(filename: string, html: string, title: string) {
  const wrapped = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;color:#0f172a}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:6px}
    img{max-width:100%}</style></head><body>${html}</body></html>`;
  const blob = new Blob([wrapped], { type: "text/html;charset=utf-8" });
  download(blob, `${safeName(filename)}.html`);
}

export function exportTXT(filename: string, json: any) {
  const txt = extractText(json).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  download(blob, `${safeName(filename)}.txt`);
}

export interface PdfPageOptions {
  format?: "a3" | "a4" | "a5" | "letter" | "legal" | "tabloid";
  orientation?: "portrait" | "landscape";
  marginMm?: number;
}

export async function exportPDF(
  filename: string,
  element: HTMLElement,
  opts: PdfPageOptions = {}
) {
  // @ts-ignore - no types
  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({
      margin: opts.marginMm ?? 12,
      filename: `${safeName(filename)}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: {
        unit: "mm",
        format: opts.format ?? "a4",
        orientation: opts.orientation ?? "portrait",
      },
      pagebreak: { mode: ["css", "legacy"], before: "[data-page-break='true'], .page-break" },
    })
    .from(element)
    .save();
}

/* ============================================================
 * DOCX export — real .docx using the `docx` library.
 * Run: bun add docx
 * ========================================================== */
export async function exportDOCX(filename: string, json: any, title: string) {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = docx;

  const children: any[] = [];

  const walk = (node: any) => {
    if (!node) return;
    const type = node.type;

    if (type === "heading") {
      const lvl = Math.min(6, Math.max(1, node.attrs?.level ?? 1));
      const map: any = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4, 5: HeadingLevel.HEADING_5, 6: HeadingLevel.HEADING_6 };
      children.push(new Paragraph({ heading: map[lvl], children: nodeRuns(node, TextRun) }));
      return;
    }
    if (type === "paragraph") {
      children.push(new Paragraph({ children: nodeRuns(node, TextRun), alignment: alignMap(node.attrs?.textAlign, AlignmentType) }));
      return;
    }
    if (type === "bulletList" || type === "orderedList") {
      const numbered = type === "orderedList";
      (node.content || []).forEach((li: any) => {
        const runs = nodeRuns(li, TextRun);
        children.push(new Paragraph({
          children: runs,
          bullet: numbered ? undefined : { level: 0 },
          numbering: numbered ? { reference: "default-numbering", level: 0 } : undefined,
        }));
      });
      return;
    }
    if (type === "pageBreak" || node.attrs?.pageBreak) {
      children.push(new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }));
      return;
    }
    if (type === "table") {
      const rows = (node.content || []).map((row: any) => new TableRow({
        children: (row.content || []).map((cell: any) => new TableCell({
          children: [new Paragraph({ children: [new TextRun(extractText(cell).trim())] })],
        })),
      }));
      children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      return;
    }
    (node.content || []).forEach(walk);
  };

  walk(json);

  const doc = new Document({
    sections: [{ properties: {}, children: children.length ? children : [new Paragraph(title)] }],
  });
  const blob = await Packer.toBlob(doc);
  download(blob, `${safeName(filename)}.docx`);
}

function nodeRuns(node: any, TextRun: any): any[] {
  const runs: any[] = [];
  const collect = (n: any) => {
    if (!n) return;
    if (n.text) {
      const marks = n.marks || [];
      runs.push(new TextRun({
        text: n.text,
        bold: marks.some((m: any) => m.type === "bold"),
        italics: marks.some((m: any) => m.type === "italic"),
        underline: marks.some((m: any) => m.type === "underline") ? {} : undefined,
        strike: marks.some((m: any) => m.type === "strike"),
      }));
      return;
    }
    (n.content || []).forEach(collect);
  };
  (node.content || []).forEach(collect);
  return runs;
}

function alignMap(a: string | undefined, Align: any) {
  switch (a) {
    case "center": return Align.CENTER;
    case "right": return Align.RIGHT;
    case "justify": return Align.JUSTIFIED;
    default: return Align.LEFT;
  }
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
  if (node.type === "paragraph" || node.type === "heading") {
    return (node.content || []).map(extractText).join("") + "\n";
  }
  if (node.type === "hardBreak") return "\n";
  return (node.content || []).map(extractText).join(node.type === "tableRow" ? "\t" : " ");
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

/* ============================================================
 * AI: action "translate" — wires the toolbar `ai` action.
 * Calls a Supabase Edge Function `ai-translate` (Lovable AI Gateway).
 * Falls back to returning the input if the endpoint is not deployed.
 * ========================================================== */
export interface TranslateRequest {
  text: string;
  target: string;          // e.g. "fr", "es", "en", "Spanish"
  source?: string;
}

export async function runAITranslate(req: TranslateRequest): Promise<string> {
  try {
    const base = (import.meta as any).env?.VITE_SUPABASE_URL || "";
    const anon = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
    if (!base) return req.text;
    const res = await fetch(`${base}/functions/v1/ai-translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(anon ? { Authorization: `Bearer ${anon}`, apikey: anon } : {}) },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`translate failed: ${res.status}`);
    const data = await res.json();
    return data.translated ?? data.text ?? req.text;
  } catch (e) {
    console.warn("[runAITranslate] fallback (no edge function):", e);
    return req.text;
  }
}
