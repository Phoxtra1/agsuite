import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Type, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, ListTodo,
  Quote, Image as ImgIcon, Link as LinkIcon, Minus, Highlighter, Palette,
  Heading1, Heading2, Heading3, Scissors, Copy, Clipboard, Undo, Redo,
  Table as TableIcon, FileImage, Smile, Square, ZoomIn, ZoomOut,
  Eye, BookOpen, FileText, Hash, RotateCcw, Languages, MessageSquare,
  ListChecks, FilePlus2, Indent, Outdent, CheckCircle, Paintbrush,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon, CaseSensitive,
  Search, FileSignature, Bookmark as BookmarkIcon,
  Sigma, Box, FileUp, Layers, Columns as ColumnsIcon,
  PaintBucket, Frame, Stamp, Hash as LineNumIcon, BookMarked, ListTree,
  Pilcrow, ArrowUpDown, ArrowLeftRight, AlignHorizontalDistributeCenter,
  Calculator, Pencil, Split, Merge, ShieldCheck, GitCompare, MessagesSquare,
  Check, X, ChevronLeft, ChevronRight, Lock, Unlock, Grid3x3, Ruler,
  PanelLeft, PanelRight, SplitSquareHorizontal, Maximize2, Plus,
  File as FileIcon, FolderOpen, Save, Mail, Printer, Download, Upload,
  KeyRound, Database, Puzzle, Code2, Settings2, Type as TypeIcon,
  Building2, Sparkles, Shapes as ShapesIcon, BringToFront, SendToBack,
  MoveUp, MoveDown,
} from "lucide-react";
import type { PageSettings } from "./PageCanvas";

type RibbonTab =
  | "file" | "home" | "insert" | "layout" | "references"
  | "review" | "view" | "tools";

