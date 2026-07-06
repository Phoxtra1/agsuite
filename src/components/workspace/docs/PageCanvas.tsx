import { EditorContent, type Editor } from "@tiptap/react";
import {
  useMemo,
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { toast } from "@/hooks/use-toast";

/* ================================================================== */
/* Types                                                              */
/* ================================================================== */

export type PageSize =
  | "A3" | "A4" | "A5" | "A6"
  | "Letter" | "Legal" | "Tabloid" | "Statement"
  | "Custom";

export type PageMargin = "narrow" | "normal" | "moderate" | "wide" | "custom";
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
  // Optional crop (normalized 0..1 of natural image dimensions)
  crop?: { x: number; y: number; w: number; h: number };
  align?: "left" | "center" | "right";
  shape?: "rect" | "ellipse" | "line" | "arrow" | "triangle" | "star";
  fill?: string; stroke?: string; strokeWidth?: number;
  text?: string; fontSize?: number; fontFamily?: string;
  color?: string;
  src?: string; alt?: string;
  svgPath?: string; viewBox?: string;
}

export interface TextWatermark {
  text: string; color?: string; opacity?: number;
  angle?: number; fontSize?: number; fontWeight?: number;
}
export interface ImageWatermark { src: string; opacity?: number; scale?: number; }

/** Per-side margins in px. When provided overrides preset margin. */
export interface CustomMargins {
  top: number; bottom: number; left: number; right: number;
}

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
  /** Legacy uniform margin (still honoured). Prefer `customMargins`. */
  customMargin?: number;
  customMargins?: CustomMargins;
  pageColor?: string;
  textWatermark?: TextWatermark;
  imageWatermark?: ImageWatermark;
  showPageNumbers?: boolean;
  /** "1,2,3" | "i,ii,iii" | "I,II,III" | "A,B,C" | "a,b,c" */
  pageNumberFormat?: "decimal" | "roman-lower" | "roman-upper" | "alpha-lower" | "alpha-upper";
  pageNumberStart?: number;
  /** Restrict watermark/header/footer to a page range (1-indexed, inclusive). */
  watermarkPages?: { from: number; to: number };
  headerPages?: { from: number; to: number };
  footerPages?: { from: number; to: number };
  /** Cover page: first page renders without header/footer/watermark. */
  coverPage?: boolean;
  /** Different first-page header/footer (Word-style). */
  differentFirstPage?: boolean;
  firstPageHeader?: string;
  firstPageFooter?: string;
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
  pageNumberFormat: "decimal",
  pageNumberStart: 1,
  coverPage: false,
  differentFirstPage: false,
  tableDefaults: { borders: true, borderColor: "#cbd5e1", borderWidth: 1, cellPadding: 6 },
};

/* ================================================================== */
/* Template presets (Amineva Intelligence)                            */
/* ================================================================== */

export type TemplateKey =
  | "businessProposal"
  | "pressRelease"
  | "companyProfile"
  | "letter"
  | "report"
  | "blank";

/**
 * Each template returns a *partial* PageSettings to merge into the document.
 * Templates configure the environment (size, margins, columns, header/footer,
 * page numbers) — text insertion is handled separately by the toolbar.
 */
export const TEMPLATE_PRESETS: Record<TemplateKey, Partial<PageSettings>> = {
  blank: {
    size: "A4", orientation: "portrait", margin: "normal", columns: 1,
    header: "", footer: "", showPageNumbers: true, coverPage: false,
  },
  businessProposal: {
    size: "A4", orientation: "portrait", margin: "wide", columns: 1,
    header: "Business Proposal",
    footer: "Confidential — {date}",
    showPageNumbers: true,
    coverPage: true,
    differentFirstPage: true,
    firstPageHeader: "",
    firstPageFooter: "",
  },
  pressRelease: {
    size: "Letter", orientation: "portrait", margin: "moderate", columns: 1,
    header: "FOR IMMEDIATE RELEASE",
    footer: "Page {pageNumber} of {totalPages}",
    showPageNumbers: false, // header carries identity; footer formats inline
  },
  companyProfile: {
    size: "A4", orientation: "portrait", margin: "normal", columns: 2,
    header: "Company Profile",
    footer: "{date} · Page {pageNumber}",
    showPageNumbers: false,
    coverPage: true,
    differentFirstPage: true,
  },
  letter: {
    size: "Letter", orientation: "portrait", margin: "wide", columns: 1,
    header: "", footer: "", showPageNumbers: false,
  },
  report: {
    size: "A4", orientation: "portrait", margin: "normal", columns: 1,
    header: "{date}",
    footer: "Page {pageNumber} of {totalPages}",
    showPageNumbers: true,
    coverPage: true,
    differentFirstPage: true,
    pageNumberFormat: "decimal",
  },
};

