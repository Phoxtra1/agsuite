import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Type, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, ListTodo,
  Quote, Image as ImgIcon, Link as LinkIcon, Minus, Highlighter, Palette,
  Heading1, Heading2, Heading3, Scissors, Copy, Clipboard, Undo, Redo,
  Table as TableIcon, FileImage, Smile, Square, ZoomIn, ZoomOut, Maximize2,
  Eye, BookOpen, FileText, Hash, RotateCcw, Languages, MessageSquare,
  ListChecks, FilePlus2, FileDown, Search, Replace, Indent, Outdent,
  CheckCircle, ChevronUp,
} from "lucide-react";
import type { PageSettings } from "./PageCanvas";

type RibbonTab = "home" | "insert" | "layout" | "references" | "review" | "view";

export function Ribbon({
  editor,
  pageSettings,
  onPageSettings,
  onAction,
  wordsCount,
  charCount,
  onToggleLeftPanel,
  onToggleRightPanel,
  onZoom,
  zoom,
  showRuler,
  onToggleRuler,
}: {
  editor: Editor | null;
  pageSettings: PageSettings;
  onPageSettings: (p: Partial<PageSettings>) => void;
  onAction: (a: string, payload?: any) => void;
  wordsCount: number;
  charCount: number;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onZoom: (z: number | "fit-width" | "fit-page") => void;
  zoom: number;
  showRuler: boolean;
  onToggleRuler: () => void;
}) {
  const [tab, setTab] = useState<RibbonTab>("home");

  if (!editor) return null;

  const tabs: { id: RibbonTab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "insert", label: "Insert" },
    { id: "layout", label: "Page Layout" },
    { id: "references", label: "References" },
    { id: "review", label: "Review" },
    { id: "view", label: "View" },
  ];

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center gap-0 px-3 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-semibold transition border-b-2 -mb-px ${
              tab === t.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-stretch gap-3 overflow-x-auto px-3 py-2 min-h-[68px]">
        {tab === "home" && <HomeTab editor={editor} />}
        {tab === "insert" && <InsertTab editor={editor} onAction={onAction} />}
        {tab === "layout" && <LayoutTab pageSettings={pageSettings} onPageSettings={onPageSettings} />}
        {tab === "references" && <ReferencesTab editor={editor} onAction={onAction} />}
        {tab === "review" && (
          <ReviewTab editor={editor} wordsCount={wordsCount} charCount={charCount} onAction={onAction} />
        )}
        {tab === "view" && (
          <ViewTab
            onToggleLeftPanel={onToggleLeftPanel}
            onToggleRightPanel={onToggleRightPanel}
            onZoom={onZoom}
            zoom={zoom}
            showRuler={showRuler}
            onToggleRuler={onToggleRuler}
            onPageSettings={onPageSettings}
            pageSettings={pageSettings}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Reusable bits ---------- */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch px-2 border-r border-border last:border-r-0">
      <div className="flex items-center gap-0.5 flex-1">{children}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider text-center mt-1">{label}</div>
    </div>
  );
}
function Btn({
  icon: Icon, title, onClick, active, disabled,
}: { icon: any; title: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-md transition disabled:opacity-40 ${
        active ? "bg-accent/20 text-accent" : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
function DropBtn({
  label, children, icon: Icon, width = "w-44",
}: { label: string; children: (close: () => void) => React.ReactNode; icon?: any; width?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 inline-flex items-center gap-1 px-2 rounded-md hover:bg-muted text-foreground text-xs"
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute top-full left-0 mt-1 z-50 ${width} rounded-lg border border-border bg-popover shadow-xl py-1`}>
            {children(() => setOpen(false))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- HOME ---------- */
function HomeTab({ editor }: { editor: Editor }) {
  const isHeading = (lvl: number) => editor.isActive("heading", { level: lvl });

  const applyStyle = (style: string) => {
    const chain = editor.chain().focus();
    switch (style) {
      case "normal": chain.setParagraph().run(); break;
      case "h1": chain.toggleHeading({ level: 1 }).run(); break;
      case "h2": chain.toggleHeading({ level: 2 }).run(); break;
      case "h3": chain.toggleHeading({ level: 3 }).run(); break;
      case "title": chain.toggleHeading({ level: 1 }).run(); break;
      case "subtitle": chain.toggleHeading({ level: 2 }).run(); break;
    }
  };

  const changeCase = (mode: "sentence" | "lower" | "upper" | "title" | "toggle") => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, " ");
    let out = text;
    switch (mode) {
      case "lower": out = text.toLowerCase(); break;
      case "upper": out = text.toUpperCase(); break;
      case "title": out = text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()); break;
      case "sentence": out = text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()); break;
      case "toggle":
        out = text.split("").map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join("");
        break;
    }
    editor.chain().focus().deleteSelection().insertContent(out).run();
  };

  const setFontSize = (size: string) => editor.chain().focus().setMark("textStyle", { fontSize: size } as any).run();
  const setFontFamily = (f: string) => editor.chain().focus().setFontFamily(f).run();

  return (
    <>
      <Group label="Clipboard">
        <Btn icon={Clipboard} title="Paste" onClick={async () => {
          try { const t = await navigator.clipboard.readText(); editor.chain().focus().insertContent(t).run(); } catch {}
        }} />
        <Btn icon={Scissors} title="Cut" onClick={async () => {
          const { from, to } = editor.state.selection;
          const text = editor.state.doc.textBetween(from, to, " ");
          try { await navigator.clipboard.writeText(text); } catch {}
          editor.chain().focus().deleteSelection().run();
        }} />
        <Btn icon={Copy} title="Copy" onClick={async () => {
          const { from, to } = editor.state.selection;
          const text = editor.state.doc.textBetween(from, to, " ");
          try { await navigator.clipboard.writeText(text); } catch {}
        }} />
      </Group>

      <Group label="Font">
        <DropBtn label="Font" icon={Type} width="w-44">
          {(close) => (
            <>
              {["Inter", "Arial", "Roboto", "Times New Roman", "Georgia", "Verdana", "Courier New"].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFontFamily(f); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground"
                  style={{ fontFamily: f }}
                >{f}</button>
              ))}
            </>
          )}
        </DropBtn>
        <DropBtn label="Size" width="w-24">
          {(close) => (
            <>
              {["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"].map((s) => (
                <button key={s} onClick={() => { setFontSize(s); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground">{s}</button>
              ))}
            </>
          )}
        </DropBtn>
        <Btn icon={Bold} title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <Btn icon={Italic} title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <Btn icon={UnderlineIcon} title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <Btn icon={Strikethrough} title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <ColorPicker editor={editor} />
        <Btn icon={Highlighter} title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} />
      </Group>

      <Group label="Case">
        <DropBtn label="Aa" width="w-44">
          {(close) => (
            <>
              {[
                ["sentence", "Sentence case"],
                ["lower", "lowercase"],
                ["upper", "UPPERCASE"],
                ["title", "Capitalize Each Word"],
                ["toggle", "tOGGLE cASE"],
              ].map(([m, l]) => (
                <button key={m} onClick={() => { changeCase(m as any); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground">{l}</button>
              ))}
            </>
          )}
        </DropBtn>
      </Group>

      <Group label="Paragraph">
        <Btn icon={List} title="Bullets" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <Btn icon={ListOrdered} title="Numbering" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <Btn icon={ListTodo} title="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} />
        <Btn icon={Outdent} title="Decrease indent" onClick={() => editor.chain().focus().liftListItem("listItem").run()} />
        <Btn icon={Indent} title="Increase indent" onClick={() => editor.chain().focus().sinkListItem("listItem").run()} />
        <Btn icon={AlignLeft} title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <Btn icon={AlignCenter} title="Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <Btn icon={AlignRight} title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        <Btn icon={AlignJustify} title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
        <DropBtn label="Spacing" width="w-32">
          {(close) => (
            <>
              {["1.0", "1.15", "1.5", "2.0"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    document.querySelectorAll<HTMLElement>(".doc-canvas .ProseMirror").forEach((el) => { el.style.lineHeight = s; });
                    close();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted"
                >{s}</button>
              ))}
            </>
          )}
        </DropBtn>
        <Btn icon={Quote} title="Block quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      </Group>

      <Group label="Styles">
        <DropBtn label="Style" width="w-40">
          {(close) => (
            <>
              {[
                ["normal", "Normal"],
                ["title", "Title"],
                ["subtitle", "Subtitle"],
                ["h1", "Heading 1"],
                ["h2", "Heading 2"],
                ["h3", "Heading 3"],
              ].map(([id, l]) => (
                <button
                  key={id}
                  onClick={() => { applyStyle(id as any); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground"
                >{l}</button>
              ))}
            </>
          )}
        </DropBtn>
        <Btn icon={Heading1} title="Heading 1" active={isHeading(1)} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <Btn icon={Heading2} title="Heading 2" active={isHeading(2)} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <Btn icon={Heading3} title="Heading 3" active={isHeading(3)} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      </Group>

      <Group label="Edit">
        <Btn icon={Undo} title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
        <Btn icon={Redo} title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
      </Group>
    </>
  );
}

function ColorPicker({ editor }: { editor: Editor }) {
  const colors = ["#0f172a", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777", "#525252"];
  return (
    <DropBtn label="" icon={Palette} width="w-44">
      {(close) => (
        <div className="grid grid-cols-5 gap-1.5 p-2">
          {colors.map((c) => (
            <button key={c} onClick={() => { editor.chain().focus().setColor(c).run(); close(); }}
              className="h-6 w-6 rounded-md border border-border" style={{ background: c }} />
          ))}
          <button onClick={() => { editor.chain().focus().unsetColor().run(); close(); }} className="col-span-5 text-[11px] text-muted-foreground hover:text-foreground mt-1">Reset</button>
        </div>
      )}
    </DropBtn>
  );
}

/* ---------- INSERT ---------- */
function InsertTab({ editor, onAction }: { editor: Editor; onAction: (a: string, p?: any) => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <Group label="Pages">
        <Btn icon={FilePlus2} title="Blank page" onClick={() => editor.chain().focus().insertContent("<p></p>").setHardBreak().run()} />
        <Btn icon={Minus} title="Page break" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
      </Group>

      <Group label="Tables">
        <TablePicker editor={editor} />
        <Btn icon={TableIcon} title="Toggle header row" onClick={() => editor.chain().focus().toggleHeaderRow().run()} />
        <DropBtn label="Cells" width="w-36">
          {(close) => (
            <>
              <button onClick={() => { editor.chain().focus().mergeCells().run(); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Merge cells</button>
              <button onClick={() => { editor.chain().focus().splitCell().run(); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Split cell</button>
              <button onClick={() => { editor.chain().focus().addRowAfter().run(); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Add row</button>
              <button onClick={() => { editor.chain().focus().addColumnAfter().run(); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Add column</button>
              <button onClick={() => { editor.chain().focus().deleteTable().run(); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-destructive">Delete table</button>
            </>
          )}
        </DropBtn>
      </Group>

      <Group label="Media">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const reader = new FileReader();
          reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run();
          reader.readAsDataURL(f);
          e.target.value = "";
        }} />
        <Btn icon={ImgIcon} title="Upload image" onClick={() => fileRef.current?.click()} />
        <Btn icon={FileImage} title="Image from URL" onClick={() => {
          const url = window.prompt("Image URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }} />
      </Group>

      <Group label="Insert">
        <Btn icon={LinkIcon} title="Insert link" onClick={() => {
          const url = window.prompt("Link URL", "https://");
          if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }} />
        <DropBtn label="Symbol" icon={Smile} width="w-56">
          {(close) => (
            <div className="grid grid-cols-8 gap-1 p-2">
              {["©","®","™","°","±","×","÷","≈","≠","≤","≥","→","←","↑","↓","•","§","¶","€","£","¥","$","✓","★"].map((s) => (
                <button key={s} onClick={() => { editor.chain().focus().insertContent(s).run(); close(); }} className="h-7 w-7 hover:bg-muted rounded text-sm">{s}</button>
              ))}
            </div>
          )}
        </DropBtn>
        <Btn icon={Square} title="Text box" onClick={() => editor.chain().focus().insertContent('<blockquote><p>Text box</p></blockquote>').run()} />
        <Btn icon={Minus} title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
      </Group>
    </>
  );
}

function TablePicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ r: 0, c: 0 });
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="h-8 inline-flex items-center gap-1 px-2 rounded-md hover:bg-muted text-foreground text-xs">
        <TableIcon className="h-3.5 w-3.5" /> Table <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 p-2 rounded-lg border border-border bg-popover shadow-xl">
            <div className="text-[11px] text-muted-foreground mb-2">{hover.r || 0} × {hover.c || 0}</div>
            <div className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: 80 }).map((_, i) => {
                const r = Math.floor(i / 10) + 1; const c = (i % 10) + 1;
                const on = r <= hover.r && c <= hover.c;
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setHover({ r, c })}
                    onClick={() => {
                      editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                      setOpen(false);
                    }}
                    className={`h-4 w-4 border ${on ? "bg-accent border-accent" : "bg-background border-border"}`}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- LAYOUT ---------- */
function LayoutTab({ pageSettings, onPageSettings }: { pageSettings: PageSettings; onPageSettings: (p: Partial<PageSettings>) => void }) {
  return (
    <>
      <Group label="Margins">
        <DropBtn label={`Margins (${pageSettings.margin})`} width="w-40">
          {(close) => (
            <>
              {(["narrow", "normal", "wide"] as const).map((m) => (
                <button key={m} onClick={() => { onPageSettings({ margin: m }); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted capitalize">{m}</button>
              ))}
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Orientation">
        <DropBtn label={pageSettings.orientation === "portrait" ? "Portrait" : "Landscape"} width="w-36">
          {(close) => (
            <>
              <button onClick={() => { onPageSettings({ orientation: "portrait" }); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Portrait</button>
              <button onClick={() => { onPageSettings({ orientation: "landscape" }); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Landscape</button>
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Page Size">
        <DropBtn label={pageSettings.size} width="w-32">
          {(close) => (
            <>
              {(["A3", "A4", "A5", "A6", "Letter", "Legal", "Tabloid", "Statement"] as const).map((s) => (
                <button key={s} onClick={() => { onPageSettings({ size: s }); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{s}</button>
              ))}
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Columns">
        <DropBtn label={`${pageSettings.columns} col`} width="w-28">
          {(close) => (
            <>
              {[1, 2, 3].map((n) => (
                <button key={n} onClick={() => { onPageSettings({ columns: n }); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{n} column{n>1?"s":""}</button>
              ))}
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Watermark">
        <button
          onClick={() => {
            const t = window.prompt("Watermark text (blank to remove)", pageSettings.watermark || "");
            onPageSettings({ watermark: t || "" });
          }}
          className="h-8 px-2 rounded-md hover:bg-muted text-xs text-foreground inline-flex items-center gap-1"
        >Set</button>
      </Group>
      <Group label="Borders">
        <button
          onClick={() => onPageSettings({ pageBorder: !pageSettings.pageBorder })}
          className={`h-8 px-2 rounded-md text-xs inline-flex items-center gap-1 ${pageSettings.pageBorder ? "bg-accent/20 text-accent" : "text-foreground hover:bg-muted"}`}
        >{pageSettings.pageBorder ? "On" : "Off"}</button>
      </Group>
    </>
  );
}

/* ---------- REFERENCES ---------- */
function ReferencesTab({ editor, onAction }: { editor: Editor; onAction: (a: string, p?: any) => void }) {
  const insertTOC = () => {
    const json = editor.getJSON();
    const headings: { level: number; text: string }[] = [];
    const walk = (n: any) => {
      if (!n) return;
      if (n.type === "heading") headings.push({ level: n.attrs?.level || 1, text: (n.content || []).map((c: any) => c.text || "").join("") });
      (n.content || []).forEach(walk);
    };
    walk(json);
    if (!headings.length) { onAction("toast", { title: "No headings found — add headings first." }); return; }
    let html = '<h2>Table of Contents</h2><ul>';
    headings.forEach((h) => { html += `<li style="margin-left:${(h.level-1)*16}px">${h.text || "(untitled)"}</li>`; });
    html += "</ul>";
    editor.chain().focus().insertContent(html).run();
  };
  return (
    <>
      <Group label="TOC">
        <button onClick={insertTOC} className="h-8 px-3 rounded-md bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 inline-flex items-center gap-1">
          <ListChecks className="h-3.5 w-3.5" /> Insert TOC
        </button>
      </Group>
      <Group label="Footnotes">
        <Btn icon={Hash} title="Insert footnote marker" onClick={() => editor.chain().focus().insertContent("<sup>[1]</sup>").run()} />
      </Group>
      <Group label="Captions">
        <button onClick={() => {
          const c = window.prompt("Caption text"); if (c) editor.chain().focus().insertContent(`<p><em>Figure: ${c}</em></p>`).run();
        }} className="h-8 px-2 rounded-md hover:bg-muted text-xs text-foreground">Add caption</button>
      </Group>
      <Group label="Citation">
        <button onClick={() => {
          const c = window.prompt("Citation (e.g. Smith, 2024)"); if (c) editor.chain().focus().insertContent(`(${c})`).run();
        }} className="h-8 px-2 rounded-md hover:bg-muted text-xs text-foreground">Insert citation</button>
      </Group>
    </>
  );
}

/* ---------- REVIEW ---------- */
function ReviewTab({ editor, wordsCount, charCount, onAction }: { editor: Editor; wordsCount: number; charCount: number; onAction: (a: string, p?: any) => void }) {
  return (
    <>
      <Group label="Proofing">
        <div className="text-xs text-foreground px-2 py-1 leading-tight">
          <div className="font-semibold">{wordsCount} words</div>
          <div className="text-[10px] text-muted-foreground">{charCount} chars</div>
        </div>
        <Btn icon={CheckCircle} title="AI Spelling & Grammar" onClick={() => onAction("ai", { action: "grammar", label: "Grammar" })} />
        <Btn icon={Languages} title="Translate" onClick={() => onAction("ai", { action: "translate", label: "Translate" })} />
      </Group>
      <Group label="Comments">
        <Btn icon={MessageSquare} title="Add comment" onClick={() => onAction("comment:add")} />
      </Group>
      <Group label="Track Changes">
        <Btn icon={RotateCcw} title="Toggle track changes" onClick={() => onAction("track:toggle")} />
      </Group>
    </>
  );
}

/* ---------- VIEW ---------- */
function ViewTab({
  onToggleLeftPanel, onToggleRightPanel, onZoom, zoom, showRuler, onToggleRuler, onPageSettings, pageSettings,
}: any) {
  return (
    <>
      <Group label="Modes">
        <DropBtn label={pageSettings.mode === "reading" ? "Reading" : pageSettings.mode === "web" ? "Web" : "Print"} width="w-36">
          {(close) => (
            <>
              <button onClick={() => { onPageSettings({ mode: "print" }); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Print Layout</button>
              <button onClick={() => { onPageSettings({ mode: "web" }); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Web Layout</button>
              <button onClick={() => { onPageSettings({ mode: "reading" }); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Reading Mode</button>
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Panels">
        <Btn icon={BookOpen} title="Toggle navigation panel" onClick={onToggleLeftPanel} />
        <Btn icon={FileText} title="Toggle intelligence panel" onClick={onToggleRightPanel} />
      </Group>
      <Group label="Display">
        <Btn icon={Eye} title="Toggle ruler" active={showRuler} onClick={onToggleRuler} />
      </Group>
      <Group label="Zoom">
        <Btn icon={ZoomOut} title="Zoom out" onClick={() => onZoom(Math.max(0.5, zoom - 0.1))} />
        <span className="text-xs text-foreground px-1 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <Btn icon={ZoomIn} title="Zoom in" onClick={() => onZoom(Math.min(2, zoom + 0.1))} />
        <DropBtn label="Fit" width="w-32">
          {(close) => (
            <>
              <button onClick={() => { onZoom("fit-width"); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Page width</button>
              <button onClick={() => { onZoom("fit-page"); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Full page</button>
              <button onClick={() => { onZoom(1); close(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">100%</button>
            </>
          )}
        </DropBtn>
      </Group>
    </>
  );
}