export function Ribbon({
  editor, pageSettings, onPageSettings, onAction, wordsCount, charCount,
  onToggleLeftPanel, onToggleRightPanel, onZoom, zoom, showRuler, onToggleRuler,
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
  const [findOpen, setFindOpen] = useState(false);

  if (!editor) return null;

  const tabs: { id: RibbonTab; label: string }[] = [
    { id: "file", label: "File" },
    { id: "home", label: "Home" },
    { id: "insert", label: "Insert" },
    { id: "layout", label: "Page Layout" },
    { id: "references", label: "References" },
    { id: "review", label: "Review" },
    { id: "view", label: "View" },
    { id: "tools", label: "Tools" },
  ];

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="flex items-center gap-0 px-3 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-semibold transition border-b-2 -mb-px ${
              tab === t.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            } ${t.id === "file" ? "bg-accent/10 text-accent rounded-t" : ""}`}
          >
            {t.id === "file" ? (
              <span className="inline-flex items-center gap-1.5">
                <FileIcon className="h-3.5 w-3.5" /> {t.label}
              </span>
            ) : (
              t.label
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setFindOpen((v) => !v)}
            className="h-7 px-2 inline-flex items-center gap-1 rounded-md text-xs hover:bg-muted text-foreground"
            title="Find & Replace (Ctrl+F)"
          >
            <Search className="h-3.5 w-3.5" /> Find
          </button>
        </div>
      </div>

      {findOpen && <FindReplace editor={editor} onClose={() => setFindOpen(false)} />}

      <div className="flex items-stretch gap-3 overflow-x-auto px-3 py-2 min-h-[68px]">
        {tab === "file" && <FileTab onAction={onAction} />}
        {tab === "home" && <HomeTab editor={editor} onAction={onAction} />}
        {tab === "insert" && <InsertTab editor={editor} onAction={onAction} />}
        {tab === "layout" && (
          <LayoutTab pageSettings={pageSettings} onPageSettings={onPageSettings} onAction={onAction} />
        )}
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
            onAction={onAction}
          />
        )}
        {tab === "tools" && <ToolsTab onAction={onAction} />}
      </div>
    </div>
  );
}

/* ---------- Reusable bits ---------- */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch px-2 border-r border-border last:border-r-0">
      <div className="flex items-center gap-0.5 flex-1 flex-wrap">{children}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider text-center mt-1">
        {label}
      </div>
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

/* ------- Portal-based dropdown — always above the page canvas ------- */
function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function useAnchorRect(open: boolean) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => setRect(anchorRef.current!.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);
  return { anchorRef, rect };
}

function DropBtn({
  label, children, icon: Icon, width = "w-44",
}: { label: string; children: (close: () => void) => React.ReactNode; icon?: any; width?: string }) {
  const [open, setOpen] = useState(false);
  const { anchorRef, rect } = useAnchorRect(open);
  return (
    <>
      <button
        ref={anchorRef}
        onClick={() => setOpen((v) => !v)}
        className="h-8 inline-flex items-center gap-1 px-2 rounded-md hover:bg-muted text-foreground text-xs"
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <Portal>
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />
          <div
            className={`fixed ${width} rounded-lg border border-border bg-popover shadow-2xl py-1`}
            style={{
              zIndex: 9999,
              top: rect ? rect.bottom + 4 : 0,
              left: rect ? rect.left : 0,
            }}
          >
            {children(() => setOpen(false))}
          </div>
        </Portal>
      )}
    </>
  );
}

function MenuItem({
  icon: Icon, label, onClick, danger,
}: { icon?: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted inline-flex items-center gap-2 ${
        danger ? "text-destructive" : "text-foreground"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5 opacity-70" />} {label}
    </button>
  );
}

/* ---------- FIND & REPLACE ---------- */
function FindReplace({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [r, setR] = useState("");

  const findNext = () => {
    if (!q) return;
    const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, " ");
    const from = editor.state.selection.to;
    const idx = text.toLowerCase().indexOf(q.toLowerCase(), from);
    const target = idx === -1 ? text.toLowerCase().indexOf(q.toLowerCase()) : idx;
    if (target === -1) return;
    editor.chain().focus().setTextSelection({ from: target + 1, to: target + 1 + q.length }).run();
  };
  const replaceOne = () => {
    const { from, to } = editor.state.selection;
    if (from === to) { findNext(); return; }
    editor.chain().focus().insertContentAt({ from, to }, r).run();
    findNext();
  };
  const replaceAll = () => {
    if (!q) return;
    const html = editor.getHTML();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = html.replace(new RegExp(escaped, "gi"), r);
    editor.chain().focus().setContent(next).run();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        autoFocus value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Find"
        className="h-7 px-2 text-xs rounded-md border border-border bg-background w-40"
      />
      <input
        value={r} onChange={(e) => setR(e.target.value)}
        placeholder="Replace with"
        className="h-7 px-2 text-xs rounded-md border border-border bg-background w-40"
      />
      <button onClick={findNext} className="h-7 px-2 text-xs rounded-md hover:bg-muted">Find Next</button>
      <button onClick={replaceOne} className="h-7 px-2 text-xs rounded-md hover:bg-muted">Replace</button>
      <button onClick={replaceAll} className="h-7 px-2 text-xs rounded-md hover:bg-muted">Replace All</button>
      <button onClick={onClose} className="ml-auto h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ---------- FILE ---------- */
function FileTab({ onAction }: { onAction: (a: string, p?: any) => void }) {
  return (
    <>
      <Group label="Document">
        <Btn icon={FilePlus2} title="New" onClick={() => onAction("file:new")} />
        <Btn icon={FolderOpen} title="Open" onClick={() => onAction("file:open")} />
        <Btn icon={Save} title="Save" onClick={() => onAction("file:save")} />
        <Btn icon={Download} title="Save As" onClick={() => onAction("file:saveAs")} />
        <Btn icon={Pencil} title="Rename" onClick={() => onAction("file:rename")} />
      </Group>
      <Group label="Export">
        <Btn icon={FileText} title="Export PDF" onClick={() => onAction("file:exportPDF")} />
        <Btn icon={ImgIcon} title="Export Image" onClick={() => onAction("file:exportImage")} />
        <Btn icon={Layers} title="Export PPTX" onClick={() => onAction("file:exportPPTX")} />
      </Group>
      <Group label="Share">
        <Btn icon={Printer} title="Print" onClick={() => window.print()} />
        <Btn icon={Mail} title="Send Email" onClick={() => onAction("file:email")} />
      </Group>
      <Group label="Protect">
        <Btn icon={KeyRound} title="Encrypt Document" onClick={() => onAction("file:encrypt")} />
        <Btn icon={Database} title="Backup" onClick={() => onAction("file:backup")} />
        <Btn icon={Upload} title="Store" onClick={() => onAction("file:store")} />
      </Group>
    </>
  );
}

/* ---------- HOME ---------- */
function HomeTab({ editor, onAction }: { editor: Editor; onAction: (a: string, p?: any) => void }) {
  const isHeading = (lvl: number) => editor.isActive("heading", { level: lvl });

  const applyStyle = (style: string) => {
    const chain = editor.chain().focus();
    switch (style) {
      case "normal": chain.setParagraph().run(); break;
      case "h1": case "title": chain.toggleHeading({ level: 1 }).run(); break;
      case "h2": case "subtitle": chain.toggleHeading({ level: 2 }).run(); break;
      case "h3": chain.toggleHeading({ level: 3 }).run(); break;
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

  const setFontSize = (size: string) =>
    editor.chain().focus().setMark("textStyle", { fontSize: size } as any).run();
  const setFontFamily = (f: string) => editor.chain().focus().setFontFamily(f).run();

  const bumpFont = (delta: number) => {
    const cur = (editor.getAttributes("textStyle") as any).fontSize || "16px";
    const n = parseInt(cur, 10) || 16;
    setFontSize(`${Math.max(6, Math.min(120, n + delta))}px`);
  };

  const setLineSpacing = (s: string) => {
    document.querySelectorAll<HTMLElement>(".doc-canvas .ProseMirror").forEach((el) => {
      el.style.lineHeight = s;
    });
  };

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
        <Btn icon={Paintbrush} title="Format Painter" onClick={() => onAction("format:painter")} />
      </Group>

      <Group label="Font">
        <DropBtn label="Font" icon={Type} width="w-44">
          {(close) => (
            <>
              {["Inter", "Arial", "Roboto", "Times New Roman", "Georgia", "Verdana", "Courier New"].map((f) => (
                <button key={f} onClick={() => { setFontFamily(f); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground"
                  style={{ fontFamily: f }}>{f}</button>
              ))}
            </>
          )}
        </DropBtn>
        <DropBtn label="Size" width="w-24">
          {(close) => (
            <>
              {["10px","12px","14px","16px","18px","20px","24px","28px","32px","40px","48px"].map((s) => (
                <button key={s} onClick={() => { setFontSize(s); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground">{s}</button>
              ))}
            </>
          )}
        </DropBtn>
        <Btn icon={Plus} title="Increase font size" onClick={() => bumpFont(2)} />
        <Btn icon={Minus} title="Decrease font size" onClick={() => bumpFont(-2)} />
        <Btn icon={Bold} title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <Btn icon={Italic} title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <Btn icon={UnderlineIcon} title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <Btn icon={Strikethrough} title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <Btn icon={SuperscriptIcon} title="Superscript" active={editor.isActive("superscript")} onClick={() => (editor.chain().focus() as any).toggleSuperscript?.().run()} />
        <Btn icon={SubscriptIcon} title="Subscript" active={editor.isActive("subscript")} onClick={() => (editor.chain().focus() as any).toggleSubscript?.().run()} />
        <ColorPicker editor={editor} />
        <Btn icon={Highlighter} title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} />
        <Btn icon={Frame} title="Character border" onClick={() => onAction("char:border")} />
      </Group>

      <Group label="Case">
        <DropBtn label="Aa" icon={CaseSensitive} width="w-44">
          {(close) => (
            <>
              {[
                ["sentence", "Sentence case"],
                ["lower", "lowercase"],
                ["upper", "UPPERCASE"],
                ["title", "Capitalize Each Word"],
                ["toggle", "tOGGLE cASE"],
              ].map(([m, l]) => (
                <button key={m} onClick={() => { changeCase(m as any); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground">{l}</button>
              ))}
            </>
          )}
        </DropBtn>
      </Group>

      <Group label="Paragraph">
        <DropBtn label="" icon={List} width="w-44">
          {(close) => (
            <>
              {[["•","disc"],["◦","circle"],["▪","square"],["–","dash"],["→","arrow"],["★","star"],["✓","check"]].map(([sym]) => (
                <button key={sym}
                  onClick={() => {
                    editor.chain().focus().toggleBulletList().run();
                    document.querySelectorAll<HTMLElement>(".doc-canvas .ProseMirror ul").forEach((el) => {
                      el.style.listStyleType = "none";
                      el.setAttribute("data-bullet", sym as string);
                    });
                    close();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">
                  <span className="inline-block w-6">{sym}</span> Bullet
                </button>
              ))}
            </>
          )}
        </DropBtn>
        <DropBtn label="" icon={ListOrdered} width="w-44">
          {(close) => (
            <>
              {[["decimal","1. 2. 3."],["lower-alpha","a. b. c."],["upper-alpha","A. B. C."],["lower-roman","i. ii. iii."],["upper-roman","I. II. III."]].map(([t, l]) => (
                <button key={t}
                  onClick={() => {
                    editor.chain().focus().toggleOrderedList().run();
                    document.querySelectorAll<HTMLElement>(".doc-canvas .ProseMirror ol").forEach((el) => {
                      el.style.listStyleType = t as string;
                    });
                    close();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{l}</button>
              ))}
            </>
          )}
        </DropBtn>
        <Btn icon={ListTodo} title="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} />
        <Btn icon={Outdent} title="Decrease indent" onClick={() => editor.chain().focus().liftListItem("listItem").run()} />
        <Btn icon={Indent} title="Increase indent" onClick={() => editor.chain().focus().sinkListItem("listItem").run()} />
        <Btn icon={ArrowUpDown} title="Sort selection" onClick={() => onAction("paragraph:sort")} />
        <Btn icon={AlignLeft} title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <Btn icon={AlignCenter} title="Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <Btn icon={AlignRight} title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        <Btn icon={AlignJustify} title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
        <Btn icon={AlignHorizontalDistributeCenter} title="Distributed" onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
        <DropBtn label="Line" icon={Pilcrow} width="w-32">
          {(close) => (
            <>
              {["1.0","1.15","1.5","2.0","2.5","3.0"].map((s) => (
                <button key={s} onClick={() => { setLineSpacing(s); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{s}</button>
              ))}
            </>
          )}
        </DropBtn>
        <DropBtn label="¶" width="w-40">
          {(close) => (
            <>
              {[["0","None"],["8px","Compact"],["12px","Normal"],["20px","Relaxed"],["32px","Wide"]].map(([v, l]) => (
                <button key={v}
                  onClick={() => {
                    document.querySelectorAll<HTMLElement>(".doc-canvas .ProseMirror p").forEach((el) => {
                      el.style.marginBottom = v as string;
                    });
                    close();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{l}</button>
              ))}
            </>
          )}
        </DropBtn>
        <Btn icon={Quote} title="Block quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <Btn icon={Square} title="Borders" onClick={() => onAction("paragraph:borders")} />
        <Btn icon={PaintBucket} title="Shading" onClick={() => onAction("paragraph:shading")} />
      </Group>

      <Group label="Styles">
        <DropBtn label="Style" width="w-40">
          {(close) => (
            <>
              {[["normal","Normal"],["title","Title"],["subtitle","Subtitle"],["h1","Heading 1"],["h2","Heading 2"],["h3","Heading 3"]].map(([id, l]) => (
                <button key={id} onClick={() => { applyStyle(id as any); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground">{l}</button>
              ))}
              <div className="border-t border-border my-1" />
              <button onClick={() => { onAction("style:custom"); close(); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-accent">+ Custom style…</button>
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
          <button onClick={() => { editor.chain().focus().unsetColor().run(); close(); }}
            className="col-span-5 text-[11px] text-muted-foreground hover:text-foreground mt-1">Reset</button>
        </div>
      )}
    </DropBtn>
  );
}

/* ---------- INSERT ---------- */
function InsertTab({ editor, onAction }: { editor: Editor; onAction: (a: string, p?: any) => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const textFileRef = useRef<HTMLInputElement | null>(null);
  const sigRef = useRef<HTMLInputElement | null>(null);
  const stampRef = useRef<HTMLInputElement | null>(null);
  const objRef = useRef<HTMLInputElement | null>(null);

  const readImageAsDataUrl = (file: File) => new Promise<string>((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file);
  });

  return (
    <>
      <Group label="Pages">
        <Btn icon={FileSignature} title="Cover Page" onClick={() => onAction("insert:cover")} />
        <Btn icon={FilePlus2} title="Blank page" onClick={() => onAction("insert:blankPage")} />
        <Btn icon={Minus} title="Page break" onClick={() => onAction("insert:pageBreak")} />
      </Group>

      <Group label="Breaks">
        <DropBtn label="Break" icon={Split} width="w-52">
          {(close) => (
            <>
              <MenuItem label="Page break" onClick={() => { onAction("insert:break", "page"); close(); }} />
              <MenuItem label="Column break" onClick={() => { onAction("insert:break", "column"); close(); }} />
              <div className="border-t border-border my-1" />
              <MenuItem label="Next page section" onClick={() => { onAction("insert:break", "section-next"); close(); }} />
              <MenuItem label="Continuous section" onClick={() => { onAction("insert:break", "section-continuous"); close(); }} />
              <MenuItem label="Even page section" onClick={() => { onAction("insert:break", "section-even"); close(); }} />
              <MenuItem label="Odd page section" onClick={() => { onAction("insert:break", "section-odd"); close(); }} />
            </>
          )}
        </DropBtn>
      </Group>

      <Group label="Tables">
        <TablePicker editor={editor} onAction={onAction} />
        <Btn icon={Pencil} title="Draw table" onClick={() => onAction("table:draw")} />
        <Btn icon={TableIcon} title="Toggle header row" onClick={() => editor.chain().focus().toggleHeaderRow().run()} />
        <DropBtn label="Cells" width="w-44">
          {(close) => (
            <>
              <MenuItem icon={Merge} label="Merge cells" onClick={() => { editor.chain().focus().mergeCells().run(); close(); }} />
              <MenuItem icon={Split} label="Split cell" onClick={() => { editor.chain().focus().splitCell().run(); close(); }} />
              <MenuItem label="Select row" onClick={() => { onAction("table:selectRow"); close(); }} />
              <MenuItem label="Select column" onClick={() => { onAction("table:selectColumn"); close(); }} />
              <MenuItem label="Add row" onClick={() => { editor.chain().focus().addRowAfter().run(); close(); }} />
              <MenuItem label="Add column" onClick={() => { editor.chain().focus().addColumnAfter().run(); close(); }} />
              <div className="border-t border-border my-1" />
              <MenuItem label="Column width…" onClick={() => {
                const w = window.prompt("Column width (e.g. 120px or 20%)", "120px");
                if (w) onAction("table:columnWidth", w); close();
              }} />
              <MenuItem label="Border style…" onClick={() => { onAction("table:borders"); close(); }} />
              <MenuItem label="Format / shading…" onClick={() => { onAction("table:format"); close(); }} />
              <MenuItem danger label="Delete table" onClick={() => { editor.chain().focus().deleteTable().run(); close(); }} />
            </>
          )}
        </DropBtn>
      </Group>

      <Group label="Media">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const url = await readImageAsDataUrl(f);
          editor.chain().focus().setImage({ src: url }).run();
          e.target.value = "";
        }} />
        <Btn icon={Upload} title="Upload image from device" onClick={() => fileRef.current?.click()} />
        <Btn icon={ImgIcon} title="Image positioning / wrapping" onClick={() => onAction("image:position")} />
        <Btn icon={FileImage} title="Image from URL" onClick={() => {
          const url = window.prompt("Image URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }} />
      </Group>

      <Group label="Illustrations">
        <ShapesMenu onAction={onAction} />
      </Group>

      <Group label="Header & Footer">
        <Btn icon={PanelLeft} title="Header" onClick={() => onAction("insert:header")} />
        <Btn icon={PanelRight} title="Footer" onClick={() => onAction("insert:footer")} />
        <DropBtn label="#" icon={Hash} width="w-44">
          {(close) => (
            <>
              <MenuItem label="Top of page" onClick={() => { onAction("insert:pageNumber", "top"); close(); }} />
              <MenuItem label="Bottom of page" onClick={() => { onAction("insert:pageNumber", "bottom"); close(); }} />
              <MenuItem label="Current position" onClick={() => { onAction("insert:pageNumber", "inline"); close(); }} />
              <div className="border-t border-border my-1" />
              <MenuItem danger label="Remove page numbers" onClick={() => { onAction("insert:pageNumber", "remove"); close(); }} />
            </>
          )}
        </DropBtn>
      </Group>

      <Group label="Insert">
        <Btn icon={LinkIcon} title="Insert link" onClick={() => {
          const url = window.prompt("Link URL", "https://");
          if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }} />
        <Btn icon={BookmarkIcon} title="Bookmark" onClick={() => {
          const name = window.prompt("Bookmark name");
          if (name) editor.chain().focus().insertContent(`<a id="${name}"></a>`).run();
        }} />
        <SymbolsMenu editor={editor} />
        <EquationMenu editor={editor} />
        <TextBoxMenu editor={editor} onAction={onAction} />
        <Btn icon={TypeIcon} title="WordArt" onClick={() => onAction("insert:wordArt")} />

        {/* Signature */}
        <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const url = await readImageAsDataUrl(f);
          editor.chain().focus().setImage({ src: url, alt: "signature" } as any).run();
          onAction("insert:signature", { src: url });
          e.target.value = "";
        }} />
        <DropBtn label="" icon={Stamp} width="w-44">
          {(close) => (
            <>
              <MenuItem icon={Upload} label="Upload signature image" onClick={() => { sigRef.current?.click(); close(); }} />
              <MenuItem icon={Pencil} label="Draw signature" onClick={() => { onAction("insert:signatureDraw"); close(); }} />
              <MenuItem icon={Type} label="Type signature" onClick={() => {
                const t = window.prompt("Type your signature");
                if (t) editor.chain().focus().insertContent(`<span style="font-family:'Brush Script MT',cursive;font-size:28px">${t}</span>`).run();
                close();
              }} />
            </>
          )}
        </DropBtn>

        {/* Stamp */}
        <input ref={stampRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const url = await readImageAsDataUrl(f);
          editor.chain().focus().setImage({ src: url, alt: "stamp" } as any).run();
          e.target.value = "";
        }} />
        <DropBtn label="" icon={Stamp} width="w-44">
          {(close) => (
            <>
              <MenuItem icon={Upload} label="Upload stamp" onClick={() => { stampRef.current?.click(); close(); }} />
              {["APPROVED","CONFIDENTIAL","DRAFT","PAID","RECEIVED"].map((s) => (
                <MenuItem key={s} label={s} onClick={() => {
                  editor.chain().focus().insertContent(
                    `<span style="display:inline-block;border:3px solid #dc2626;color:#dc2626;padding:4px 10px;font-weight:800;letter-spacing:2px;transform:rotate(-8deg)">${s}</span>`
                  ).run();
                  close();
                }} />
              ))}
            </>
          )}
        </DropBtn>

        {/* Object */}
        <input ref={objRef} type="file" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          onAction("insert:object", { name: f.name, type: f.type, size: f.size, file: f });
          editor.chain().focus().insertContent(
            `<p><span style="display:inline-flex;align-items:center;gap:6px;border:1px solid #ddd;padding:4px 8px;border-radius:6px">📎 ${f.name}</span></p>`
          ).run();
          e.target.value = "";
        }} />
        <Btn icon={Box} title="Insert object (file)" onClick={() => objRef.current?.click()} />

        <input ref={textFileRef} type="file" accept=".txt,.md,.html" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const reader = new FileReader();
          reader.onload = () => editor.chain().focus().insertContent(String(reader.result || "")).run();
          reader.readAsText(f);
          e.target.value = "";
        }} />
        <Btn icon={FileUp} title="Text from File" onClick={() => textFileRef.current?.click()} />
        <Btn icon={Minus} title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
      </Group>
    </>
  );
}

/* ---- Table picker (visual grid + size text) ---- */
function TablePicker({ editor, onAction }: { editor: Editor; onAction: (a: string, p?: any) => void }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const { anchorRef, rect } = useAnchorRect(open);
  return (
    <>
      <button ref={anchorRef} onClick={() => setOpen((v) => !v)}
        className="h-8 inline-flex items-center gap-1 px-2 rounded-md hover:bg-muted text-foreground text-xs">
        <TableIcon className="h-3.5 w-3.5" /> Table <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <Portal>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div className="fixed p-2 rounded-lg border border-border bg-popover shadow-2xl"
            style={{ zIndex: 9999, top: rect ? rect.bottom + 4 : 0, left: rect ? rect.left : 0 }}>
            <div className="text-[11px] text-muted-foreground mb-2">{hover.r || 0} × {hover.c || 0}</div>
            <div className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: 80 }).map((_, i) => {
                const r = Math.floor(i / 10) + 1; const c = (i % 10) + 1;
                const on = r <= hover.r && c <= hover.c;
                return (
                  <button key={i} onMouseEnter={() => setHover({ r, c })}
                    onClick={() => {
                      editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                      setOpen(false);
                    }}
                    className={`h-4 w-4 border ${on ? "bg-accent border-accent" : "bg-background border-border"}`} />
                );
              })}
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex flex-col gap-1">
              <button className="text-left text-xs px-2 py-1 hover:bg-muted rounded"
                onClick={() => {
                  const r = parseInt(window.prompt("Rows", "3") || "3", 10);
                  const c = parseInt(window.prompt("Columns", "3") || "3", 10);
                  editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                  setOpen(false);
                }}>Insert Table…</button>
              <button className="text-left text-xs px-2 py-1 hover:bg-muted rounded"
                onClick={() => { onAction("table:borders"); setOpen(false); }}>Borders & rules…</button>
              <button className="text-left text-xs px-2 py-1 hover:bg-muted rounded"
                onClick={() => { onAction("table:format"); setOpen(false); }}>Table format…</button>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

/* ---- Symbols (grouped) ---- */
function SymbolsMenu({ editor }: { editor: Editor }) {
  const groups: { name: string; items: string[] }[] = [
    { name: "Currency", items: ["$","€","£","¥","₹","₽","₩","₦","₵","¢","₤","฿","₫","₴","₪","₲"] },
    { name: "General", items: ["©","®","™","§","¶","†","‡","•","°","№","℗","℠","☆","★","✓","✗"] },
    { name: "Math", items: ["±","×","÷","≈","≠","≤","≥","∞","√","∑","∏","∫","∂","Δ","π","µ"] },
    { name: "Arrows / Special", items: ["→","←","↑","↓","↔","⇒","⇐","⇔","«","»","“","”","‘","’","…","—"] },
  ];
  return (
    <DropBtn label="Symbol" icon={Smile} width="w-72">
      {(close) => (
        <div className="p-2 max-h-80 overflow-auto">
          {groups.map((g) => (
            <div key={g.name} className="mb-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1">{g.name}</div>
              <div className="grid grid-cols-8 gap-1">
                {g.items.map((s) => (
                  <button key={s} onClick={() => { editor.chain().focus().insertContent(s).run(); close(); }}
                    className="h-7 w-7 hover:bg-muted rounded text-sm">{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DropBtn>
  );
}

/* ---- Equation builder ---- */
function EquationMenu({ editor }: { editor: Editor }) {
  const insert = (html: string) => editor.chain().focus().insertContent(html).run();
  const items: { label: string; html: string }[] = [
    { label: "Fraction  a/b", html: `<span class="eq"><sup>a</sup>&frasl;<sub>b</sub></span>` },
    { label: "Superscript  x²", html: `<span class="eq">x<sup>2</sup></span>` },
    { label: "Subscript  x₂", html: `<span class="eq">x<sub>2</sub></span>` },
    { label: "Square root  √x", html: `<span class="eq">√<span style="border-top:1px solid">x</span></span>` },
    { label: "Sum  Σ", html: `<span class="eq">Σ<sub>i=1</sub><sup>n</sup>&nbsp;a<sub>i</sub></span>` },
    { label: "Integral  ∫", html: `<span class="eq">∫<sub>a</sub><sup>b</sup>&nbsp;f(x)dx</span>` },
    { label: "Limit", html: `<span class="eq">lim<sub>x→∞</sub>&nbsp;f(x)</span>` },
    { label: "Scientific  a×10ⁿ", html: `<span class="eq">a × 10<sup>n</sup></span>` },
    { label: "Quadratic", html: `<span class="eq">x = (−b ± √(b<sup>2</sup>−4ac)) / 2a</span>` },
  ];
  return (
    <DropBtn label="Equation" icon={Sigma} width="w-56">
      {(close) => (
        <>
          {items.map((it) => (
            <MenuItem key={it.label} label={it.label} onClick={() => { insert(it.html); close(); }} />
          ))}
          <div className="border-t border-border my-1" />
          <MenuItem label="Custom LaTeX / plain…" onClick={() => {
            const eq = window.prompt("Equation (LaTeX or plain)");
            if (eq) editor.chain().focus().insertContent(`<code class="eq">${eq}</code>`).run();
            close();
          }} />
        </>
      )}
    </DropBtn>
  );
}

/* ---- Text Box menu with positioning / wrapping ---- */
function TextBoxMenu({ editor, onAction }: { editor: Editor; onAction: (a: string, p?: any) => void }) {
  const insertBox = (style: string) => {
    editor.chain().focus().insertContent(
      `<div class="text-box" data-tb="1" style="${style}"><p>Text box — click to edit</p></div>`
    ).run();
  };
  return (
    <DropBtn label="Text box" icon={Square} width="w-56">
      {(close) => (
        <>
          <MenuItem label="Simple text box" onClick={() => {
            insertBox("border:1px solid #cbd5e1;padding:8px 12px;border-radius:6px;display:inline-block;min-width:160px");
            close();
          }} />
          <MenuItem label="Quote box" onClick={() => {
            insertBox("border-left:3px solid #2563eb;padding:6px 12px;background:#f1f5f9;display:block");
            close();
          }} />
          <div className="border-t border-border my-1" />
          <div className="px-3 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Position</div>
          <MenuItem icon={BringToFront} label="Bring to front" onClick={() => { onAction("textbox:position", "front"); close(); }} />
          <MenuItem icon={MoveUp} label="Bring forward" onClick={() => { onAction("textbox:position", "forward"); close(); }} />
          <MenuItem icon={MoveDown} label="Send backward" onClick={() => { onAction("textbox:position", "backward"); close(); }} />
          <MenuItem icon={SendToBack} label="Send to back" onClick={() => { onAction("textbox:position", "back"); close(); }} />
          <MenuItem label="In front of text" onClick={() => { onAction("textbox:layer", "front-of-text"); close(); }} />
          <MenuItem label="Behind text" onClick={() => { onAction("textbox:layer", "behind-text"); close(); }} />
          <div className="border-t border-border my-1" />
          <div className="px-3 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Wrap text</div>
          {[
            ["inline", "Inline with text"],
            ["square", "Square"],
            ["tight", "Tight"],
            ["top-bottom", "Top and bottom"],
            ["through", "Through"],
            ["none", "None"],
          ].map(([v, l]) => (
            <MenuItem key={v} label={l} onClick={() => { onAction("textbox:wrap", v); close(); }} />
          ))}
        </>
      )}
    </DropBtn>
  );
}

/* ---- Shapes library ---- */
function ShapesMenu({ onAction }: { onAction: (a: string, p?: any) => void }) {
  const groups: { name: string; items: { id: string; label: string }[] }[] = [
    { name: "Lines / Arrows", items: [
      { id: "line", label: "Line" }, { id: "arrow", label: "Arrow" },
      { id: "double-arrow", label: "Double arrow" }, { id: "elbow", label: "Elbow connector" },
    ]},
    { name: "Basic", items: [
      { id: "rect", label: "Rectangle" }, { id: "rounded-rect", label: "Rounded" },
      { id: "ellipse", label: "Ellipse" }, { id: "triangle", label: "Triangle" },
      { id: "diamond", label: "Diamond" }, { id: "star", label: "Star" },
      { id: "callout", label: "Callout" },
    ]},
    { name: "Flowchart", items: [
      { id: "fc-process", label: "Process" }, { id: "fc-decision", label: "Decision" },
      { id: "fc-terminator", label: "Terminator" }, { id: "fc-data", label: "Data" },
      { id: "fc-document", label: "Document" }, { id: "fc-connector", label: "Connector" },
    ]},
  ];
  return (
    <DropBtn label="Shapes" icon={ShapesIcon} width="w-64">
      {(close) => (
        <div className="p-2 max-h-80 overflow-auto">
          {groups.map((g) => (
            <div key={g.name} className="mb-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1">{g.name}</div>
              <div className="grid grid-cols-2 gap-1">
                {g.items.map((it) => (
                  <button key={it.id} onClick={() => { onAction("insert:shape", it.id); close(); }}
                    className="text-left text-xs px-2 py-1.5 rounded hover:bg-muted">{it.label}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="border-t border-border my-1" />
          <MenuItem icon={Pencil} label="Draw on page" onClick={() => { onAction("insert:shape", "draw"); close(); }} />
        </div>
      )}
    </DropBtn>
  );
}

/* ---------- LAYOUT ---------- */
function LayoutTab({
  pageSettings, onPageSettings, onAction,
}: {
  pageSettings: PageSettings;
  onPageSettings: (p: Partial<PageSettings>) => void;
  onAction: (a: string, p?: any) => void;
}) {
  const watermarkImgRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <Group label="Margins">
        <DropBtn label={`Margins (${pageSettings.margin})`} width="w-44">
          {(close) => (
            <>
              {(["narrow","normal","moderate","wide"] as const).map((m) => (
                <button key={m} onClick={() => { onPageSettings({ margin: m as any }); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted capitalize">{m}</button>
              ))}
              <div className="border-t border-border my-1" />
              <button onClick={() => { onAction("layout:customMargins"); close(); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-accent">Custom Margins…</button>
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Orientation">
        <DropBtn label={pageSettings.orientation === "portrait" ? "Portrait" : "Landscape"} width="w-36">
          {(close) => (
            <>
              <button onClick={() => { onPageSettings({ orientation: "portrait" }); close(); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Portrait</button>
              <button onClick={() => { onPageSettings({ orientation: "landscape" }); close(); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">Landscape</button>
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Page Size">
        <DropBtn label={pageSettings.size} width="w-36">
          {(close) => (
            <>
              {(["A3","A4","A5","A6","Letter","Legal","Tabloid","Statement"] as const).map((s) => (
                <button key={s} onClick={() => { onPageSettings({ size: s as any }); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{s}</button>
              ))}
              <div className="border-t border-border my-1" />
              <button onClick={() => { onAction("layout:customSize"); close(); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-accent">Custom Size…</button>
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Columns">
        <DropBtn label={`${pageSettings.columns} col`} icon={ColumnsIcon} width="w-28">
          {(close) => (
            <>
              {[1,2,3,4].map((n) => (
                <button key={n} onClick={() => { onPageSettings({ columns: n }); close(); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{n} column{n>1?"s":""}</button>
              ))}
            </>
          )}
        </DropBtn>
        <Btn icon={ArrowLeftRight} title="Text direction" onClick={() => onAction("layout:textDirection")} />
      </Group>
      <Group label="Themes">
        <DropBtn label="Theme" icon={Sparkles} width="w-40">
          {(close) => (
            <>
              <MenuItem icon={Palette} label="Theme colors" onClick={() => { onAction("layout:themeColors"); close(); }} />
              <MenuItem icon={Type} label="Theme fonts" onClick={() => { onAction("layout:themeFonts"); close(); }} />
              <MenuItem icon={Sparkles} label="Theme effects" onClick={() => { onAction("layout:themeEffects"); close(); }} />
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Page">
        <Btn icon={Frame} title="Page borders" onClick={() => onPageSettings({ pageBorder: !pageSettings.pageBorder })}
          active={pageSettings.pageBorder} />
        <Btn icon={PaintBucket} title="Page color" onClick={() => {
          const c = window.prompt("Page background color (hex)", "#ffffff");
          if (c) onAction("layout:pageColor", c);
        }} />
        <Btn icon={LineNumIcon} title="Line numbers" onClick={() => onAction("layout:lineNumbers")} />
        <Btn icon={Settings2} title="Section settings" onClick={() => onAction("layout:section")} />
      </Group>
      <Group label="Watermark">
        <input ref={watermarkImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader();
          r.onload = () => {
            const src = r.result as string;
            const op = parseFloat(window.prompt("Opacity 0.05 – 1", "0.2") || "0.2");
            onAction("layout:imageWatermark", { src, opacity: isNaN(op) ? 0.2 : op });
          };
          r.readAsDataURL(f);
          e.target.value = "";
        }} />
        <DropBtn label="Watermark" icon={Stamp} width="w-56">
          {(close) => (
            <>
              <div className="px-3 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Text</div>
              {["Confidential","Do Not Copy","Original","Draft","Sample"].map((w) => (
                <MenuItem key={w} label={w} onClick={() => { onPageSettings({ watermark: w }); close(); }} />
              ))}
              <MenuItem label="Custom text…" onClick={() => {
                const t = window.prompt("Watermark text (blank to remove)", pageSettings.watermark || "");
                const rot = parseInt(window.prompt("Rotation in degrees", "-30") || "-30", 10);
                const op = parseFloat(window.prompt("Opacity 0.05 – 1", "0.15") || "0.15");
                onPageSettings({ watermark: t || "" });
                onAction("layout:textWatermark", { text: t || "", rotation: rot, opacity: op });
                close();
              }} />
              <div className="border-t border-border my-1" />
              <div className="px-3 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Image</div>
              <MenuItem icon={Upload} label="Upload image watermark…" onClick={() => { watermarkImgRef.current?.click(); close(); }} />
              <div className="border-t border-border my-1" />
              <MenuItem danger label="Remove" onClick={() => {
                onPageSettings({ watermark: "" });
                onAction("layout:imageWatermark", null);
                close();
              }} />
            </>
          )}
        </DropBtn>
      </Group>
    </>
  );
}

/* ---------- REFERENCES ---------- */
function ReferencesTab({ editor, onAction }: { editor: Editor; onAction: (a: string, p?: any) => void }) {
  const insertTOC = (maxLevel = 3) => {
    const json = editor.getJSON();
    const headings: { level: number; text: string }[] = [];
    const walk = (n: any) => {
      if (!n) return;
      if (n.type === "heading" && (n.attrs?.level || 1) <= maxLevel) {
        headings.push({ level: n.attrs?.level || 1, text: (n.content || []).map((c: any) => c.text || "").join("") });
      }
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
        <DropBtn label="Insert TOC" icon={ListChecks} width="w-44">
          {(close) => (
            <>
              <MenuItem label="Levels 1–1" onClick={() => { insertTOC(1); close(); }} />
              <MenuItem label="Levels 1–2" onClick={() => { insertTOC(2); close(); }} />
              <MenuItem label="Levels 1–3" onClick={() => { insertTOC(3); close(); }} />
              <MenuItem label="All levels" onClick={() => { insertTOC(6); close(); }} />
              <div className="border-t border-border my-1" />
              <MenuItem label="Update table" onClick={() => { onAction("toc:update"); close(); }} />
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Footnotes">
        <Btn icon={Hash} title="Insert footnote" onClick={() => editor.chain().focus().insertContent("<sup>[1]</sup>").run()} />
        <Btn icon={BookMarked} title="Insert endnote" onClick={() => onAction("ref:endnote")} />
        <Btn icon={ChevronLeft} title="Previous note" onClick={() => onAction("ref:prevNote")} />
        <Btn icon={ChevronRight} title="Next note" onClick={() => onAction("ref:nextNote")} />
      </Group>
      <Group label="Captions">
        <button onClick={() => {
          const c = window.prompt("Caption text");
          if (c) editor.chain().focus().insertContent(`<p><em>Figure: ${c}</em></p>`).run();
        }} className="h-8 px-2 rounded-md hover:bg-muted text-xs text-foreground">Add caption</button>
        <Btn icon={Layers} title="Table of Figures" onClick={() => onAction("ref:tableOfFigures")} />
      </Group>
      <Group label="Index">
        <Btn icon={BookOpen} title="Insert Index" onClick={() => onAction("ref:index")} />
        <Btn icon={ListTree} title="Mark Entry" onClick={() => onAction("ref:markEntry")} />
      </Group>
      <Group label="Citation">
        <button onClick={() => {
          const c = window.prompt("Citation (e.g. Smith, 2024)");
          if (c) editor.chain().focus().insertContent(`(${c})`).run();
        }} className="h-8 px-2 rounded-md hover:bg-muted text-xs text-foreground">Insert citation</button>
      </Group>
    </>
  );
}

/* ---------- REVIEW ---------- */
const AMINEVA_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English (Default)" },
  { code: "tw", label: "Twi" },
  { code: "he", label: "Hebrew" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "de", label: "German" },
  { code: "ru", label: "Russian" },
  { code: "sw", label: "Swahili" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
];

function ReviewTab({
  editor, wordsCount, charCount, onAction,
}: { editor: Editor; wordsCount: number; charCount: number; onAction: (a: string, p?: any) => void }) {
  return (
    <>
      <Group label="Proofing">
        <div className="text-xs text-foreground px-2 py-1 leading-tight">
          <div className="font-semibold">{wordsCount} words</div>
          <div className="text-[10px] text-muted-foreground">{charCount} chars</div>
        </div>
        <Btn icon={CheckCircle} title="Dipa Spelling Check" onClick={() => onAction("ai", { action: "spelling", label: "Spelling" })} />
        <Btn icon={Sparkles} title="Dipa Grammar Check" onClick={() => onAction("ai", { action: "grammar", label: "Grammar" })} />
      </Group>
      <Group label="Language">
        <DropBtn label="Dipa Translate" icon={Languages} width="w-56">
          {(close) => (
            <div className="max-h-80 overflow-auto">
              {AMINEVA_LANGUAGES.map((l) => (
                <MenuItem key={l.code} label={l.label} onClick={() => {
                  onAction("ai", { action: "translate", label: "Dipa Translate", target: l.code, targetLabel: l.label });
                  close();
                }} />
              ))}
            </div>
          )}
        </DropBtn>
      </Group>
      <Group label="Compare">
        <Btn icon={GitCompare} title="Compare documents" onClick={() => onAction("review:compare")} />
      </Group>
      <Group label="Comments">
        <Btn icon={MessageSquare} title="New comment" onClick={() => onAction("comment:add")} />
        <Btn icon={MessagesSquare} title="Show comments" onClick={() => onAction("comment:show")} />
        <Btn icon={ChevronLeft} title="Previous comment" onClick={() => onAction("comment:prev")} />
        <Btn icon={ChevronRight} title="Next comment" onClick={() => onAction("comment:next")} />
      </Group>
      <Group label="Track Changes">
        <Btn icon={RotateCcw} title="Toggle track changes" onClick={() => onAction("track:toggle")} />
        <Btn icon={Eye} title="Show markup" onClick={() => onAction("track:showMarkup")} />
      </Group>
      <Group label="Changes">
        <Btn icon={Check} title="Accept" onClick={() => onAction("track:accept")} />
        <Btn icon={X} title="Reject" onClick={() => onAction("track:reject")} />
        <Btn icon={ChevronLeft} title="Previous change" onClick={() => onAction("track:prev")} />
        <Btn icon={ChevronRight} title="Next change" onClick={() => onAction("track:next")} />
      </Group>
      <Group label="Permissions">
        <Btn icon={Lock} title="Restrict editing" onClick={() => onAction("perm:restrict")} />
        <Btn icon={Unlock} title="Allow editing" onClick={() => onAction("perm:allow")} />
      </Group>
    </>
  );
}

/* ---------- VIEW ---------- */
function ViewTab({
  onToggleLeftPanel, onToggleRightPanel, onZoom, zoom, showRuler, onToggleRuler, onPageSettings, pageSettings, onAction,
}: any) {
  return (
    <>
      <Group label="Modes">
        <DropBtn
          label={
            pageSettings.mode === "reading" ? "Reading" :
            pageSettings.mode === "web" ? "Web" :
            pageSettings.mode === "outline" ? "Outline" : "Print"
          }
          width="w-40"
        >
          {(close) => (
            <>
              <MenuItem icon={BookOpen} label="Reading Mode" onClick={() => { onPageSettings({ mode: "reading" }); close(); }} />
              <MenuItem icon={FileText} label="Print Layout" onClick={() => { onPageSettings({ mode: "print" }); close(); }} />
              <MenuItem icon={Code2} label="Web Layout" onClick={() => { onPageSettings({ mode: "web" }); close(); }} />
              <MenuItem icon={ListTree} label="Outline View" onClick={() => { onPageSettings({ mode: "outline" }); close(); }} />
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Panels">
        <Btn icon={PanelLeft} title="Navigation panel" onClick={onToggleLeftPanel} />
        <Btn icon={ListTree} title="Document outline" onClick={() => onAction("view:outline")} />
        <Btn icon={PanelRight} title="Intelligence panel" onClick={onToggleRightPanel} />
      </Group>
      <Group label="Display">
        <Btn icon={Ruler} title="Ruler" active={showRuler} onClick={onToggleRuler} />
        <Btn icon={Grid3x3} title="Gridlines" onClick={() => onAction("view:gridlines")} />
        <Btn icon={AlignHorizontalDistributeCenter} title="Guides" onClick={() => onAction("view:guides")} />
      </Group>
      <Group label="Window">
        <Btn icon={Plus} title="New window" onClick={() => window.open(window.location.href, "_blank")} />
        <Btn icon={SplitSquareHorizontal} title="Split window" onClick={() => onAction("view:split")} />
        <Btn icon={Layers} title="Arrange all" onClick={() => onAction("view:arrange")} />
      </Group>
      <Group label="Zoom">
        <Btn icon={ZoomOut} title="Zoom out" onClick={() => onZoom(Math.max(0.5, zoom - 0.1))} />
        <span className="text-xs text-foreground px-1 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <Btn icon={ZoomIn} title="Zoom in" onClick={() => onZoom(Math.min(2, zoom + 0.1))} />
        <DropBtn label="Fit" icon={Maximize2} width="w-36">
          {(close) => (
            <>
              <MenuItem label="Page width" onClick={() => { onZoom("fit-width"); close(); }} />
              <MenuItem label="Full page" onClick={() => { onZoom("fit-page"); close(); }} />
              <MenuItem label="100%" onClick={() => { onZoom(1); close(); }} />
            </>
          )}
        </DropBtn>
      </Group>
      <Group label="Protect">
        <Btn icon={ShieldCheck} title="High Protector Mode" onClick={() => onAction("view:highProtector")} />
      </Group>
    </>
  );
}

/* ---------- TOOLS (Amineva) ---------- */
function ToolsTab({ onAction }: { onAction: (a: string, p?: any) => void }) {
  return (
    <>
      <Group label="Amineva Tools">
        <Btn icon={Sparkles} title="Dipa Tools" onClick={() => onAction("tools:amineva")} />
        <Btn icon={Calculator} title="Quick calc" onClick={() => onAction("tools:calc")} />
        <Btn icon={Building2} title="Workspace tools" onClick={() => onAction("tools:workspace")} />
      </Group>
      <Group label="Add-ins">
        <Btn icon={Puzzle} title="Add-ins" onClick={() => onAction("tools:addins")} />
        <Btn icon={Sparkles} title="Amineva Add-ons" onClick={() => onAction("tools:addons")} />
      </Group>
      <Group label="Developer">
        <Btn icon={Code2} title="Developer tools" onClick={() => onAction("tools:dev")} />
        <Btn icon={Settings2} title="Extensions" onClick={() => onAction("tools:extensions")} />
      </Group>
    </>
  );
}

/* keep an explicit useEffect import alive for tree-shakers if needed */
void useEffect;
