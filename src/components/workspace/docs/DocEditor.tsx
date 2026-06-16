import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { IntelligenceTag } from "./IntelligenceTagExtension";
import type { Editor } from "@tiptap/react";

export function useDocEditor(opts: {
  initialContent: any;
  editable?: boolean;
  onUpdate?: (editor: Editor) => void;
}) {
  return useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "doc-link" } }),
      Image.configure({ inline: false, HTMLAttributes: { class: "doc-img" } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: "Start writing… use the toolbar to structure your intelligence." }),
      IntelligenceTag,
    ],
    content: opts.initialContent,
    editable: opts.editable ?? true,
    onUpdate: ({ editor }) => opts.onUpdate?.(editor),
  });
}

export function EditorSurface({ editor }: { editor: Editor | null }) {
  return (
    <div className="doc-surface mx-auto bg-background border border-border rounded-xl shadow-sm">
      <EditorContent editor={editor} />
    </div>
  );
}
