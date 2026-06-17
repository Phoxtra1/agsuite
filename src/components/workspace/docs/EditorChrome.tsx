import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, ListTodo, Quote, Heading1, Heading2, Heading3, Image as ImgIcon, Table as TableIcon,
  Link as LinkIcon, Minus, Highlighter, Palette, Tag, Undo, Redo, Superscript as SupIcon, Subscript as SubIcon,
  Type
} from "lucide-react";
import { INTELLIGENCE_TAGS, type IntelligenceTagType } from "./IntelligenceTagExtension";

export function MenuBar({ editor, onAction }: { editor: Editor; onAction: (a: string) => void }) {
  const groups: { label: string; items: { id: string; label: string }[] }[] = [
    {
      label: "File",
      items: [
        { id: "file:new", label: "New document" },
        { id: "file:open", label: "Open…" },
        { id: "file:save", label: "Save now" },
        { id: "file:rename", label: "Rename…" },
        { id: "file:export-pdf", label: "Export · PDF" },
        { id: "file:export-doc", label: "Export · DOC" },
        { id: "file:export-json", label: "Export · JSON" },
        { id: "file:export-csv", label: "Export · CSV" },
        { id: "file:share", label: "Share link…" },
        { id: "file:print", label: "Print" },
      ],
    },
    {
      label: "Edit",
      items: [
        { id: "edit:undo", label: "Undo" },
        { id: "edit:redo", label: "Redo" },
        { id: "edit:find", label: "Find…" },
        { id: "edit:replace", label: "Replace…" },
      ],
    },
    {
      label: "Insert",
      items: [
        { id: "insert:image", label: "Image…" },
        { id: "insert:table", label: "Table" },
        { id: "insert:link", label: "Link…" },
        { id: "insert:divider", label: "Divider" },
      ],
    },
    {
      label: "Format",
      items: [
        { id: "fmt:bold", label: "Bold" },
        { id: "fmt:italic", label: "Italic" },
        { id: "fmt:underline", label: "Underline" },
        { id: "fmt:clear", label: "Clear formatting" },
      ],
    },
    {
      label: "Tools",
      items: [
        { id: "tool:wordcount", label: "Word count" },
        { id: "tool:structure", label: "Structure view" },
      ],
    },
    {
      label: "View",
      items: [
        { id: "view:zoom-in", label: "Zoom in" },
        { id: "view:zoom-out", label: "Zoom out" },
        { id: "view:zoom-reset", label: "Reset zoom" },
        { id: "view:fullscreen", label: "Full screen" },
      ],
    },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card text-xs">
      {groups.map((g) => (
        <DropMenu key={g.label} label={g.label} items={g.items} onSelect={onAction} />
      ))}
    </div>
  );
}

function DropMenu({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: { id: string; label: string }[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="px-2.5 py-1 rounded-md hover:bg-muted text-foreground font-medium"
      >
        {label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 min-w-[200px] rounded-lg border border-border bg-popover shadow-xl py-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => { setOpen(false); onSelect(it.id); }}
              className="w-full text-left px-3 py-1.5 hover:bg-muted text-foreground"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FormattingToolbar({ editor }: { editor: Editor }) {
  if (!editor) return null;
  const btn = "h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground";
  const active = "bg-accent/20 text-accent";

  return (
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-border bg-background">
      <button className={`${btn} ${editor.can().undo() ? "" : "opacity-40"}`} onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.can().redo() ? "" : "opacity-40"}`} onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-4 w-4"/></button>
      <Sep />
      
      <FontFamilyPicker editor={editor} />
      <Sep />

      <button className={`${btn} ${editor.isActive("heading", { level: 1 }) ? active : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("heading", { level: 2 }) ? active : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("heading", { level: 3 }) ? active : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 className="h-4 w-4"/></button>
      <Sep />
      <button className={`${btn} ${editor.isActive("bold") ? active : ""}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("italic") ? active : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("underline") ? active : ""}`} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("strike") ? active : ""}`} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("superscript") ? active : ""}`} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Superscript"><SupIcon className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("subscript") ? active : ""}`} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Subscript"><SubIcon className="h-4 w-4"/></button>
      <Sep />
      <button className={`${btn} ${editor.isActive({ textAlign: "left" }) ? active : ""}`} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left"><AlignLeft className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive({ textAlign: "center" }) ? active : ""}`} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center"><AlignCenter className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive({ textAlign: "right" }) ? active : ""}`} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right"><AlignRight className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive({ textAlign: "justify" }) ? active : ""}`} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify"><AlignJustify className="h-4 w-4"/></button>
      <Sep />
      <button className={`${btn} ${editor.isActive("bulletList") ? active : ""}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("orderedList") ? active : ""}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List"><ListOrdered className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("taskList") ? active : ""}`} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task List"><ListTodo className="h-4 w-4"/></button>
      <button className={`${btn} ${editor.isActive("blockquote") ? active : ""}`} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="h-4 w-4"/></button>
      <Sep />
      <ColorButton editor={editor} />
      <button className={`${btn} ${editor.isActive("highlight") ? active : ""}`} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight"><Highlighter className="h-4 w-4"/></button>
      <Sep />
      <button className={btn} title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4"/></button>
      <button className={btn} title="Insert image" onClick={() => {
        const url = window.prompt("Image URL");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }}><ImgIcon className="h-4 w-4"/></button>
      <button className={btn} title="Insert link" onClick={() => {
        const url = window.prompt("Link URL", editor.getAttributes("link").href || "https://");
        if (url === null) return;
        if (url === "") editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }}><LinkIcon className="h-4 w-4"/></button>
      <button className={btn} title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4"/></button>
      <Sep />
      <IntelligenceTagPicker editor={editor} />
    </div>
  );
}

