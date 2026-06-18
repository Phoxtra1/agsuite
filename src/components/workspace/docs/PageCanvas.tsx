import { EditorContent, type Editor } from "@tiptap/react";
import { useMemo, useRef, useEffect, useState } from "react";

export type PageSize = "A3" | "A4" | "A5" | "A6" | "Letter" | "Legal" | "Tabloid" | "Statement";
export type PageMargin = "narrow" | "normal" | "wide";
export type PageOrientation = "portrait" | "landscape";
export type ViewMode = "print" | "web" | "reading";

export type OverlayWrap = "inline" | "square" | "tight" | "behind" | "front";
export type OverlayLayer = "front" | "behind";
export type OverlayKind =
  | "shape"
  | "textbox"
  | "image"
  | "object"
  | "signature"
  | "signatureDraw";

export interface OverlayItem {
  id: string;
  kind: OverlayKind;
  page?: number;                 // 1-based; omitted = page 1
  x: number;                     // px from top-left of inner page
  y: number;
  w: number;
  h: number;
  rotation?: number;
  layer?: OverlayLayer;
  wrap?: OverlayWrap;
  zIndex?: number;

  // shape
  shape?: "rect" | "ellipse" | "line" | "arrow" | "triangle" | "star";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;

  // textbox / signature text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: "left" | "center" | "right";

  // image / object
  src?: string;
  alt?: string;

  // signatureDraw
  svgPath?: string;              // raw SVG <path d="..."> data
  viewBox?: string;              // e.g. "0 0 300 100"
}

export interface TextWatermark {
  text: string;
  color?: string;
  opacity?: number;
  angle?: number;
  fontSize?: number;
  fontWeight?: number;
}

export interface ImageWatermark {
  src: string;
  opacity?: number;
  scale?: number;       // 0..1 relative to page width
}

export interface PageSettings {
  size: PageSize;
  orientation: PageOrientation;
  margin: PageMargin;
  columns: number;
  watermark?: string;                   // legacy text watermark
  pageBorder?: boolean;
  mode: ViewMode;
  header?: string;
  footer?: string;

  // new
  customSize?: { w: number; h: number };
  customMargin?: number;
  pageColor?: string;
  textWatermark?: TextWatermark;
  imageWatermark?: ImageWatermark;
  showPageNumbers?: boolean;
  tableDefaults?: {
    borders?: boolean;
    borderColor?: string;
    borderWidth?: number;
    cellPadding?: number;
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

function OverlayLayerView({
  items,
  layer,
  pageIndex,
}: {
  items: OverlayItem[];
  layer: OverlayLayer;
  pageIndex: number;
}) {
  const filtered = items.filter(
    (o) => (o.layer ?? "front") === layer && ((o.page ?? 1) - 1) === pageIndex
  );
  if (!filtered.length) return null;
  return (
    <div
      aria-hidden={layer === "behind" ? true : undefined}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: layer === "behind" ? "none" : "auto",
        zIndex: layer === "behind" ? 0 : 5,
      }}
    >
      {filtered.map((o) => (
        <OverlayItemView key={o.id} item={o} />
      ))}
    </div>
  );
}

function OverlayItemView({ item }: { item: OverlayItem }) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: item.x,
    top: item.y,
    width: item.w,
    height: item.h,
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
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
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
        <div
          style={{
            ...base,
            padding: 6,
            border: item.kind === "textbox" ? "1px dashed #94a3b8" : "none",
            color: item.color ?? "#0f172a",
            fontFamily: item.fontFamily ?? "inherit",
            fontSize: item.fontSize ?? 14,
            textAlign: item.align ?? "left",
            background: item.fill ?? "transparent",
            overflow: "hidden",
            fontStyle: item.kind === "signature" ? "italic" : undefined,
          }}
        >
          {item.text}
        </div>
      );
    case "image":
    case "object":
      return (
        <img
          src={item.src}
          alt={item.alt ?? ""}
          style={{ ...base, objectFit: "contain" }}
          draggable={false}
        />
      );
    case "signatureDraw":
      return (
        <svg style={base} viewBox={item.viewBox ?? `0 0 ${item.w} ${item.h}`}>
          <path d={item.svgPath ?? ""} fill="none" stroke={item.color ?? "#0f172a"} strokeWidth={item.strokeWidth ?? 2} />
        </svg>
      );
  }
}