export function applyTemplate(
  current: PageSettings,
  key: TemplateKey,
): PageSettings {
  return { ...current, ...TEMPLATE_PRESETS[key] };
}

/* ================================================================== */
/* Constants                                                          */
/* ================================================================== */

const SIZES: Record<Exclude<PageSize, "Custom">, [number, number]> = {
  A3: [1123, 1587], A4: [794, 1123], A5: [559, 794], A6: [397, 559],
  Letter: [816, 1056], Legal: [816, 1344], Tabloid: [1056, 1632], Statement: [528, 816],
};

const MARGIN_PRESETS: Record<Exclude<PageMargin, "custom">, number> = {
  narrow: 32,
  normal: 64,
  moderate: 80,
  wide: 96,
};

const HEADER_BAND = 36;
const FOOTER_BAND = 36;
const PAGE_GAP = 24;

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

function resolveSize(s: PageSettings): [number, number] {
  if (s.size === "Custom" && s.customSize?.w && s.customSize?.h) {
    return [s.customSize.w, s.customSize.h];
  }
  // Back-compat: customSize was previously honoured for any size
  if (s.customSize?.w && s.customSize?.h && s.size === "Custom") {
    return [s.customSize.w, s.customSize.h];
  }
  const key = (s.size === "Custom" ? "A4" : s.size) as Exclude<PageSize, "Custom">;
  let [w, h] = SIZES[key];
  if (s.orientation === "landscape") [w, h] = [h, w];
  return [w, h];
}

function resolveMargins(s: PageSettings): CustomMargins {
  // Highest priority: per-side custom margins
  if (s.margin === "custom" && s.customMargins) return s.customMargins;
  // Legacy uniform custom margin
  if (typeof s.customMargin === "number") {
    const m = s.customMargin;
    return { top: m, bottom: m, left: m, right: m };
  }
  const m = MARGIN_PRESETS[s.margin as Exclude<PageMargin, "custom">] ?? MARGIN_PRESETS.normal;
  return { top: m, bottom: m, left: m, right: m };
}

function toRoman(n: number, upper = true): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "", x = Math.max(1, Math.floor(n));
  for (const [v, s] of map) { while (x >= v) { out += s; x -= v; } }
  return upper ? out : out.toLowerCase();
}
function toAlpha(n: number, upper = true): string {
  // 1 -> A, 26 -> Z, 27 -> AA
  let x = Math.max(1, Math.floor(n)), s = "";
  while (x > 0) { const r = (x - 1) % 26; s = String.fromCharCode(65 + r) + s; x = Math.floor((x - 1) / 26); }
  return upper ? s : s.toLowerCase();
}
function formatPageNumber(n: number, fmt: PageSettings["pageNumberFormat"]): string {
  switch (fmt) {
    case "roman-upper": return toRoman(n, true);
    case "roman-lower": return toRoman(n, false);
    case "alpha-upper": return toAlpha(n, true);
    case "alpha-lower": return toAlpha(n, false);
    default: return String(n);
  }
}

function applyTokens(
  tpl: string,
  ctx: { page: string; total: string; date: string },
) {
  return (tpl || "")
    .replace(/\{pageNumber\}/g, ctx.page)
    .replace(/\{totalPages\}/g, ctx.total)
    .replace(/\{date\}/g, ctx.date);
}

function inRange(page1Indexed: number, range?: { from: number; to: number }) {
  if (!range) return true;
  return page1Indexed >= range.from && page1Indexed <= range.to;
}

/* ================================================================== */
/* Overlay z-order helpers (pure)                                     */
/* ================================================================== */

