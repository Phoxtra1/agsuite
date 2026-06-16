import { Mark, mergeAttributes } from "@tiptap/core";

export type IntelligenceTagType = "insight" | "data" | "summary" | "evidence" | "reference";

export const INTELLIGENCE_TAGS: { id: IntelligenceTagType; label: string; className: string }[] = [
  { id: "insight",   label: "Insight",   className: "itag itag-insight" },
  { id: "data",      label: "Data",      className: "itag itag-data" },
  { id: "summary",   label: "Summary",   className: "itag itag-summary" },
  { id: "evidence",  label: "Evidence",  className: "itag itag-evidence" },
  { id: "reference", label: "Reference", className: "itag itag-reference" },
];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    intelligenceTag: {
      setIntelligenceTag: (type: IntelligenceTagType) => ReturnType;
      unsetIntelligenceTag: () => ReturnType;
    };
  }
}

export const IntelligenceTag = Mark.create({
  name: "intelligenceTag",

  addAttributes() {
    return {
      tagType: {
        default: "insight",
        parseHTML: (el) => el.getAttribute("data-itag"),
        renderHTML: (attrs) => ({ "data-itag": attrs.tagType }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-itag]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const type = (HTMLAttributes as any)["data-itag"] || "insight";
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: `itag itag-${type}` }),
      0,
    ];
  },

  addCommands() {
    return {
      setIntelligenceTag:
        (type) =>
        ({ commands }) =>
          commands.setMark(this.name, { tagType: type }),
      unsetIntelligenceTag:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