function Sep() {
  return <div className="h-5 w-px bg-border mx-1" />;
}

function FontFamilyPicker({ editor }: { editor: Editor }) {
  const fonts = ["Inter", "Arial", "Roboto", "Times New Roman", "Georgia", "Verdana"];
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 inline-flex items-center gap-1.5 px-2 rounded-md hover:bg-muted text-foreground text-xs"
        title="Font Family"
      >
        <Type className="h-3.5 w-3.5 text-muted-foreground" />
        Font
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 min-w-[140px] rounded-lg border border-border bg-popover shadow-lg py-1">
          {fonts.map((f) => (
            <button
              key={f}
              onClick={() => { editor.chain().focus().setFontFamily(f).run(); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${editor.isActive('textStyle', { fontFamily: f }) ? 'text-accent' : 'text-foreground'}`}
              style={{ fontFamily: f }}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => { editor.chain().focus().unsetFontFamily().run(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-muted-foreground border-t border-border mt-1"
          >Default</button>
        </div>
      )}
    </div>
  );
}

function ColorButton({ editor }: { editor: Editor }) {
  const swatches = ["#0f172a", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#2563eb", "#7c3aed"];
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" onClick={() => setOpen((v) => !v)}><Palette className="h-4 w-4"/></button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 p-2 rounded-lg border border-border bg-popover shadow-lg grid grid-cols-4 gap-1.5">
          {swatches.map((c) => (
            <button
              key={c}
              onClick={() => { editor.chain().focus().setColor(c).run(); setOpen(false); }}
              className="h-6 w-6 rounded-md border border-border"
              style={{ background: c }}
            />
          ))}
          <button
            onClick={() => { editor.chain().focus().unsetColor().run(); setOpen(false); }}
            className="col-span-4 text-[11px] text-muted-foreground hover:text-foreground mt-1"
          >Reset</button>
        </div>
      )}
    </div>
  );
}

function IntelligenceTagPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 inline-flex items-center gap-1.5 px-2 rounded-md hover:bg-muted text-muted-foreground"
        title="Tag selection as intelligence"
      >
        <Tag className="h-4 w-4" />
        <span className="text-[11px] font-medium">Tag</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-20 min-w-[160px] rounded-lg border border-border bg-popover shadow-lg py-1">
          {INTELLIGENCE_TAGS.map((t) => (
            <button
              key={t.id}
              onClick={() => { editor.chain().focus().setIntelligenceTag(t.id as IntelligenceTagType).run(); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2"
            >
              <span className={`inline-block h-2 w-2 rounded-full itag-swatch itag-${t.id}`} />
              {t.label}
            </button>
          ))}
          <button
            onClick={() => { editor.chain().focus().unsetIntelligenceTag().run(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-muted-foreground border-t border-border mt-1"
          >Remove tag</button>
        </div>
      )}
    </div>
  );
}
