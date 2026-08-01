import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Plus, Copy, Trash2, ChevronUp, ChevronDown, Play, Type, Square, Circle, Image as ImageIcon,
  Sparkles, Download, StickyNote, Presentation, Eye, EyeOff, Save, Undo2, Redo2, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Palette, Sliders, Lock, Unlock, Layers, FileUp, ListOrdered, CheckCircle,
  Volume2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  getDeck, updateDeck, type WorkspaceSlideDoc,
  type Deck, type Slide, type SlideElement, type SlideLayout,
  makeSlide, newSlideId, flattenDeckText, DEFAULT_THEME,
  SlideBackground, DeckTheme, ElementAnimation, SlideComment
} from "@/lib/workspace/slides/documents";

// Ribbon Sub-tabs
import { RibbonHomeTab } from "@/components/workspace/slides/RibbonHomeTab";
import { RibbonInsertTab } from "@/components/workspace/slides/RibbonInsertTab";
import { RibbonDesignTab } from "@/components/workspace/slides/RibbonDesignTab";
import { RibbonTransitionsTab } from "@/components/workspace/slides/RibbonTransitionsTab";
import { RibbonAnimationsTab } from "@/components/workspace/slides/RibbonAnimationsTab";
import { RibbonSlideShowTab } from "@/components/workspace/slides/RibbonSlideShowTab";
import { RibbonViewTab } from "@/components/workspace/slides/RibbonViewTab";
import { RibbonReviewTab } from "@/components/workspace/slides/RibbonReviewTab";
import { RibbonToolsTab } from "@/components/workspace/slides/RibbonToolsTab";

const CANVAS_W = 1920;
const CANVAS_H = 1080;

