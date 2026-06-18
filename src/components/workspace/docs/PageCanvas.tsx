import { EditorContent, type Editor } from "@tiptap/react";
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type PageSize =
  | "A3" | "A4" | "A5" | "A6"
  | "Letter" | "Legal" | "Tabloid" | "Statement";
export type PageMargin = "narrow" | "normal" | "wide";
export type PageOrientation = "portrait" | "landscape";
export type ViewMode = "print" | "web" | "reading";

export type OverlayWrap = "inline" | "square" | "tight" | "behind" | "front";
export type OverlayLayer = "front" | "behind";
export type OverlayKind =
  | "shape" | "textbox" | "image" | "object" | "signature" | "signatureDraw";

export interface OverlayItem {
  id: string;
  kind: OverlayKind;
  page?: number;
  x: number; y: number; w: number; h: number;
  rotation?: number;
  layer?: OverlayLayer;
  wrap?: OverlayWrap;
  zIndex?: number;
  shape?: "rect" | "ellipse" | "line" | "arrow" | "triangle" | "star";
  fill?: string; stroke?: string; strokeWidth?: number;
  text?: string; fontSize?: number; fontFamily?: string;
  color?: string; align?: "left" | "center" | "right";
  src?: string; alt?: string;
  svgPath?: string; viewBox?: string;
}

export interface TextWatermark {
  text: string; color?: string; opacity?: number;
  angle?: number; fontSize?: number; fontWeight?: number;
}
export interface ImageWatermark { src: string; opacity?: number; scale?: number; }

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
  customSize?: { w: number; h: number };
  customMargin?: number;
  pageColor?: string;
  textWatermark?: TextWatermark;
  imageWatermark?: ImageWatermark;
  showPageNumbers?: boolean;
  tableDefaults?: {
    borders?: boolean; borderColor?: string;
    borderWidth?: number; cellPadding?: number;
  };
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
  pageColor: "#ffffff",
  showPageNumbers: true,
  tableDefaults: { borders: true, borderColor: "#cbd5e1", borderWidth: 1, cellPadding: 6 },
};

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const SIZES: Record<PageSize, [number, number]> = {
  A3: [1123, 1587], A4: [794, 1123], A5: [559, 794], A6: [397, 559],
  Letter: [816, 1056], Legal: [816, 1344], Tabloid: [1056, 1632], Statement: [528, 816],
};
const MARGINS: Record<PageMargin, number> = { narrow: 32, normal: 64, wide: 96 };

const HEADER_BAND = 36; // height reserved for page header
const FOOTER_BAND = 36; // height reserved for page footer
const PAGE_GAP    = 24; // visual gap between stacked sheets

function resolveSize(s: PageSettings): [number, number] {
  if (s.customSize?.w && s.customSize?.h) return [s.customSize.w, s.customSize.h];
  let [w, h] = SIZES[s.size];
  if (s.orientation === "landscape") [w, h] = [h, w];
  return [w, h];
}
function resolveMargin(s: PageSettings): number {
  if (typeof s.customMargin === "number") return s.customMargin;
  return MARGINS[s.margin];
}
function applyTokens(tpl: string, ctx: { page: number; total: number; date: string }) {
  return (tpl || "")
    .replace(/\{pageNumber\}/g, String(ctx.page))
    .replace(/\{totalPages\}/g, String(ctx.total))
    .replace(/\{date\}/g, ctx.date);
}

/* ------------------------------------------------------------------ */
/* Overlay rendering (shapes, signatures, images placed on a page)    */
/* ------------------------------------------------------------------ */

function OverlayLayerView({
  items, layer, pageIndex,
}: { items: OverlayItem[]; layer: OverlayLayer; pageIndex: number }) {
  const filtered = items.filter(
    (o) => (o.layer ?? "front") === layer && ((o.page ?? 1) - 1) === pageIndex
  );
  if (!filtered.length) return null;
  return (
    <div
      aria-hidden={layer === "behind" ? true : undefined}
      style={{
        position: "absolute", inset: 0,
        pointerEvents: layer === "behind" ? "none" : "auto",
        zIndex: layer === "behind" ? 0 : 5,
      }}
    >
      {filtered.map((o) => <OverlayItemView key={o.id} item={o} />)}
    </div>
  );
}