export function bringForward(items: OverlayItem[], id: string): OverlayItem[] {
  return items.map((o) => o.id === id ? { ...o, zIndex: (o.zIndex ?? 1) + 1 } : o);
}
export function sendBackward(items: OverlayItem[], id: string): OverlayItem[] {
  return items.map((o) => o.id === id ? { ...o, zIndex: Math.max(0, (o.zIndex ?? 1) - 1) } : o);
}
export function bringToFront(items: OverlayItem[], id: string): OverlayItem[] {
  const max = items.reduce((m, o) => Math.max(m, o.zIndex ?? 1), 1);
  return items.map((o) => o.id === id ? { ...o, zIndex: max + 1, layer: "front" } : o);
}
export function sendToBack(items: OverlayItem[], id: string): OverlayItem[] {
  const min = items.reduce((m, o) => Math.min(m, o.zIndex ?? 1), 1);
  return items.map((o) => o.id === id ? { ...o, zIndex: Math.max(0, min - 1), layer: "behind" } : o);
}

/* ================================================================== */
/* Overlay rendering                                                  */
/* ================================================================== */

function OverlayLayerView({
  items, layer, pageIndex, onChange, selectedId, onSelect,
}: {
  items: OverlayItem[];
  layer: OverlayLayer;
  pageIndex: number;
  onChange?: (items: OverlayItem[]) => void;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const filtered = items.filter(
    (o) => (o.layer ?? "front") === layer && ((o.page ?? 1) - 1) === pageIndex,
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
        <OverlayItemView
          key={o.id}
          item={o}
          selected={selectedId === o.id}
          onSelect={() => onSelect?.(o.id)}
          onChange={(patch) =>
            onChange?.(items.map((x) => (x.id === o.id ? { ...x, ...patch } : x)))
          }
        />
      ))}
    </div>
  );
}

