import * as XLSX from "xlsx";
import { createDocument, updateDocument } from "@/lib/workspace/documents";
import { createSheet, updateSheet, cellId, type SheetPage } from "@/lib/workspace/sheets/documents";
import { createDeck, updateDeck, makeSlide, DEFAULT_THEME, type Slide } from "@/lib/workspace/slides/documents";
import { createForm, updateForm, type Question } from "@/lib/workspace/forms/documents";

export type ImportKind = "docs" | "sheets" | "slides" | "forms";

export const IMPORT_ACCEPT: Record<ImportKind, string> = {
  docs: ".txt,.md,.markdown,.html,.htm,.csv,.json",
  sheets: ".csv,.tsv,.txt,.xlsx,.xls,.ods,.json",
  slides: ".txt,.md,.markdown,.json",
  forms: ".csv,.txt,.json",
};

const baseName = (f: File) => f.name.replace(/\.[^.]+$/, "") || "Imported";
const ext = (f: File) => (f.name.split(".").pop() || "").toLowerCase();

function htmlToText(html: string): string {
  const d = new DOMParser().parseFromString(html, "text/html");
  d.querySelectorAll("p,div,br,h1,h2,h3,h4,h5,h6,li,tr").forEach((el) => el.append("\n"));
  return d.body.textContent || "";
}

/** Plain text → TipTap document (headings from markdown "#", bullets kept as text). */
export function textToDocJson(text: string) {
  const content = text.split(/\r?\n/).map((line) => {
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) return { type: "heading", attrs: { level: h[1].length }, content: h[2] ? [{ type: "text", text: h[2] }] : undefined };
    return line.trim() ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" };
  });
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/** Rows → sheet cells keyed "A1". */
export function rowsToSheetPage(name: string, rows: unknown[][]): SheetPage {
  const cells: SheetPage["cells"] = {};
  rows.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === null || v === undefined || v === "") return;
      cells[cellId(r, c)] = typeof v === "number" || typeof v === "boolean" ? v : String(v);
    }),
  );
  return { name, cells };
}

/** Text → slide texts. Split on markdown headings or "---" / blank-line blocks. */
export function textToSlideBlocks(text: string): { title: string; body: string }[] {
  const chunks = /^#{1,2}\s/m.test(text)
    ? text.split(/^(?=#{1,2}\s)/m)
    : text.split(/\n\s*(?:---+)?\s*\n/);
  return chunks
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [first, ...rest] = c.split(/\r?\n/);
      return { title: first.replace(/^#{1,2}\s*/, "").trim(), body: rest.join("\n").trim() };
    });
}

/** CSV/text lines → questions. "Question, opt1|opt2|opt3" makes multiple choice; a trailing "*" marks required. */
export function linesToQuestions(text: string): Question[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [rawTitle, rawOpts] = line.split(/,(.+)/).map((s) => s?.trim().replace(/^"|"$/g, ""));
      const required = rawTitle.endsWith("*");
      const title = rawTitle.replace(/\*$/, "").trim();
      const options = rawOpts ? rawOpts.split("|").map((o) => o.trim()).filter(Boolean) : [];
      return {
        id: `q${Date.now().toString(36)}${i}`,
        type: options.length ? "multiple_choice" : "short_answer",
        title,
        options: options.length ? options : undefined,
        required,
      } as Question;
    });
}

/** Imports a file into a brand-new item of the given tool. Returns the new item's id. */
export async function importFile(kind: ImportKind, file: File): Promise<string> {
  const title = baseName(file);
  const e = ext(file);

  if (kind === "sheets") {
    let pages: SheetPage[];
    if (e === "json") {
      const data = JSON.parse(await file.text());
      const arr: any[] = Array.isArray(data) ? data : [data];
      const headers = Array.from(new Set(arr.flatMap((o) => Object.keys(o ?? {}))));
      pages = [rowsToSheetPage("Sheet1", [headers, ...arr.map((o) => headers.map((h) => o?.[h]))])];
    } else {
      const wb = e === "csv" || e === "tsv" || e === "txt"
        ? XLSX.read(await file.text(), { type: "string", FS: e === "tsv" ? "\t" : undefined })
        : XLSX.read(await file.arrayBuffer(), { type: "array" });
      pages = wb.SheetNames.map((n) =>
        rowsToSheetPage(n, XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: true, defval: null })),
      );
    }
    if (!pages.length) throw new Error("No data found in file");
    const s = await createSheet(title);
    const text = pages.flatMap((p) => Object.values(p.cells)).join(" ").slice(0, 5000);
    await updateSheet(s.id, { workbook_json: { sheets: pages, activeSheet: 0 }, content_text: text });
    return s.id;
  }

  const raw = await file.text();

  if (kind === "docs") {
    let text = raw;
    if (e === "html" || e === "htm") text = htmlToText(raw);
    else if (e === "json") {
      const j = JSON.parse(raw);
      if (j?.type === "doc") {
        const d = await createDocument(title);
        await updateDocument(d.id, { content_json: j, content_text: "" });
        return d.id;
      }
      text = JSON.stringify(j, null, 2);
    }
    const d = await createDocument(title);
    await updateDocument(d.id, { content_json: textToDocJson(text), content_text: text });
    return d.id;
  }

  if (kind === "slides") {
    let blocks: { title: string; body: string }[];
    if (e === "json") {
      const j = JSON.parse(raw);
      if (Array.isArray(j?.slides) && j.slides[0]?.elements) {
        const d = await createDeck(title);
        await updateDeck(d.id, { deck_json: { theme: DEFAULT_THEME, ...j } });
        return d.id;
      }
      blocks = (Array.isArray(j) ? j : []).map((s: any) => ({ title: String(s.title ?? ""), body: String(s.body ?? s.content ?? "") }));
    } else blocks = textToSlideBlocks(raw);
    if (!blocks.length) throw new Error("No slide content found in file");
    const slides: Slide[] = blocks.map((b, i) => {
      const slide = makeSlide(i === 0 && !b.body ? "title" : "titleContent", DEFAULT_THEME);
      if (slide.elements[0]) slide.elements[0].text = b.title;
      if (slide.elements[1]) slide.elements[1].text = b.body;
      return slide;
    });
    const d = await createDeck(title);
    await updateDeck(d.id, {
      deck_json: { slides, theme: DEFAULT_THEME, activeSlide: 0 },
      content_text: blocks.map((b) => `${b.title}\n${b.body}`).join("\n").slice(0, 5000),
    });
    return d.id;
  }

  // forms
  let questions: Question[];
  if (e === "json") {
    const j = JSON.parse(raw);
    const arr: any[] = Array.isArray(j) ? j : j?.questions ?? [];
    questions = arr.map((q, i) => ({
      id: q.id ?? `q${Date.now().toString(36)}${i}`,
      type: q.type ?? (q.options?.length ? "multiple_choice" : "short_answer"),
      title: String(q.title ?? q.question ?? ""),
      options: q.options,
      required: !!q.required,
    })) as Question[];
  } else questions = linesToQuestions(raw);
  if (!questions.length) throw new Error("No questions found in file");
  const f = await createForm(title);
  await updateForm(f.id, { questions });
  return f.id;
}