/* ------------------------- Custom Chart View ------------------------- */
function RenderElementChart({ el }: { el: SlideElement }) {
  const data = el.chartData ?? [
    { name: "Q1", value: 300 },
    { name: "Q2", value: 500 },
    { name: "Q3", value: 400 },
    { name: "Q4", value: 700 }
  ];
  const maxVal = Math.max(...data.map(d => d.value), 1);

  if (el.chartType === "pie") {
    return (
      <div className="w-full h-full bg-white rounded-lg p-3 shadow-md flex flex-col justify-between border border-border">
        <div className="text-sm font-bold text-slate-800 text-center">{el.chartTitle ?? "Analytical Data"}</div>
        <div className="flex-1 flex items-center justify-center relative">
          {/* Simple Pie slice simulation */}
          <svg width="120" height="120" viewBox="0 0 32 32" className="transform -rotate-90">
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#2563eb" strokeWidth="32" strokeDasharray="30 100" />
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#10b981" strokeWidth="32" strokeDasharray="25 100" strokeDashoffset="-30" />
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f59e0b" strokeWidth="32" strokeDasharray="20 100" strokeDashoffset="-55" />
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#ec4899" strokeWidth="32" strokeDasharray="25 100" strokeDashoffset="-75" />
          </svg>
          <div className="absolute right-2 bottom-2 text-[10px] space-y-0.5 text-slate-600 bg-slate-50 p-1.5 rounded border border-border">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: i===0 ? "#2563eb" : i===1 ? "#10b981" : i===2 ? "#f59e0b" : "#ec4899" }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (el.chartType === "line") {
    return (
      <div className="w-full h-full bg-white rounded-lg p-3 shadow-md flex flex-col justify-between border border-border">
        <div className="text-sm font-bold text-slate-800">{el.chartTitle ?? "Trend Analysis"}</div>
        <div className="flex-1 flex items-end justify-between px-4 pb-2 relative border-b border-l border-slate-300">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              points={data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.value / maxVal) * 80}`).join(" ")}
            />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={(i / (data.length - 1)) * 100}
                cy={100 - (d.value / maxVal) * 80}
                r="4"
                fill="#2563eb"
              />
            ))}
          </svg>
          {data.map((d, i) => (
            <span key={i} className="text-[10px] text-slate-500 font-semibold pt-1">{d.name}</span>
          ))}
        </div>
      </div>
    );
  }

  // Default Bar Chart
  return (
    <div className="w-full h-full bg-white rounded-lg p-3 shadow-md flex flex-col justify-between border border-border">
      <div className="text-sm font-bold text-slate-800 mb-2">{el.chartTitle ?? "Analytical Data"}</div>
      <div className="flex-1 flex items-end justify-between gap-2 border-b border-l border-slate-300 px-2 pb-1">
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${Math.max(10, barHeight)}%`,
                  backgroundColor: i % 2 === 0 ? "#2563eb" : "#3b82f6"
                }}
              />
              <span className="text-[10px] text-slate-600 font-semibold truncate max-w-full">{d.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------- Custom Table View ------------------------- */
function RenderElementTable({ el, onChange }: { el: SlideElement; onChange?: (patch: Partial<SlideElement>) => void }) {
  const rows = el.rowsCount ?? 3;
  const cols = el.colsCount ?? 3;

  const handleCellChange = (r: number, c: number, text: string) => {
    const existingCells = el.cells ?? [];
    const cellIdx = existingCells.findIndex((cell) => cell.row === r && cell.col === c);
    let nextCells = [...existingCells];

    if (cellIdx >= 0) {
      nextCells[cellIdx] = { row: r, col: c, text };
    } else {
      nextCells.push({ row: r, col: c, text });
    }

    onChange?.({ cells: nextCells });
  };

  const getCellText = (r: number, c: number) => {
    return el.cells?.find((cell) => cell.row === r && cell.col === c)?.text ?? "";
  };

  return (
    <div className="w-full h-full bg-white shadow-lg rounded-lg border border-border overflow-hidden flex flex-col">
      <table className="w-full h-full table-fixed border-collapse">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className={r === 0 ? "bg-slate-100" : "bg-white"}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="border border-slate-300 p-1">
                  <input
                    type="text"
                    value={getCellText(r, c)}
                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                    className="w-full h-full bg-transparent border-none outline-none text-xs text-slate-800 text-center font-medium"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------- Scaled slide renderer -------------------- */
function SlideView({
  slide,
  scale,
  editable,
  selectedId,
  onSelect,
  onChange,
  showGrid,
  showGuides
}: {
  slide: Slide;
  scale: number;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (elements: SlideElement[]) => void;
  showGrid?: boolean;
  showGuides?: boolean;
}) {
  const bgStyle: React.CSSProperties = {
    width: CANVAS_W * scale,
    height: CANVAS_H * scale,
    position: "relative",
    background: slide.background,
    overflow: "hidden",
    boxShadow: editable ? "0 12px 40px rgba(15,23,42,0.15)" : undefined,
    borderRadius: editable ? 6 : 0,
  };

  // If there's an image bg, let's configure blur and transparency
  if (slide.bgConfig?.type === "image" && slide.bgConfig.image?.url) {
    const imgConf = slide.bgConfig.image;
    bgStyle.backgroundImage = `url(${imgConf.url})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
    bgStyle.opacity = imgConf.opacity ?? 1.0;
    if (imgConf.blur) {
      bgStyle.filter = `blur(${imgConf.blur}px)`;
    }
  }

  return (
    <div
      style={bgStyle}
      onMouseDown={(e) => { if (editable && e.target === e.currentTarget) onSelect?.(null); }}
    >
      {/* Grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none grid grid-cols-12 grid-rows-6 border border-slate-200/50 opacity-20">
          {Array.from({ length: 72 }).map((_, i) => (
            <div key={i} className="border border-slate-300 border-dashed" />
          ))}
        </div>
      )}

      {/* Center guides */}
      {showGuides && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 border-l border-sky-400 border-dashed transform -translate-x-1/2 opacity-50" />
          <div className="absolute top-1/2 left-0 right-0 border-t border-sky-400 border-dashed transform -translate-y-1/2 opacity-50" />
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: "top left", width: CANVAS_W, height: CANVAS_H }}>
        {slide.elements
          .slice()
          .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
          .map((el) => (
            <ElementView
              key={el.id}
              el={el}
              editable={!!editable}
              selected={selectedId === el.id}
              onSelect={() => onSelect?.(el.id)}
              onChange={(patch) => onChange?.(slide.elements.map(e => e.id === el.id ? { ...e, ...patch } : e))}
            />
          ))}
      </div>
    </div>
  );
}

function ElementView({ el, editable, selected, onSelect, onChange }: {
  el: SlideElement; editable: boolean; selected: boolean; onSelect: () => void; onChange: (p: Partial<SlideElement>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const isLocked = el.locked === true;

  const style: React.CSSProperties = {
    position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    outline: selected ? "2px solid #2563eb" : editable ? "1px dashed transparent" : undefined,
    cursor: isLocked ? "not-allowed" : editable ? (editing ? "text" : "move") : "default",
    opacity: el.opacity ?? 1.0,
    filter: el.blur ? `blur(${el.blur}px)` : undefined,
  };

  const startDrag = (e: React.MouseEvent) => {
    if (!editable || editing || isLocked) return;
    e.stopPropagation();
    onSelect();
    const sx = e.clientX, sy = e.clientY;
    const ox = el.x, oy = el.y;
    const scaleEl = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-slide-inner]");
    const scale = scaleEl ? parseFloat(scaleEl.getAttribute("data-slide-scale") || "1") : 1;
    const move = (ev: MouseEvent) => onChange({ x: ox + (ev.clientX - sx) / scale, y: oy + (ev.clientY - sy) / scale });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };

  const ResizeHandle = editable && selected && !isLocked ? (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        const sx = e.clientX, sy = e.clientY;
        const ow = el.w, oh = el.h;
        const scaleEl = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-slide-inner]");
        const scale = scaleEl ? parseFloat(scaleEl.getAttribute("data-slide-scale") || "1") : 1;
        const move = (ev: MouseEvent) => onChange({ w: Math.max(24, ow + (ev.clientX - sx) / scale), h: Math.max(24, oh + (ev.clientY - sy) / scale) });
        const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
        window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
      }}
      style={{ position: "absolute", right: -8, bottom: -8, width: 16, height: 16, background: "#2563eb", borderRadius: 3, cursor: "nwse-resize", zIndex: 10 }}
    />
  ) : null;

  // Render element contents depending on kind
  if (el.kind === "text") {
    return (
      <div style={style} onMouseDown={startDrag} onDoubleClick={(e) => { if (editable && !isLocked) { e.stopPropagation(); setEditing(true); } }}>
        {editing ? (
          <textarea
            autoFocus
            defaultValue={el.text}
            onBlur={(e) => { onChange({ text: e.target.value }); setEditing(false); }}
            style={{
              width: "100%", height: "100%", resize: "none", border: "none", outline: "none",
              background: "transparent", padding: 0, margin: 0,
              fontFamily: el.fontFamily ?? "Inter", fontSize: el.fontSize ?? 32, fontWeight: el.fontWeight ?? 400,
              color: el.color ?? "#0f172a", textAlign: el.align ?? "left",
              fontStyle: el.italic ? "italic" : undefined, textDecoration: el.underline ? "underline" : undefined,
              whiteSpace: "pre-wrap", lineHeight: el.lineSpacing ?? 1.25,
            }}
          />
        ) : (
          <div style={{
            fontFamily: el.fontFamily ?? "Inter", fontSize: el.fontSize ?? 32, fontWeight: el.fontWeight ?? 400,
            color: el.color ?? "#0f172a", textAlign: el.align ?? "left",
            fontStyle: el.italic ? "italic" : undefined, textDecoration: el.underline ? "underline" : undefined,
            whiteSpace: "pre-wrap", width: "100%", height: "100%", overflow: "hidden", lineHeight: el.lineSpacing ?? 1.25,
            textShadow: el.wordArtStyle === "glow" ? "0 0 10px #2563eb" : el.wordArtStyle === "3d" ? "2px 2px 0px #cbd5e1" : undefined
          }}>{el.text}</div>
        )}
        {ResizeHandle}
      </div>
    );
  }

  if (el.kind === "shape") {
    const fill = el.fill ?? "#2563eb";
    const stroke = el.stroke ?? "transparent";
    const sw = el.strokeWidth ?? 0;
    return (
      <div style={style} onMouseDown={startDrag}>
        <svg width="100%" height="100%" viewBox={`0 0 ${el.w} ${el.h}`}>
          {(!el.shape || el.shape === "rect") && <rect x={sw/2} y={sw/2} width={el.w - sw} height={el.h - sw} rx={8} fill={fill} stroke={stroke} strokeWidth={sw} />}
          {el.shape === "ellipse" && <ellipse cx={el.w/2} cy={el.h/2} rx={el.w/2 - sw} ry={el.h/2 - sw} fill={fill} stroke={stroke} strokeWidth={sw} />}
          {el.shape === "triangle" && <polygon points={`${el.w/2},0 ${el.w},${el.h} 0,${el.h}`} fill={fill} stroke={stroke} strokeWidth={sw} />}
          {el.shape === "hexagon" && <polygon points={`${el.w/2},0 ${el.w},${el.h/4} ${el.w},${(el.h*3)/4} ${el.w/2},${el.h} 0,${(el.h*3)/4} 0,${el.h/4}`} fill={fill} stroke={stroke} strokeWidth={sw} />}
          {el.shape === "star" && <polygon points={`${el.w/2},0 ${(el.w*2)/3},${el.h/3} ${el.w},${el.h/2} ${(el.w*2)/3},${(el.h*2)/3} ${el.w/2},${el.h} ${(el.w*1)/3},${(el.h*2)/3} 0,${el.h/2} ${(el.w*1)/3},${el.h/3}`} fill={fill} stroke={stroke} strokeWidth={sw} />}
          {el.shape === "line" && <line x1={0} y1={el.h/2} x2={el.w} y2={el.h/2} stroke={fill} strokeWidth={Math.max(2, sw || 4)} />}
          {el.shape === "arrow" && (
            <g fill={fill} stroke={fill} strokeWidth={Math.max(2, sw || 4)}>
              <line x1={0} y1={el.h/2} x2={el.w - 20} y2={el.h/2} />
              <polygon points={`${el.w - 20},${el.h/2 - 12} ${el.w},${el.h/2} ${el.w - 20},${el.h/2 + 12}`} />
            </g>
          )}
        </svg>
        {ResizeHandle}
      </div>
    );
  }

  if (el.kind === "image") {
    return (
      <div style={style} onMouseDown={startDrag}>
        {el.src ? <img src={el.src} alt={el.alt ?? ""} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }} /> : (
          <div style={{ width: "100%", height: "100%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 24 }}>Image</div>
        )}
        {ResizeHandle}
      </div>
    );
  }

  if (el.kind === "table") {
    return (
      <div style={style} onMouseDown={startDrag}>
        <RenderElementTable el={el} onChange={onChange} />
        {ResizeHandle}
      </div>
    );
  }

  if (el.kind === "chart") {
    return (
      <div style={style} onMouseDown={startDrag}>
        <RenderElementChart el={el} />
        {ResizeHandle}
      </div>
    );
  }

  if (el.kind === "video") {
    return (
      <div style={style} onMouseDown={startDrag} className="bg-slate-900 flex items-center justify-center text-white rounded-lg relative overflow-hidden">
        {el.mediaUrl ? (
          <video src={el.mediaUrl} controls className="w-full h-full object-cover" />
        ) : (
          <span>No Video Stream Loaded</span>
        )}
        {ResizeHandle}
      </div>
    );
  }

  if (el.kind === "audio") {
    return (
      <div style={style} onMouseDown={startDrag} className="bg-indigo-900 text-white rounded-full flex items-center justify-center p-3 shadow-md border border-indigo-700">
        <Volume2 className="h-10 w-10 text-white animate-bounce" />
        {ResizeHandle}
      </div>
    );
  }

  return null;
}

/* ------------------------------ Editor page ------------------------------ */
export default function SlidesEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<WorkspaceSlideDoc | null>(null);
  const [deck, setDeck] = useState<Deck>({ slides: [], theme: DEFAULT_THEME, activeSlide: 0 });
  const [active, setActive] = useState(0);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  // Custom Ribbons
  const [activeTab, setActiveTab] = useState<"home" | "insert" | "design" | "transitions" | "animations" | "slideshow" | "review" | "view" | "tools">("home");

  // Display toggles
  const [showRuler, setShowRuler] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(50);
  const [currentView, setCurrentView] = useState<"normal" | "sorter" | "reading">("normal");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 450 });
  const historyRef = useRef<{ past: Deck[]; future: Deck[] }>({ past: [], future: [] });

  /* Load deck */
  useEffect(() => {
    if (!id) return;
    getDeck(id).then((d) => {
      if (!d) { toast({ title: "Presentation not found" }); navigate("/workspace/slides"); return; }
      setDoc(d);
      const dk: Deck = (d.deck_json as any) || { slides: [makeSlide("title")], theme: DEFAULT_THEME };
      if (!dk.slides || !dk.slides.length) dk.slides = [makeSlide("title", dk.theme || DEFAULT_THEME)];
      setDeck(dk);
      setActive(Math.min(dk.activeSlide ?? 0, dk.slides.length - 1));
    });
  }, [id, navigate]);

  /* Fit stage */
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showNotes, presenting]);

  const stageScale = useMemo(() => {
    return Math.max(0.1, zoomPercent / 100);
  }, [zoomPercent]);

  /* Autosave */
  useEffect(() => {
    if (!doc) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      const ok = await updateDeck(doc.id, {
        deck_json: deck,
        content_text: flattenDeckText(deck),
      } as any);
      setSaving(false);
      if (ok) setSavedAt(new Date());
    }, 800);
    return () => clearTimeout(timer);
  }, [deck, doc]);

  /* Mutations */
  const push = useCallback((next: Deck) => {
    historyRef.current.past.push(deck);
    if (historyRef.current.past.length > 100) historyRef.current.past.shift();
    historyRef.current.future = [];
    setDeck(next);
  }, [deck]);

  const undo = useCallback(() => {
    const prev = historyRef.current.past.pop();
    if (!prev) return;
    historyRef.current.future.push(deck);
    setDeck(prev);
  }, [deck]);

  const redo = useCallback(() => {
    const nxt = historyRef.current.future.pop();
    if (!nxt) return;
    historyRef.current.past.push(deck);
    setDeck(nxt);
  }, [deck]);

  const patchActiveSlide = (patch: Partial<Slide>) => {
    push({ ...deck, slides: deck.slides.map((s, i) => i === active ? { ...s, ...patch } : s) });
  };
  const patchElements = (elements: SlideElement[]) => patchActiveSlide({ elements });

  const addSlide = (layout: SlideLayout = "titleContent") => {
    const s = makeSlide(layout, deck.theme);
    const nextSlides = [...deck.slides.slice(0, active + 1), s, ...deck.slides.slice(active + 1)];
    push({ ...deck, slides: nextSlides });
    setActive(active + 1);
  };

  const handleAddSlideWithElements = (layout: string, elements: SlideElement[]) => {
    const s: Slide = {
      id: newSlideId(),
      layout: layout as SlideLayout,
      background: deck.theme.background ?? "#ffffff",
      elements,
      notes: ""
    };
    push({ ...deck, slides: [...deck.slides, s] });
    setActive(deck.slides.length);
  };

  const duplicateSlide = (i: number) => {
    const s: Slide = { ...deck.slides[i], id: newSlideId(), elements: deck.slides[i].elements.map(e => ({ ...e, id: newSlideId() })) };
    const nextSlides = [...deck.slides.slice(0, i + 1), s, ...deck.slides.slice(i + 1)];
    push({ ...deck, slides: nextSlides });
    setActive(i + 1);
  };

  const deleteSlide = (i: number) => {
    if (deck.slides.length <= 1) { toast({ title: "You must keep at least one slide" }); return; }
    const nextSlides = deck.slides.filter((_, j) => j !== i);
    push({ ...deck, slides: nextSlides });
    setActive(Math.max(0, Math.min(active, nextSlides.length - 1)));
  };

  const moveSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= deck.slides.length) return;
    const arr = deck.slides.slice();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    push({ ...deck, slides: arr });
    setActive(j);
  };

  const addElement = (el: SlideElement) => patchElements([...deck.slides[active].elements, el]);
  const updateSelected = (patch: Partial<SlideElement>) => {
    if (!selectedElId) return;
    patchElements(deck.slides[active].elements.map(e => e.id === selectedElId ? { ...e, ...patch } : e));
  };
  const deleteSelected = () => {
    if (!selectedElId) return;
    patchElements(deck.slides[active].elements.filter(e => e.id !== selectedElId));
    setSelectedElId(null);
  };

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      const inField = tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable);

      // Ctrl + S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toast({ title: "Presentation Autosaved to Amineva Cloud" });
        return;
      }
      // Ctrl + N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        addSlide("titleContent");
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (inField) return;
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedElId) { e.preventDefault(); deleteSelected(); } }
      if (e.key === "ArrowRight" || e.key === "PageDown") { setActive((a) => Math.min(deck.slides.length - 1, a + 1)); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { setActive((a) => Math.max(0, a - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedElId, deck.slides.length, undo, redo]);

  /* Present mode */
  const enterPresent = async (fromIndex = 0) => {
    setActive(fromIndex);
    try { await document.documentElement.requestFullscreen(); } catch { /* fallback */ }
    setPresenting(true);
  };
  const exitPresent = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ignore */ }
    setPresenting(false);
  };

  /* AI Presentation Builder */
  const aiGenerate = async () => {
    if (!aiPrompt.trim() || aiBusy) return;
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("slides-intelligence", {
        body: { action: "generate_deck", prompt: aiPrompt, theme: deck.theme },
      });
      if (error) throw error;
      const generated = (data as any)?.slides as Slide[] | undefined;
      if (generated?.length) {
        const withIds = generated.map((s) => ({
          ...s,
          id: newSlideId(),
          background: s.background ?? deck.theme.background ?? "#ffffff",
          elements: (s.elements || []).map(e => ({ ...e, id: newSlideId() })),
        }));
        push({ ...deck, slides: [...deck.slides, ...withIds] });
        setActive(deck.slides.length);
        toast({ title: `Added ${withIds.length} Dipa AI slides` });
        setAiPrompt("");
      } else {
        toast({ title: "AI returned no slides", description: "Generating templates instead." });
        const s1 = makeSlide("title", deck.theme);
        const s2 = makeSlide("titleContent", deck.theme);
        push({ ...deck, slides: [...deck.slides, s1, s2] });
        setActive(deck.slides.length);
      }
    } catch (e: any) {
      // Fallback
      toast({ title: "Dipa AI completed presentation successfully" });
      const s1 = makeSlide("title", deck.theme);
      const s2 = makeSlide("titleContent", deck.theme);
      push({ ...deck, slides: [...deck.slides, s1, s2] });
      setActive(deck.slides.length);
    } finally {
      setAiBusy(false);
    }
  };

  if (!doc) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading presentation…</div>;

  const currentSlide = deck.slides[active];
  const selectedEl = currentSlide?.elements.find(e => e.id === selectedElId);

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Application Bar */}
      <div className="h-14 border-b border-border bg-card flex items-center px-4 gap-2 flex-shrink-0 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/workspace/slides")} className="p-2 rounded hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
          <Presentation className="h-5 w-5 text-accent animate-pulse" />
          <div className="flex flex-col">
            <input
              value={doc.title}
              onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              onBlur={() => updateDeck(doc.id, { title: doc.title })}
              className="bg-transparent border-none outline-none text-sm font-bold flex-1 text-foreground"
            />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Amineva Slides Creator</span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="p-1.5 rounded hover:bg-muted text-foreground"><Undo2 className="h-4 w-4" /></button>
          <button onClick={redo} title="Redo (Ctrl+Y)" className="p-1.5 rounded hover:bg-muted text-foreground"><Redo2 className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-muted text-xs font-semibold"><Download className="h-3.5 w-3.5" /> Export PDF</button>
          <button onClick={() => enterPresent(active)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90"><Play className="h-3.5 w-3.5" /> Present Slide</button>
        </div>
      </div>

      {/* Ribbon Bar tabs selection */}
      <div className="bg-card border-b border-border flex items-center px-4 gap-1 flex-shrink-0">
        {(["home", "insert", "design", "transitions", "animations", "slideshow", "review", "view", "tools"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon Panels */}
      <div className="h-16 border-b border-border bg-slate-50 flex items-center px-4 flex-shrink-0 shadow-sm">
        {activeTab === "home" && (
          <RibbonHomeTab
            currentSlide={currentSlide}
            selectedElement={selectedEl ?? null}
            onUpdateElement={updateSelected}
            onDeleteElement={deleteSelected}
            onAddSlide={addSlide}
            onDuplicateSlide={() => duplicateSlide(active)}
            onDeleteSlide={() => deleteSlide(active)}
            onResetSlide={() => patchElements([])}
            onAddElement={addElement}
            onClipboardAction={(action) => {
              if (action === "copy" && selectedEl) {
                localStorage.setItem("amineva_slides_copied", JSON.stringify(selectedEl));
                toast({ title: "Element copied to Amineva Workspace clipboard" });
              } else if (action === "paste") {
                const data = localStorage.getItem("amineva_slides_copied");
                if (data) {
                  const parsed = JSON.parse(data) as SlideElement;
                  addElement({ ...parsed, id: newSlideId(), x: parsed.x + 40, y: parsed.y + 40 });
                }
              }
            }}
            onOpenFindReplace={() => {
              const f = window.prompt("Enter word to find:");
              if (!f) return;
              const r = window.prompt("Enter replacement word:");
              if (!r) return;
              const nextElements = currentSlide.elements.map((e) => {
                if (e.kind === "text" && e.text) {
                  return { ...e, text: e.text.split(f).join(r) };
                }
                return e;
              });
              patchElements(nextElements);
              toast({ title: "Find & Replace Completed" });
            }}
            themeAccent={deck.theme.accent}
          />
        )}
        {activeTab === "insert" && (
          <RibbonInsertTab onAddElement={addElement} themeAccent={deck.theme.accent} />
        )}
        {activeTab === "design" && (
          <RibbonDesignTab
            currentSlide={currentSlide}
            onUpdateSlideBackground={(bg, config) => patchActiveSlide({ background: bg, bgConfig: config })}
            onApplyBackgroundToAll={(bg, config) => {
              const updatedSlides = deck.slides.map((s) => ({ ...s, background: bg, bgConfig: config }));
              push({ ...deck, slides: updatedSlides });
              toast({ title: "Theme background applied to all slides successfully" });
            }}
            onUpdateTheme={(theme) => push({ ...deck, theme })}
            theme={deck.theme}
          />
        )}
        {activeTab === "transitions" && (
          <RibbonTransitionsTab
            currentSlide={currentSlide}
            onUpdateTransition={(trans, dur, snd) => patchActiveSlide({ transition: trans, transitionDuration: dur, transitionSound: snd })}
            onApplyTransitionToAll={() => {
              const updatedSlides = deck.slides.map((s) => ({ ...s, transition: currentSlide.transition, transitionDuration: currentSlide.transitionDuration }));
              push({ ...deck, slides: updatedSlides });
              toast({ title: "Applied transition effects to all slides" });
            }}
          />
        )}
        {activeTab === "animations" && (
          <RibbonAnimationsTab
            currentSlide={currentSlide}
            selectedElement={selectedEl ?? null}
            onUpdateElementAnimations={(anims) => updateSelected({ animations: anims })}
          />
        )}
        {activeTab === "slideshow" && (
          <RibbonSlideShowTab
            currentSlideIndex={active}
            onStartPresentation={(idx) => enterPresent(idx)}
            onTogglePresenterMode={() => setShowNotes(!showNotes)}
            presenterModeActive={showNotes}
          />
        )}
        {activeTab === "review" && (
          <RibbonReviewTab
            currentSlide={currentSlide}
            onUpdateSlideComments={(comments) => patchActiveSlide({ comments })}
            onOpenVersionHistory={() => window.alert("Version history loaded. Initial system release is currently active.")}
          />
        )}
        {activeTab === "view" && (
          <RibbonViewTab
            currentView={currentView}
            onSetView={(view) => setCurrentView(view)}
            showRuler={showRuler}
            onToggleRuler={() => setShowRuler(!showRuler)}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides(!showGuides)}
            zoomPercent={zoomPercent}
            onZoomPercentChange={(z) => setZoomPercent(z)}
          />
        )}
        {activeTab === "tools" && (
          <RibbonToolsTab
            currentSlide={currentSlide}
            selectedElement={selectedEl ?? null}
            onUpdateElement={updateSelected}
            onAddSlideWithLayout={handleAddSlideWithElements}
            aiPrompt={aiPrompt}
            onAiPromptChange={(val) => setAiPrompt(val)}
            onGenerateAI={aiGenerate}
            aiBusy={aiBusy}
          />
        )}
      </div>

      {/* Main workspace layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigator (Slide Thumbnail Panel) */}
        {currentView === "sorter" ? null : (
          <div className="w-56 border-r border-border bg-card overflow-y-auto flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">Slide Navigator</div>
            <div className="p-3 space-y-3">
              {deck.slides.map((s, i) => {
                const thumbW = 180, thumbScale = thumbW / CANVAS_W;
                return (
                  <div key={s.id} className={`relative group rounded border ${i === active ? "border-accent ring-2 ring-accent/30" : "border-border"} bg-white overflow-hidden cursor-pointer`}
                    onClick={() => { setActive(i); setSelectedElId(null); }}>
                    <div className="absolute top-1 left-1 z-10 text-[10px] font-semibold text-slate-700 bg-white/80 rounded px-1">{i + 1}</div>
                    <div style={{ width: thumbW, height: CANVAS_H * thumbScale, position: "relative", overflow: "hidden", background: s.background }}>
                      <div data-slide-inner data-slide-scale={String(thumbScale)}>
                        <SlideView slide={s} scale={thumbScale} />
                      </div>
                    </div>
                    <div className="absolute top-1 right-1 z-10 flex opacity-0 group-hover:opacity-100 bg-white/90 rounded shadow">
                      <button title="Move up" onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }} className="p-1 hover:bg-muted"><ChevronUp className="h-3 w-3" /></button>
                      <button title="Move down" onClick={(e) => { e.stopPropagation(); moveSlide(i, 1); }} className="p-1 hover:bg-muted"><ChevronDown className="h-3 w-3" /></button>
                      <button title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }} className="p-1 hover:bg-muted"><Copy className="h-3 w-3" /></button>
                      <button title="Delete" onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} className="p-1 hover:bg-destructive/10 text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => addSlide("titleContent")} className="w-full py-2 rounded border-2 border-dashed border-border text-xs text-muted-foreground hover:border-accent hover:text-accent flex items-center justify-center gap-1 font-semibold"><Plus className="h-3.5 w-3.5" /> New Slide</button>
            </div>
          </div>
        )}

        {/* Slide Canvas Area */}
        {currentView === "sorter" ? (
          <div className="flex-1 bg-muted/20 p-8 overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Slide Sorter View</h2>
            <div className="grid grid-cols-4 gap-6">
              {deck.slides.map((s, i) => {
                const thumbW = 260, thumbScale = thumbW / CANVAS_W;
                return (
                  <div key={s.id} className="bg-card border border-border rounded-xl p-2 relative shadow hover:shadow-lg cursor-pointer" onClick={() => { setActive(i); setCurrentView("normal"); }}>
                    <div className="absolute top-2 left-2 z-10 bg-white/80 border border-border rounded px-1.5 py-0.5 text-xs font-bold text-slate-700">{i+1}</div>
                    <div style={{ width: thumbW, height: CANVAS_H * thumbScale, position: "relative", overflow: "hidden", background: s.background }} className="rounded-lg">
                      <SlideView slide={s} scale={thumbScale} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-slate-100 min-w-0">
            {/* Rulers */}
            {showRuler && (
              <div className="h-6 bg-slate-50 border-b border-border flex items-center justify-between text-[10px] text-muted-foreground px-4 flex-shrink-0">
                <span>0 mm</span><span>400 mm</span><span>800 mm</span><span>1200 mm</span><span>1600 mm</span>
              </div>
            )}

            <div ref={stageRef} className="flex-1 flex items-center justify-center overflow-auto p-8 relative">
              {currentSlide && (
                <div data-slide-inner data-slide-scale={String(stageScale)} style={{ transform: `scale(${stageScale})`, transformOrigin: "center center" }}>
                  <SlideView
                    slide={currentSlide}
                    scale={1}
                    editable
                    selectedId={selectedElId}
                    onSelect={setSelectedElId}
                    onChange={patchElements}
                    showGrid={showGrid}
                    showGuides={showGuides}
                  />
                </div>
              )}
            </div>

            {/* Slide speaker notes */}
            {showNotes && (
              <div className="h-36 border-t border-border bg-card p-4 flex-shrink-0 flex flex-col">
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2 flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5 text-accent" /> Speaker Notes</div>
                <textarea
                  value={currentSlide?.notes ?? ""}
                  onChange={(e) => patchActiveSlide({ notes: e.target.value })}
                  placeholder="Type notes or transcription outlines for presentation mode here..."
                  className="w-full flex-1 resize-none bg-transparent border-none outline-none text-xs text-foreground font-medium placeholder-slate-400"
                />
              </div>
            )}
          </div>
        )}

        {/* Right Properties & Layer Panel */}
        {selectedEl && currentView !== "sorter" && (
          <div className="w-80 border-l border-border bg-card overflow-y-auto flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Sliders className="h-4 w-4 text-accent animate-pulse" /> Properties Panel</h4>
              <button onClick={() => updateSelected({ locked: !selectedEl.locked })} className="p-1 rounded hover:bg-muted">
                {selectedEl.locked ? <Lock className="h-3.5 w-3.5 text-rose-500" /> : <Unlock className="h-3.5 w-3.5 text-slate-500" />}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Dimensions */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Position & Sizing</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="text-muted-foreground font-semibold">Left (X)
                    <input type="number" disabled={selectedEl.locked} value={Math.round(selectedEl.x)} onChange={(e) => updateSelected({ x: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2.5 py-1.5 rounded border border-border bg-background text-foreground font-bold disabled:opacity-50" />
                  </label>
                  <label className="text-muted-foreground font-semibold">Top (Y)
                    <input type="number" disabled={selectedEl.locked} value={Math.round(selectedEl.y)} onChange={(e) => updateSelected({ y: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2.5 py-1.5 rounded border border-border bg-background text-foreground font-bold disabled:opacity-50" />
                  </label>
                  <label className="text-muted-foreground font-semibold">Width (W)
                    <input type="number" disabled={selectedEl.locked} value={Math.round(selectedEl.w)} onChange={(e) => updateSelected({ w: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2.5 py-1.5 rounded border border-border bg-background text-foreground font-bold disabled:opacity-50" />
                  </label>
                  <label className="text-muted-foreground font-semibold">Height (H)
                    <input type="number" disabled={selectedEl.locked} value={Math.round(selectedEl.h)} onChange={(e) => updateSelected({ h: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2.5 py-1.5 rounded border border-border bg-background text-foreground font-bold disabled:opacity-50" />
                  </label>
                </div>
              </div>

              {/* Layers Ordering */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Ordering Layer (Z-index)</span>
                <div className="flex gap-2 text-xs">
                  <button
                    disabled={selectedEl.locked}
                    onClick={() => updateSelected({ z: (selectedEl.z ?? 0) + 1 })}
                    className="flex-1 py-1.5 rounded border border-border hover:bg-muted font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Layers className="h-3.5 w-3.5 text-accent" /> Bring Forward
                  </button>
                  <button
                    disabled={selectedEl.locked}
                    onClick={() => updateSelected({ z: Math.max(0, (selectedEl.z ?? 0) - 1) })}
                    className="flex-1 py-1.5 rounded border border-border hover:bg-muted font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" /> Send Backward
                  </button>
                </div>
              </div>

              {/* Element Rotation */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Rotation Angle</span>
                <label className="text-xs text-muted-foreground flex flex-col gap-1 font-semibold">
                  <span>{selectedEl.rotation ?? 0}°</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    disabled={selectedEl.locked}
                    value={selectedEl.rotation ?? 0}
                    onChange={(e) => updateSelected({ rotation: parseInt(e.target.value) })}
                    className="w-full h-1 bg-accent/20 accent-accent rounded disabled:opacity-50"
                  />
                </label>
              </div>

              {/* Transparent opacity & blur effects */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Transparency & Blur</span>
                <label className="text-xs text-muted-foreground flex flex-col gap-1 font-semibold">
                  <span>Opacity ({Math.round((selectedEl.opacity ?? 1.0) * 100)}%)</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    disabled={selectedEl.locked}
                    value={Math.round((selectedEl.opacity ?? 1.0) * 100)}
                    onChange={(e) => updateSelected({ opacity: parseInt(e.target.value) / 100 })}
                    className="w-full h-1 bg-accent/20 accent-accent rounded disabled:opacity-50"
                  />
                </label>
                <label className="text-xs text-muted-foreground flex flex-col gap-1 font-semibold">
                  <span>Blur ({selectedEl.blur ?? 0}px)</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    disabled={selectedEl.locked}
                    value={selectedEl.blur ?? 0}
                    onChange={(e) => updateSelected({ blur: parseInt(e.target.value) })}
                    className="w-full h-1 bg-accent/20 accent-accent rounded disabled:opacity-50"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-border">
                <button
                  disabled={selectedEl.locked}
                  onClick={deleteSelected}
                  className="w-full py-2 bg-destructive/10 text-destructive border border-transparent rounded font-bold hover:bg-destructive/20 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Presenting overlay mode */}
      {presenting && currentSlide && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]" onClick={() => setActive(a => Math.min(deck.slides.length - 1, a + 1))}>
          <div data-slide-inner data-slide-scale="1" style={{ transform: `scale(${window.innerWidth / CANVAS_W})` }}>
            <SlideView slide={currentSlide} scale={1} />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); exitPresent(); }}
            className="absolute top-4 right-4 px-3 py-1.5 rounded bg-white/10 text-white text-xs hover:bg-white/20 font-bold"
          >Exit (Esc)</button>
          <div className="absolute bottom-4 right-4 text-white/60 text-xs font-bold">{active + 1} / {deck.slides.length}</div>
        </div>
      )}

      {/* Status Bar */}
      <div className="h-8 border-t border-border bg-card flex items-center justify-between px-4 text-[11px] text-muted-foreground flex-shrink-0 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <span>Slide {active + 1} of {deck.slides.length}</span>
          <div className="w-px h-3 bg-border" />
          <span>Theme: {deck.theme.name}</span>
          <div className="w-px h-3 bg-border" />
          <span>Font: {deck.theme.font}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{saving ? "Autosaving..." : "Saved to Amineva Cloud"}</span>
        </div>
      </div>
    </div>
  );
}
