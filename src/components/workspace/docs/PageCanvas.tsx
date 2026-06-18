import { EditorContent, type Editor } from "@tiptap/react";

export type PageSize = "A3" | "A4" | "A5" | "A6" | "Letter" | "Legal" | "Tabloid" | "Statement";
export type PageMargin = "narrow" | "normal" | "wide";
export type PageOrientation = "portrait" | "landscape";
export type ViewMode = "print" | "web" | "reading";

export interface PageSettings {
  size: PageSize;
  orientation: PageOrientation;
  margin: PageMargin;
  columns: number;
  watermark?: string;
  pageBorder?: boolean;
  mode: ViewMode;
  header?: string;
  footer?: string;
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  size: "A4",
  orientation: "portrait",
  margin: "normal",
  columns: 1,
  watermark: "",
  pageBorder: false,
  mode: "print",
  header: "",
  footer: "",
};

// width x height in px @96dpi-ish (visual approximation)
const SIZES: Record<PageSize, [number, number]> = {
  A3: [1123, 1587],
  A4: [794, 1123],
  A5: [559, 794],
  A6: [397, 559],
  Letter: [816, 1056],
  Legal: [816, 1344],
  Tabloid: [1056, 1632],
  Statement: [528, 816],
};
const MARGINS: Record<PageMargin, number> = { narrow: 32, normal: 64, wide: 96 };

export function PageCanvas({
  editor,
  settings,
  zoom,
  surfaceRef,
  onHeaderChange,
  onFooterChange,
}: {
  editor: Editor | null;
  settings: PageSettings;
  zoom: number;
  surfaceRef?: React.RefObject<HTMLDivElement>;
  onHeaderChange?: (s: string) => void;
  onFooterChange?: (s: string) => void;
}) {
  let [w, h] = SIZES[settings.size];
  if (settings.orientation === "landscape") [w, h] = [h, w];

  if (settings.mode === "web") {
    return (
      <div ref={surfaceRef} className="doc-canvas mx-auto bg-white text-gray-900 rounded-lg shadow-sm border border-border" style={{ width: "min(960px, 100%)", padding: 48 }}>
        <EditorContent editor={editor} />
      </div>
    );
  }

  const margin = MARGINS[settings.margin];

  return (
    <div
      ref={surfaceRef}
      className="doc-canvas relative bg-white text-gray-900 shadow-xl mx-auto"
      style={{
        width: w,
        minHeight: h,
        padding: margin,
        transform: `scale(${zoom})`,
        transformOrigin: "top center",
        marginBottom: 60,
        boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
        border: settings.pageBorder ? "2px solid #0f172a" : "1px solid #e5e7eb",
        columnCount: settings.columns,
        columnGap: 32,
        position: "relative",
      }}
    >
      {settings.watermark && (
        <div
          aria-hidden
          className="pointer-events-none select-none"
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: "rotate(-30deg)",
            color: "rgba(15,23,42,0.07)",
            fontSize: 96, fontWeight: 800, letterSpacing: 4,
            zIndex: 0,
          }}
        >{settings.watermark}</div>
      )}

      {/* Header band */}
      {settings.mode === "print" && (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onHeaderChange?.(e.currentTarget.textContent || "")}
          className="text-[11px] text-gray-500 border-b border-gray-200 pb-1 mb-3 outline-none"
          style={{ marginTop: -margin / 2 }}
          data-placeholder="Header"
        >
          {settings.header || ""}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer band */}
      {settings.mode === "print" && (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onFooterChange?.(e.currentTarget.textContent || "")}
          className="text-[11px] text-gray-500 border-t border-gray-200 pt-1 mt-3 flex justify-between outline-none"
          style={{ marginBottom: -margin / 2 }}
        >
          <span>{settings.footer || ""}</span>
          <span>Page 1</span>
        </div>
      )}
    </div>
  );
}