function OverlayItemView({
  item,
  selected,
  onSelect,
  onChange,
}: {
  item: OverlayItem;
  selected?: boolean;
  onSelect?: () => void;
  onChange?: (patch: Partial<OverlayItem>) => void;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: item.x, top: item.y, width: item.w, height: item.h,
    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
    zIndex: item.zIndex,
    outline: selected ? "2px solid #2563eb" : undefined,
    cursor: "move",
  };

  // Drag-to-move (only when onChange supplied — editor mode)
  const onMouseDown = (e: React.MouseEvent) => {
    if (!onChange) return;
    e.stopPropagation();
    onSelect?.();
    const startX = e.clientX, startY = e.clientY;
    const ox = item.x, oy = item.y;
    const move = (ev: MouseEvent) =>
      onChange({ x: ox + (ev.clientX - startX), y: oy + (ev.clientY - startY) });
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Resize handle (bottom-right)
  const ResizeHandle = onChange && selected ? (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        const sx = e.clientX, sy = e.clientY;
        const ow = item.w, oh = item.h;
        const move = (ev: MouseEvent) =>
          onChange({ w: Math.max(20, ow + (ev.clientX - sx)), h: Math.max(20, oh + (ev.clientY - sy)) });
        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
      }}
      style={{
        position: "absolute", right: -6, bottom: -6, width: 12, height: 12,
        background: "#2563eb", borderRadius: 2, cursor: "nwse-resize", zIndex: 10,
      }}
    />
  ) : null;

  switch (item.kind) {
    case "shape": {
      const stroke = item.stroke ?? "#0f172a";
      const sw = item.strokeWidth ?? 2;
      const fill = item.fill ?? "transparent";
      return (
        <div style={base} onMouseDown={onMouseDown}>
          <svg width="100%" height="100%" viewBox={`0 0 ${item.w} ${item.h}`}>
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
          {ResizeHandle}
        </div>
      );
    }
    case "textbox":
    case "signature":
      return (
        <div
          onMouseDown={onMouseDown}
          style={{
            ...base, padding: 6,
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
          {ResizeHandle}
        </div>
      );
    case "image":
    case "object": {
      // Crop via clip-path inset on a wrapping div; image scaled to overlay box.
      const clip = item.crop
        ? `inset(${item.crop.y * 100}% ${(1 - item.crop.x - item.crop.w) * 100}% ${(1 - item.crop.y - item.crop.h) * 100}% ${item.crop.x * 100}%)`
        : undefined;
      return (
        <div style={base} onMouseDown={onMouseDown}>
          <img
            src={item.src}
            alt={item.alt ?? ""}
            draggable={false}
            style={{
              width: "100%", height: "100%", objectFit: "contain",
              clipPath: clip,
              userSelect: "none",
            }}
          />
          {ResizeHandle}
        </div>
      );
    }
    case "signatureDraw":
      return (
        <div style={base} onMouseDown={onMouseDown}>
          <svg width="100%" height="100%" viewBox={item.viewBox ?? `0 0 ${item.w} ${item.h}`}>
            <path d={item.svgPath ?? ""} fill="none"
                  stroke={item.color ?? "#0f172a"} strokeWidth={item.strokeWidth ?? 2} />
          </svg>
          {ResizeHandle}
        </div>
      );
  }
}

/* ================================================================== */
/* Watermark                                                          */
/* ================================================================== */

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

/* ================================================================== */
/* Page chrome (header / footer)                                      */
/* ================================================================== */

function PageChrome({
  pageIndex, pageCount, settings, margins,
  onHeaderChange, onFooterChange, today,
}: {
  pageIndex: number;
  pageCount: number;
  settings: PageSettings;
  margins: CustomMargins;
  onHeaderChange?: (s: string) => void;
  onFooterChange?: (s: string) => void;
  today: string;
}) {
  const pageOneIndexed = pageIndex + 1;
  const isFirst = pageIndex === 0;
  const isCover = settings.coverPage && isFirst;

  // Cover page intentionally renders no chrome.
  if (isCover) return null;

  const showHeader = inRange(pageOneIndexed, settings.headerPages);
  const showFooter = inRange(pageOneIndexed, settings.footerPages);

  const headerText = settings.differentFirstPage && isFirst
    ? (settings.firstPageHeader ?? "")
    : (settings.header ?? "");
  const footerText = settings.differentFirstPage && isFirst
    ? (settings.firstPageFooter ?? "")
    : (settings.footer ?? "");

  const pageNumDisplay = formatPageNumber(
    (settings.pageNumberStart ?? 1) + pageIndex - (settings.coverPage ? 1 : 0),
    settings.pageNumberFormat,
  );
  const totalDisplay = formatPageNumber(
    pageCount - (settings.coverPage ? 1 : 0),
    settings.pageNumberFormat,
  );
  const ctx = { page: pageNumDisplay, total: totalDisplay, date: today };

  // Only first non-cover page is editable for header/footer (matches Word behaviour
  // where edits to the master header propagate). isEditableHere == on the first
  // page that actually renders chrome.
  const isEditableHere = pageIndex === (settings.coverPage ? 1 : 0);

  return (
    <>
      {showHeader && (
        <div
          contentEditable={isEditableHere}
          suppressContentEditableWarning
          onBlur={(e) => isEditableHere && onHeaderChange?.(e.currentTarget.textContent || "")}
          className="text-[11px] text-gray-500 outline-none"
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: HEADER_BAND,
            padding: `8px ${margins.right}px 4px ${margins.left}px`,
            borderBottom: "1px solid #e5e7eb",
            background: settings.pageColor ?? "#ffffff",
            zIndex: 3,
            display: "flex", alignItems: "center",
          }}
          data-placeholder={isEditableHere ? "Click to edit header" : undefined}
        >
          {applyTokens(headerText, ctx)}
        </div>
      )}

      {showFooter && (
        <div
          contentEditable={isEditableHere}
          suppressContentEditableWarning
          onBlur={(e) => isEditableHere && onFooterChange?.(e.currentTarget.textContent || "")}
          className="text-[11px] text-gray-500 outline-none"
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: FOOTER_BAND,
            padding: `4px ${margins.right}px 8px ${margins.left}px`,
            borderTop: "1px solid #e5e7eb",
            background: settings.pageColor ?? "#ffffff",
            zIndex: 3,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16,
          }}
          data-placeholder={isEditableHere ? "Click to edit footer" : undefined}
        >
          <span>{applyTokens(footerText, ctx)}</span>
          {settings.showPageNumbers !== false && (
            <span>Page {pageNumDisplay} of {totalDisplay}</span>
          )}
        </div>
      )}
    </>
  );
}

/* ================================================================== */
/* Main canvas                                                        */
/* ================================================================== */