function WatermarkLayer({ settings, w }: { settings: PageSettings; w: number }) {
  return (
    <>
      {settings.imageWatermark?.src && (
        <div
          aria-hidden
          className="pointer-events-none select-none"
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 0,
          }}
        >
          <img
            src={settings.imageWatermark.src}
            alt=""
            style={{
              width: (settings.imageWatermark.scale ?? 0.6) * w,
              opacity: settings.imageWatermark.opacity ?? 0.08,
            }}
          />
        </div>
      )}
      {(settings.textWatermark?.text || settings.watermark) && (
        <div
          aria-hidden
          className="pointer-events-none select-none"
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `rotate(${settings.textWatermark?.angle ?? -30}deg)`,
            color: settings.textWatermark?.color ?? "rgba(15,23,42,0.07)",
            opacity: settings.textWatermark?.opacity ?? 1,
            fontSize: settings.textWatermark?.fontSize ?? 96,
            fontWeight: settings.textWatermark?.fontWeight ?? 800,
            letterSpacing: 4,
            zIndex: 0,
          }}
        >
          {settings.textWatermark?.text || settings.watermark}
        </div>
      )}
    </>
  );
}

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

  // Estimate page count from hard page-break markers in editor HTML
  const pageCount = useMemo(() => {
    if (!editor) return 1;
    const html = editor.getHTML();
    const matches = html.match(/data-page-break=("true"|true)|class="page-break"/g);
    return 1 + (matches?.length ?? 0);
  }, [editor, editor?.state]);

  if (settings.mode === "web") {
    return (
      <div
        ref={surfaceRef}
        className="doc-canvas mx-auto text-gray-900 rounded-lg shadow-sm border border-border"
        style={{ width: "min(960px, 100%)", padding: 48, background: settings.pageColor ?? "#ffffff" }}
      >
        <EditorContent editor={editor} />
      </div>
    );
  }

  const tableCss = settings.tableDefaults?.borders === false
    ? ``
    : `.doc-canvas table, .doc-canvas th, .doc-canvas td {
        border: ${settings.tableDefaults?.borderWidth ?? 1}px solid ${settings.tableDefaults?.borderColor ?? "#cbd5e1"};
        border-collapse: collapse;
        padding: ${settings.tableDefaults?.cellPadding ?? 6}px;
      }
      .doc-canvas table { width: 100%; table-layout: fixed; }`;

  return (
    <div ref={surfaceRef} className="flex flex-col items-center" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
      <style>{tableCss}</style>
      {Array.from({ length: pageCount }).map((_, pageIndex) => {
        const isFirst = pageIndex === 0;
        return (
          <div
            key={pageIndex}
            className="doc-canvas relative text-gray-900 shadow-xl mx-auto"
            style={{
              width: w,
              minHeight: h,
              padding: margin,
              marginBottom: 32,
              background: settings.pageColor ?? "#ffffff",
              boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
              border: settings.pageBorder ? "2px solid #0f172a" : "1px solid #e5e7eb",
              columnCount: settings.columns,
              columnGap: 32,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <WatermarkLayer settings={settings} w={w} />
            <OverlayLayerView items={overlays} layer="behind" pageIndex={pageIndex} />

            {/* Header band */}
            <div
              contentEditable={isFirst}
              suppressContentEditableWarning
              onBlur={(e) => isFirst && onHeaderChange?.(e.currentTarget.textContent || "")}
              className="text-[11px] text-gray-500 border-b border-gray-200 pb-1 mb-3 outline-none"
              style={{ marginTop: -margin / 2, position: "relative", zIndex: 2 }}
              data-placeholder="Header"
            >
              {applyTokens(settings.header || "", { page: pageIndex + 1, total: pageCount, date: today })}
            </div>

            {/* Editor only on first page; subsequent pages are layout placeholders for hard breaks */}
            <div style={{ position: "relative", zIndex: 1 }}>
              {isFirst ? <EditorContent editor={editor} /> : <div style={{ minHeight: 100 }} />}
            </div>

            <OverlayLayerView items={overlays} layer="front" pageIndex={pageIndex} />

            {/* Footer band */}
            <div
              contentEditable={isFirst}
              suppressContentEditableWarning
              onBlur={(e) => isFirst && onFooterChange?.(e.currentTarget.textContent || "")}
              className="text-[11px] text-gray-500 border-t border-gray-200 pt-1 mt-3 flex justify-between outline-none"
              style={{ marginBottom: -margin / 2, position: "absolute", left: margin, right: margin, bottom: margin / 2, zIndex: 2 }}
            >
              <span>
                {applyTokens(settings.footer || "", { page: pageIndex + 1, total: pageCount, date: today })}
              </span>
              {settings.showPageNumbers !== false && (
                <span>Page {pageIndex + 1} of {pageCount}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
