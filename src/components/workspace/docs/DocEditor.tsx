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
import FontFamily from "@tiptap/extension-font-family";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import type { Editor } from "@tiptap/react";

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },
});

export function useDocEditor(opts: {
  initialContent: any;
  editable?: boolean;
  onUpdate?: (editor: Editor) => void;
  onDoubleClickImage?: () => void;
}) {
  return useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "doc-link" } }),
      CustomImage.configure({ inline: true, HTMLAttributes: { class: "doc-img" } }),
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
      FontFamily,
      Superscript,
      Subscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
    ],
    content: opts.initialContent,
    editable: opts.editable ?? true,
    onUpdate: ({ editor }) => opts.onUpdate?.(editor),
    editorProps: {
      handleDOMEvents: {
        dblclick: (view, event) => {
          const target = event.target as HTMLElement;
          if (target.nodeName === "IMG") {
            opts.onDoubleClickImage?.();
            return true;
          }
          return false;
        },
      },
    },
  });
}

export function EditorSurface({ editor }: { editor: Editor | null }) {
  return (
    <div className="doc-canvas mx-auto bg-transparent border-0 rounded-none shadow-none">
      <EditorContent editor={editor} />
    </div>
  );
}