function OverlayItemView({ item }: { item: OverlayItem }) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: item.x, top: item.y, width: item.w, height: item.h,
    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
    zIndex: item.zIndex,
  };
  switch (item.kind) {
    case "shape": {
      const stroke = item.stroke ?? "#0f172a";
      const sw = item.strokeWidth ?? 2;
      const fill = item.fill ?? "transparent";
      return (
        <svg style={base} viewBox={`0 0 ${item.w} ${item.h}`}>
          {item.shape === "ellipse" && (
            <ellipse cx={item.w / 2} cy={item.h / 2} rx={item.w / 2 - sw} ry={item.h / 2 - sw} fill={fill} stroke={stroke} strokeWidth={sw} />
          )}
          {item.shape === "line" && (
            <line x1={0} y1={item.h / 2} x2={item.w} y2={item.h / 2} stroke={stroke} strokeWidth={sw} />
          )}
          {item.shape === "arrow" && (
            <g stroke={stroke} strokeWidth={sw} fill={stroke}>
              <line x1={0} y1={item.h / 2} x2={item.w - 10} y2={item.h / 2} />
              <polygon points={`${item.w - 10},${item.h / 2 - 6} ${item.w},${item.h / 2} ${item.w - 10},${item.h / 2 + 6}`} />
            </g>
          )}
          {item.shape === "triangle" && (
            <polygon points={`${item.w / 2},0 ${item.w},${item.h} 0,${item.h}`} fill={fill} stroke={stroke} strokeWidth={sw} />
          )}
          {item.shape === "star" && (
            <polygon
              points={(() => {
                const cx = item.w / 2, cy = item.h / 2;
                const rO = Math.min(item.w, item.h) / 2 - sw;
                const rI = rO / 2.5;
                const pts: string[] = [];
                for (let i = 0; i < 10; i++) {
                  const r = i % 2 === 0 ? rO : rI;
                  const a = (Math.PI / 5) * i - Math.PI / 2;
                  pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
                }
                return pts.join(" ");
              })()}
              fill={fill} stroke={stroke} strokeWidth={sw}
            />
          )}
          {(!item.shape || item.shape === "rect") && (
            <rect x={sw / 2} y={sw / 2} width={item.w - sw} height={item.h - sw} fill={fill} stroke={stroke} strokeWidth={sw} />
          )}
        </svg>
      );
    }
    case "textbox":
    case "signature":
      return (
        <div style={{
          ...base, padding: 6,
          border: item.kind === "textbox" ? "1px dashed #94a3b8" : "none",
          color: item.color ?? "#0f172a",
          fontFamily: item.fontFamily ?? "inherit",
          fontSize: item.fontSize ?? 14,
          textAlign: item.align ?? "left",
          background: item.fill ?? "transparent",
          overflow: "hidden",
          fontStyle: item.kind === "signature" ? "italic" : undefined,
        }}>
          {item.text}
        </div>
      );
    case "image":
    case "object":
      return (
        <img src={item.src} alt={item.alt ?? ""} draggable={false}
             style={{ ...base, objectFit: "contain" }} />
      );
    case "signatureDraw":
      return (
        <svg style={base} viewBox={item.viewBox ?? `0 0 ${item.w} ${item.h}`}>
          <path d={item.svgPath ?? ""} fill="none"
                stroke={item.color ?? "#0f172a"} strokeWidth={item.strokeWidth ?? 2} />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Watermark                                                          */
/* ------------------------------------------------------------------ */

function WatermarkLayer({ settings, w }: { settings: PageSettings; w: number }) {
  return (
    <>
      {settings.imageWatermark?.src && (
        <div aria-hidden className="pointer-events-none select-none"
             style={{ position: "absolute", inset: 0, display: "flex",
                      alignItems: "center", justifyContent: "center", zIndex: 0 }}>
          <img src={settings.imageWatermark.src} alt=""
               style={{ width: (settings.imageWatermark.scale ?? 0.6) * w,
                        opacity: settings.imageWatermark.opacity ?? 0.08 }} />
        </div>
      )}
      {(settings.textWatermark?.text || settings.watermark) && (
        <div aria-hidden className="pointer-events-none select-none"
             style={{
               position: "absolute", inset: 0, display: "flex",
               alignItems: "center", justifyContent: "center",
               transform: `rotate(${settings.textWatermark?.angle ?? -30}deg)`,
               color: settings.textWatermark?.color ?? "rgba(15,23,42,0.07)",
               opacity: settings.textWatermark?.opacity ?? 1,
               fontSize: settings.textWatermark?.fontSize ?? 96,
               fontWeight: settings.textWatermark?.fontWeight ?? 800,
               letterSpacing: 4, zIndex: 0,
             }}>
          {settings.textWatermark?.text || settings.watermark}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Page chrome (header / footer / border) rendered per page           */
/* ------------------------------------------------------------------ */

function PageChrome({
  pageIndex, pageCount, settings, w, h, margin,
  onHeaderChange, onFooterChange, today,
}: {
  pageIndex: number;
  pageCount: number;
  settings: PageSettings;
  w: number; h: number; margin: number;
  onHeaderChange?: (s: string) => void;
  onFooterChange?: (s: string) => void;
  today: string;
}) {
  const isFirst = pageIndex === 0;
  const ctx = { page: pageIndex + 1, total: pageCount, date: today };
  return (
    <>
      {/* Header band (opaque so it masks editor text flowing behind) */}
      <div
        contentEditable={isFirst}
        suppressContentEditableWarning
        onBlur={(e) => isFirst && onHeaderChange?.(e.currentTarget.textContent || "")}
        className="text-[11px] text-gray-500 outline-none"
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: HEADER_BAND,
          padding: `8px ${margin}px 4px ${margin}px`,
          borderBottom: "1px solid #e5e7eb",
          background: settings.pageColor ?? "#ffffff",
          zIndex: 3,
          display: "flex", alignItems: "center",
        }}
        data-placeholder={isFirst ? "Click to edit header" : undefined}
      >
        {applyTokens(settings.header || "", ctx)}
      </div>

      {/* Footer band */}
      <div
        contentEditable={isFirst}
        suppressContentEditableWarning
        onBlur={(e) => isFirst && onFooterChange?.(e.currentTarget.textContent || "")}
        className="text-[11px] text-gray-500 outline-none"
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: FOOTER_BAND,
          padding: `4px ${margin}px 8px ${margin}px`,
          borderTop: "1px solid #e5e7eb",
          background: settings.pageColor ?? "#ffffff",
          zIndex: 3,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16,
        }}
        data-placeholder={isFirst ? "Click to edit footer" : undefined}
      >
        <span>{applyTokens(settings.footer || "", ctx)}</span>
        {settings.showPageNumbers !== false && (
          <span>Page {pageIndex + 1} of {pageCount}</span>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Main canvas                                                        */
/* ------------------------------------------------------------------ */

export function PageCanvas({
  editor,
  settings,
  zoom,
  surfaceRef,
  onHeaderChange,
  onFooterChange,
  overlays = [],
}: {
  editor: Editor | null;
  settings: PageSettings;
  zoom: number;
  surfaceRef?: React.RefObject<HTMLDivElement>;
  onHeaderChange?: (s: string) => void;
  onFooterChange?: (s: string) => void;
  overlays?: OverlayItem[];
}) {
  const [w, h] = resolveSize(settings);
  const margin = resolveMargin(settings);
  const today = new Date().toLocaleDateString();

  // Inner editable rectangle of a page (between header band + top margin and footer band + bottom margin)
  const innerTop = HEADER_BAND + margin / 2;
  const innerBottom = FOOTER_BAND + margin / 2;
  const innerHeight = Math.max(120, h - innerTop - innerBottom);
  const innerWidth = w - margin * 2;

  /* ----- Measure editor content height (drives auto-pagination) ---- */

  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(innerHeight);

  useLayoutEffect(() => {
    if (!editorWrapRef.current) return;
    const el = editorWrapRef.current;
    const measure = () => {
      // scrollHeight reflects natural content height even when parent is constrained
      const next = el.scrollHeight;
      setContentHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Re-measure on editor transactions (image loads, table inserts, etc.)
    const onUpdate = () => requestAnimationFrame(measure);
    editor?.on("update", onUpdate);
    editor?.on("transaction", onUpdate);
    return () => {
      ro.disconnect();
      editor?.off("update", onUpdate);
      editor?.off("transaction", onUpdate);
    };
  }, [editor, innerHeight, innerWidth]);

  // Count hard page breaks (data-page-break) and add to natural overflow pages
  const hardBreaks = useMemo(() => {
    if (!editor) return 0;
    const html = editor.getHTML();
    const m = html.match(/data-page-break|class="page-break"/g);
    return m?.length ?? 0;
  }, [editor, editor?.state]);

  const overflowPages = Math.max(1, Math.ceil(contentHeight / innerHeight));
  const pageCount = Math.max(overflowPages, hardBreaks + 1);

  /* ------------------------ Web (flat) mode ----------------------- */

  if (settings.mode === "web") {
    return (
      <div
        ref={surfaceRef}
        className="doc-canvas mx-auto text-gray-900 rounded-lg shadow-sm border border-border"
        style={{ width: "min(960px, 100%)", padding: 48,
                 background: settings.pageColor ?? "#ffffff" }}
      >
        <EditorContent editor={editor} />
      </div>
    );
  }

  /* ------------------------- Print mode --------------------------- */

  const tableCss = settings.tableDefaults?.borders === false
    ? ``
    : `.doc-canvas table, .doc-canvas th, .doc-canvas td {
        border: ${settings.tableDefaults?.borderWidth ?? 1}px solid ${settings.tableDefaults?.borderColor ?? "#cbd5e1"};
        border-collapse: collapse;
        padding: ${settings.tableDefaults?.cellPadding ?? 6}px;
      }
      .doc-canvas table { width: 100%; table-layout: fixed; }
      /* Images must scale to page width and never break layout */
      .doc-canvas img, .doc-canvas figure, .doc-canvas video {
        max-width: 100%;
        height: auto;
        display: block;
      }
      .doc-canvas figure { margin: 8px 0; }
      .doc-canvas .ProseMirror { outline: none; min-height: 100%; }`;

  // Total stack height: pageCount sheets stacked with gaps
  const stackHeight = pageCount * h + (pageCount - 1) * PAGE_GAP;

  return (
    <div
      ref={surfaceRef}
      className="flex flex-col items-center"
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
    >
      <style>{tableCss}</style>

      <div
        style={{
          position: "relative",
          width: w,
          height: stackHeight,
        }}
      >
        {/* 1. Page sheets (paper background + watermark + overlays + chrome) */}
        {Array.from({ length: pageCount }).map((_, pageIndex) => {
          const top = pageIndex * (h + PAGE_GAP);
          return (
            <div
              key={`sheet-${pageIndex}`}
              className="doc-canvas-sheet"
              style={{
                position: "absolute",
                top, left: 0,
                width: w, height: h,
                background: settings.pageColor ?? "#ffffff",
                boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                border: settings.pageBorder ? "2px solid #0f172a" : "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <WatermarkLayer settings={settings} w={w} />
              <OverlayLayerView items={overlays} layer="behind" pageIndex={pageIndex} />
              <PageChrome
                pageIndex={pageIndex}
                pageCount={pageCount}
                settings={settings}
                w={w} h={h} margin={margin}
                onHeaderChange={onHeaderChange}
                onFooterChange={onFooterChange}
                today={today}
              />
              <OverlayLayerView items={overlays} layer="front" pageIndex={pageIndex} />
            </div>
          );
        })}

        {/* 2. The single TipTap editor, positioned over the sheet stack.
              It spans the full stack height and is split visually by the opaque
              header/footer bands above. We add inner padding equal to innerTop
              so the content starts under page 1's header. */}
        <div
          ref={editorWrapRef}
          className="doc-canvas"
          style={{
            position: "absolute",
            top: innerTop,
            left: margin,
            width: innerWidth,
            // Allow growth past one page — the ResizeObserver will detect it
            // and add more sheets underneath.
            minHeight: innerHeight,
            columnCount: settings.columns > 1 ? settings.columns : undefined,
            columnGap: 32,
            zIndex: 2,
            // Don't clip — images and tall blocks must be visible across pages.
            overflow: "visible",
            color: "#0f172a",
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

export default PageCanvas;