export interface PageCanvasProps {
  editor: Editor | null;
  settings: PageSettings;
  zoom: number;
  surfaceRef?: React.RefObject<HTMLDivElement>;
  onHeaderChange?: (s: string) => void;
  onFooterChange?: (s: string) => void;
  overlays?: OverlayItem[];
  /** When provided, overlays become editable (drag / resize). */
  onOverlaysChange?: (items: OverlayItem[]) => void;
  /** Bubble selected overlay id up so the toolbar can show object controls. */
  selectedOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
  /** Receives the live pageCount so the host can hide its own counter. */
  onPageCountChange?: (count: number) => void;
}

export function PageCanvas({
  editor,
  settings,
  zoom,
  surfaceRef,
  onHeaderChange,
  onFooterChange,
  overlays = [],
  onOverlaysChange,
  selectedOverlayId,
  onSelectOverlay,
  onPageCountChange,
}: PageCanvasProps) {
  const [w, h] = resolveSize(settings);
  const margins = resolveMargins(settings);
  const today = new Date().toLocaleDateString();

  const innerTop = HEADER_BAND + margins.top / 2;
  const innerBottom = FOOTER_BAND + margins.bottom / 2;
  const innerHeight = Math.max(120, h - innerTop - innerBottom);
  const innerWidth = w - margins.left - margins.right;

  /* ---- Measure editor content for auto-pagination ------------------ */

  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(innerHeight);

  useLayoutEffect(() => {
    if (!editorWrapRef.current) return;
    const el = editorWrapRef.current;
    const measure = () => {
      const next = el.scrollHeight;
      setContentHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const onUpdate = () => requestAnimationFrame(measure);
    editor?.on("update", onUpdate);
    editor?.on("transaction", onUpdate);
    return () => {
      ro.disconnect();
      editor?.off("update", onUpdate);
      editor?.off("transaction", onUpdate);
    };
  }, [editor, innerHeight, innerWidth]);

  /* ---- Push blocks that cross a page boundary to the next page ---- */
  useLayoutEffect(() => {
    if (!editorWrapRef.current || settings.mode !== "print") return;
    const wrap = editorWrapRef.current;
    const pmRoot = wrap.querySelector<HTMLElement>(".ProseMirror");
    if (!pmRoot) return;
    const pageStep = innerHeight + PAGE_GAP + (HEADER_BAND + FOOTER_BAND + margins.top / 2 + margins.bottom / 2);

    const rebalance = () => {
      const children = Array.from(pmRoot.children) as HTMLElement[];
      children.forEach((c) => (c.style.marginTop = c.dataset._origMt || ""));
      let cursor = 0; // vertical position within editor wrap
      for (const child of children) {
        // Skip forced page breaks
        if (child.hasAttribute("data-page-break") || child.classList.contains("page-break")) {
          const currentPage = Math.floor(cursor / pageStep);
          cursor = (currentPage + 1) * pageStep;
          continue;
        }
        const h = child.getBoundingClientRect().height;
        const currentPage = Math.floor(cursor / pageStep);
        const pageBottom = (currentPage + 1) * innerHeight + currentPage * (pageStep - innerHeight);
        if (h > innerHeight) { cursor += h; continue; } // block larger than a page, let it overflow
        if (cursor + h > pageBottom) {
          const push = (currentPage + 1) * pageStep - cursor;
          child.dataset._origMt = child.style.marginTop || "";
          child.style.marginTop = `${push + (parseFloat(getComputedStyle(child).marginTop) || 0)}px`;
          cursor += push + h;
        } else {
          cursor += h;
        }
      }
    };
    rebalance();
    const ro = new ResizeObserver(rebalance);
    ro.observe(pmRoot);
    const onUpdate = () => requestAnimationFrame(rebalance);
    editor?.on("update", onUpdate);
    editor?.on("transaction", onUpdate);
    return () => {
      ro.disconnect();
      editor?.off("update", onUpdate);
      editor?.off("transaction", onUpdate);
    };
  }, [editor, innerHeight, settings.mode, margins.top, margins.bottom]);

  // Hard page breaks: `<div data-page-break></div>` OR `.page-break`.
  const hardBreaks = useMemo(() => {
    if (!editor) return 0;
    const html = editor.getHTML();
    const m = html.match(/data-page-break|class="[^"]*page-break/g);
    return m?.length ?? 0;
  }, [editor, editor?.state]);

  const overflowPages = Math.max(1, Math.ceil(contentHeight / innerHeight));
  const contentPages = Math.max(overflowPages, hardBreaks + 1);
  // Cover page is its own physical sheet, prepended to content pages.
  const pageCount = contentPages + (settings.coverPage ? 1 : 0);

  // Notify host so it can suppress any legacy external page counter.
  useEffect(() => { onPageCountChange?.(pageCount); }, [pageCount, onPageCountChange]);

  /* ---- Web (flat) mode --------------------------------------------- */

  if (settings.mode === "web") {
    return (
      <div
        ref={surfaceRef}
        className="doc-canvas mx-auto text-gray-900 rounded-lg shadow-sm border border-border"
        style={{
          width: "min(960px, 100%)",
          padding: 48,
          background: settings.pageColor ?? "#ffffff",
        }}
      >
        <EditorContent editor={editor} />
      </div>
    );
  }

  /* ---- Print mode -------------------------------------------------- */

  const tableCss = settings.tableDefaults?.borders === false
    ? ``
    : `.doc-canvas table, .doc-canvas th, .doc-canvas td {
        border: ${settings.tableDefaults?.borderWidth ?? 1}px solid ${settings.tableDefaults?.borderColor ?? "#cbd5e1"};
        border-collapse: collapse;
        padding: ${settings.tableDefaults?.cellPadding ?? 6}px;
      }
      .doc-canvas table { width: 100%; table-layout: fixed; }
      .doc-canvas img, .doc-canvas figure, .doc-canvas video {
        max-width: 100%;
        height: auto;
        display: block;
      }
      .doc-canvas figure { margin: 8px 0; }
      .doc-canvas .ProseMirror { outline: none; min-height: 100%; }
      /* Prevent block content from straddling the page border — jump to next */
      .doc-canvas .ProseMirror > * {
        break-inside: avoid-page;
        page-break-inside: avoid;
        orphans: 3;
        widows: 3;
      }
      .doc-canvas .ProseMirror h1,
      .doc-canvas .ProseMirror h2,
      .doc-canvas .ProseMirror h3 {
        break-after: avoid-page;
        page-break-after: avoid;
      }
      .doc-canvas .page-break, .doc-canvas [data-page-break] {
        break-after: page;
        page-break-after: always;
        border: 0;
        height: 0;
        margin: 0;
      }
      /* Image wrap support inside the editor */
      .doc-canvas img[data-wrap="square"], .doc-canvas figure[data-wrap="square"] { float: left; margin: 0 12px 8px 0; }
      .doc-canvas img[data-wrap="tight"],  .doc-canvas figure[data-wrap="tight"]  { float: right; margin: 0 0 8px 12px; shape-outside: margin-box; }
      .doc-canvas img[data-wrap="behind"], .doc-canvas figure[data-wrap="behind"] { position: relative; z-index: -1; opacity: .85; }
      .doc-canvas img[data-wrap="front"],  .doc-canvas figure[data-wrap="front"]  { position: relative; z-index: 10; }`;

  const stackHeight = pageCount * h + (pageCount - 1) * PAGE_GAP;

  // When a cover page is active, the editor content visually starts on the
  // second physical sheet — offset its absolute top accordingly.
  const editorTopOffset = (settings.coverPage ? (h + PAGE_GAP) : 0) + innerTop;

  return (
    <div
      ref={surfaceRef}
      className="flex flex-col items-center"
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
      onMouseDown={() => onSelectOverlay?.(null)}
    >
      <style>{tableCss}
        {`@media print {
          @page { size: ${w}px ${h}px; margin: 0; }
          .doc-page-frame { break-after: page; box-shadow: none !important; border: 0 !important; }
        }`}
      </style>

      {/* Multi-page stack: one white sheet frame per page, each with its own chrome */}
      <div
        className="relative"
        style={{ width: w, height: stackHeight, margin: "0 auto" }}
      >
        {Array.from({ length: pageCount }).map((_, i) => {
          const isLast = i === pageCount - 1;
          // A page is "empty" if it's a trailing physical page beyond content —
          // safe to delete when content stops before this page starts.
          const pageTop = i * innerHeight;
          const isEmptyPage = isLast && (contentHeight <= pageTop + 8) && pageCount > 1;
          const isCover = settings.coverPage && i === 0;

          const insertBreakHere = () => {
            if (!editor) return;
            editor.chain().focus().insertContent('<div data-page-break></div><p></p>').run();
            toast({ title: "Page break inserted" });
          };
          const deleteEmptyPage = () => {
            if (!editor || !isEmptyPage) return;
            // Strip trailing page-break markers and empty paragraphs from the doc HTML.
            const html = editor.getHTML()
              .replace(/(<p>(\s|&nbsp;|<br\s*\/?\s*>)*<\/p>\s*)+$/i, "")
              .replace(/(<div[^>]*data-page-break[^>]*><\/div>\s*)+$/i, "")
              .replace(/(<hr[^>]*class="[^"]*page-break[^"]*"[^>]*\/?>\s*)+$/i, "");
            editor.commands.setContent(html, false);
            toast({ title: "Empty page removed" });
          };
          const copyPageText = async () => {
            const wrap = editorWrapRef.current;
            if (!wrap) return;
            const pmRoot = wrap.querySelector<HTMLElement>(".ProseMirror");
            if (!pmRoot) return;
            const startY = i * innerHeight;
            const endY = (i + 1) * innerHeight;
            const wrapTop = wrap.getBoundingClientRect().top;
            const parts: string[] = [];
            for (const child of Array.from(pmRoot.children) as HTMLElement[]) {
              const r = child.getBoundingClientRect();
              const top = r.top - wrapTop;
              if (top + r.height >= startY && top < endY) parts.push(child.innerText || "");
            }
            const text = parts.join("\n").trim();
            if (!text) { toast({ title: "This page is empty" }); return; }
            try { await navigator.clipboard.writeText(text); toast({ title: "Page text copied" }); }
            catch { toast({ title: "Copy failed", variant: "destructive" as any }); }
          };

          return (
          <ContextMenu key={i}>
            <ContextMenuTrigger asChild>
              <div
                className="doc-page-frame absolute"
                style={{
                  top: i * (h + PAGE_GAP),
                  left: 0,
                  width: w,
                  height: h,
                  background: settings.pageColor ?? "#ffffff",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                  border: settings.pageBorder ? "2px solid #0f172a" : "1px solid #e5e7eb",
                  overflow: "hidden",
                  color: "#0f172a",
                }}
              >
                {inRange(i + 1, settings.watermarkPages) && !(settings.coverPage && i === 0) && (
                  <WatermarkLayer settings={settings} w={w} />
                )}
                <OverlayLayerView items={overlays} layer="behind" pageIndex={i}
                  onChange={onOverlaysChange} selectedId={selectedOverlayId} onSelect={onSelectOverlay} />
                <PageChrome pageIndex={i} pageCount={pageCount} settings={settings} margins={margins}
                  onHeaderChange={onHeaderChange} onFooterChange={onFooterChange} today={today} />
                <OverlayLayerView items={overlays} layer="front" pageIndex={i}
                  onChange={onOverlaysChange} selectedId={selectedOverlayId} onSelect={onSelectOverlay} />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Page {i + 1} of {pageCount}{isCover ? " · Cover" : ""}
              </div>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={insertBreakHere}>
                Insert page break here
              </ContextMenuItem>
              <ContextMenuItem onSelect={copyPageText}>
                Copy page text
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => window.print()}>
                Print… <ContextMenuShortcut>Ctrl+P</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={!isEmptyPage}
                onSelect={deleteEmptyPage}
                className={isEmptyPage ? "text-destructive focus:text-destructive" : ""}
              >
                {isEmptyPage ? "Delete this empty page" : "Delete page (only when empty)"}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          );
        })}

        {/* Single continuous editor overlay flowing across the page stack.
            Page chrome (header/footer) sits at z-index 3 with solid background
            to mask any content that lands in the header/footer bands. */}
        <div
          ref={editorWrapRef}
          className="doc-canvas absolute"
          style={{
            top: editorTopOffset,
            left: margins.left,
            width: innerWidth,
            zIndex: 2,
            columnCount: settings.columns > 1 ? settings.columns : undefined,
            columnGap: 32,
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
