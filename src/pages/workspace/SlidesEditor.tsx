import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Plus, Copy, Trash2, ChevronUp, ChevronDown, Play, Type, Square, Circle, Image as ImageIcon,
  Sparkles, Download, StickyNote, Presentation, Eye, EyeOff, Save, Undo2, Redo2, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Palette,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  getDeck, updateDeck, type WorkspaceSlideDoc,
  type Deck, type Slide, type SlideElement, type SlideLayout,
  makeSlide, newSlideId, flattenDeckText, DEFAULT_THEME,
} from "@/lib/workspace/slides/documents";

const CANVAS_W = 1920;
const CANVAS_H = 1080;

const ALL_LAYOUTS: { id: SlideLayout; label: string }[] = [
  { id: "title", label: "Title" },
  { id: "titleContent", label: "Title & Content" },
  { id: "twoColumn", label: "Two Column" },
  { id: "comparison", label: "Comparison" },
  { id: "sectionHeader", label: "Section Header" },
  { id: "timeline", label: "Timeline" },
  { id: "dashboard", label: "Dashboard" },
  { id: "quote", label: "Quote" },
  { id: "statistics", label: "Statistics" },
  { id: "closing", label: "Closing Slide" },
  { id: "blank", label: "Blank" },
];

/* ------------------------- Scaled slide renderer -------------------- */
function SlideView({
  slide,
  scale,
  editable,
  selectedId,
  onSelect,
  onChange,
}: {
  slide: Slide;
  scale: number;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (elements: SlideElement[]) => void;
}) {
  return (
    <div
      style={{
        width: CANVAS_W * scale,
        height: CANVAS_H * scale,
        position: "relative",
        background: slide.background,
        overflow: "hidden",
        boxShadow: editable ? "0 12px 40px rgba(15,23,42,0.15)" : undefined,
        borderRadius: editable ? 6 : 0,
      }}
      onMouseDown={(e) => { if (editable && e.target === e.currentTarget) onSelect?.(null); }}
    >
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
  const style: React.CSSProperties = {
    position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    outline: selected ? "2px solid #2563eb" : editable ? "1px dashed transparent" : undefined,
    cursor: editable ? (editing ? "text" : "move") : "default",
  };

  const startDrag = (e: React.MouseEvent) => {
    if (!editable || editing) return;
    e.stopPropagation();
    onSelect();
    const sx = e.clientX, sy = e.clientY;
    const ox = el.x, oy = el.y;
    // account for parent scale — parent uses transform scale, so client deltas need dividing by that scale.
    // We read it from the wrapping ancestor's transform matrix.
    const scaleEl = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-slide-inner]");
    const scale = scaleEl ? parseFloat(scaleEl.getAttribute("data-slide-scale") || "1") : 1;
    const move = (ev: MouseEvent) => onChange({ x: ox + (ev.clientX - sx) / scale, y: oy + (ev.clientY - sy) / scale });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };

  const ResizeHandle = editable && selected ? (
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

  if (el.kind === "text") {
    return (
      <div style={style} onMouseDown={startDrag} onDoubleClick={(e) => { if (editable) { e.stopPropagation(); setEditing(true); } }}>
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
              whiteSpace: "pre-wrap", lineHeight: 1.25,
            }}
          />
        ) : (
          <div style={{
            fontFamily: el.fontFamily ?? "Inter", fontSize: el.fontSize ?? 32, fontWeight: el.fontWeight ?? 400,
            color: el.color ?? "#0f172a", textAlign: el.align ?? "left",
            fontStyle: el.italic ? "italic" : undefined, textDecoration: el.underline ? "underline" : undefined,
            whiteSpace: "pre-wrap", width: "100%", height: "100%", overflow: "hidden", lineHeight: 1.25,
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
    const pad = 40;
    const sX = Math.max(120, stageSize.w - pad) / CANVAS_W;
    const sY = Math.max(120, stageSize.h - pad) / CANVAS_H;
    return Math.max(0.05, Math.min(sX, sY));
  }, [stageSize]);

  /* Autosave (debounced 800ms) */
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

  const switchActiveSlideLayout = (layout: SlideLayout) => {
    const fresh = makeSlide(layout, deck.theme);
    patchActiveSlide({
      layout,
      background: fresh.background,
      elements: fresh.elements,
    });
    setSelectedElId(null);
    toast({ title: `Switched layout to ${layout.replace(/([A-Z])/g, " $1")}` });
  };

  const addSlide = (layout: SlideLayout = "titleContent") => {
    const s = makeSlide(layout, deck.theme);
    const nextSlides = [...deck.slides.slice(0, active + 1), s, ...deck.slides.slice(active + 1)];
    push({ ...deck, slides: nextSlides });
    setActive(active + 1);
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

  /* Keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      const inField = tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || (tgt as HTMLElement).isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (inField) return;
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedElId) { e.preventDefault(); deleteSelected(); } }
      if (e.key === "ArrowRight" || e.key === "PageDown") { setActive((a) => Math.min(deck.slides.length - 1, a + 1)); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { setActive((a) => Math.max(0, a - 1)); }
      if (e.key === "F5") { e.preventDefault(); enterPresent(); }
      if (e.key === "Escape" && presenting) { exitPresent(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedElId, deck.slides.length, presenting, undo, redo]);

  /* Present mode */
  const enterPresent = async () => {
    try { await document.documentElement.requestFullscreen(); } catch { /* fallback: overlay */ }
    setPresenting(true);
  };
  const exitPresent = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ignore */ }
    setPresenting(false);
  };
  useEffect(() => {
    const h = () => { if (!document.fullscreenElement) setPresenting(false); };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  /* AI: generate slides from prompt via Lovable AI gateway */
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
        toast({ title: `Added ${withIds.length} AI-generated slides` });
        setAiPrompt("");
      } else {
        toast({ title: "AI returned no slides", description: "Try a more specific prompt." });
      }
    } catch (e: any) {
      toast({ title: "AI generation failed", description: e?.message || "Try again shortly.", variant: "destructive" as any });
    } finally {
      setAiBusy(false);
    }
  };

  /* Export to PDF (uses browser print) */
  const exportPdf = () => window.print();

  /* Insert image via file picker */
  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = () => {
      const f = input.files?.[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => addElement({
        id: newSlideId(), kind: "image", x: 300, y: 240, w: 800, h: 500, src: String(fr.result),
      });
      fr.readAsDataURL(f);
    };
    input.click();
  };

  if (!doc) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading presentation…</div>;

  const currentSlide = deck.slides[active];
  const selectedEl = currentSlide?.elements.find(e => e.id === selectedElId);

  /* Present overlay */
  if (presenting) {
    const s = deck.slides[active];
    const scaleX = window.innerWidth / CANVAS_W;
    const scaleY = window.innerHeight / CANVAS_H;
    const scl = Math.min(scaleX, scaleY);
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]" onClick={() => setActive(a => Math.min(deck.slides.length - 1, a + 1))}>
        <div data-slide-inner data-slide-scale={String(scl)}>
          <SlideView slide={s} scale={scl} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); exitPresent(); }}
          className="absolute top-4 right-4 px-3 py-1.5 rounded bg-white/10 text-white text-xs hover:bg-white/20"
        >Exit (Esc)</button>
        <div className="absolute bottom-4 right-4 text-white/60 text-xs">{active + 1} / {deck.slides.length}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-14 border-b border-border bg-card flex items-center px-3 gap-2 flex-shrink-0">
        <button onClick={() => navigate("/workspace/slides")} className="p-2 rounded hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
        <Presentation className="h-4 w-4 text-amber-500" />
        <input
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          onBlur={() => updateDeck(doc.id, { title: doc.title })}
          className="bg-transparent border-none outline-none text-sm font-semibold flex-1 max-w-md"
        />
        <div className="flex-1" />
        <button onClick={undo} title="Undo (Ctrl+Z)" className="p-2 rounded hover:bg-muted"><Undo2 className="h-4 w-4" /></button>
        <button onClick={redo} title="Redo (Ctrl+Y)" className="p-2 rounded hover:bg-muted"><Redo2 className="h-4 w-4" /></button>
        <div className="w-px h-6 bg-border mx-1" />
        <button onClick={exportPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-muted text-xs"><Download className="h-3.5 w-3.5" /> PDF</button>
        <button onClick={enterPresent} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90"><Play className="h-3.5 w-3.5" /> Present</button>
        <div className="text-[11px] text-muted-foreground ml-2 w-24 text-right">
          {saving ? "Saving…" : savedAt ? `Saved · ${savedAt.toLocaleTimeString()}` : ""}
        </div>
      </div>

      {/* Ribbon */}
      <div className="h-12 border-b border-border bg-card flex items-center px-3 gap-1 flex-shrink-0 overflow-x-auto">
        <button onClick={() => addSlide("titleContent")} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-muted text-xs"><Plus className="h-3.5 w-3.5" /> Slide</button>
        <div className="w-px h-6 bg-border mx-1" />
        <button onClick={() => addElement({ id: newSlideId(), kind: "text", x: 200, y: 300, w: 900, h: 200, text: "Text", fontSize: 40, color: "#0f172a" })} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-muted text-xs"><Type className="h-3.5 w-3.5" /> Text</button>
        <button onClick={() => addElement({ id: newSlideId(), kind: "shape", shape: "rect", x: 400, y: 300, w: 500, h: 300, fill: deck.theme.accent })} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-muted text-xs"><Square className="h-3.5 w-3.5" /> Rect</button>
        <button onClick={() => addElement({ id: newSlideId(), kind: "shape", shape: "ellipse", x: 400, y: 300, w: 400, h: 400, fill: deck.theme.accent })} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-muted text-xs"><Circle className="h-3.5 w-3.5" /> Circle</button>
        <button onClick={insertImage} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-muted text-xs"><ImageIcon className="h-3.5 w-3.5" /> Image</button>
        <div className="w-px h-6 bg-border mx-1" />
        {/* Text formatting for selected element */}
        {selectedEl?.kind === "text" && (
          <>
            <button onClick={() => updateSelected({ fontWeight: (selectedEl.fontWeight ?? 400) >= 700 ? 400 : 700 })} className={`p-1.5 rounded hover:bg-muted ${((selectedEl.fontWeight ?? 400) >= 700) ? "bg-muted" : ""}`}><Bold className="h-3.5 w-3.5" /></button>
            <button onClick={() => updateSelected({ italic: !selectedEl.italic })} className={`p-1.5 rounded hover:bg-muted ${selectedEl.italic ? "bg-muted" : ""}`}><Italic className="h-3.5 w-3.5" /></button>
            <button onClick={() => updateSelected({ underline: !selectedEl.underline })} className={`p-1.5 rounded hover:bg-muted ${selectedEl.underline ? "bg-muted" : ""}`}><Underline className="h-3.5 w-3.5" /></button>
            <input type="number" min={8} max={200} value={selectedEl.fontSize ?? 32} onChange={(e) => updateSelected({ fontSize: parseInt(e.target.value) || 32 })} className="w-14 px-2 py-1 rounded border border-border bg-background text-xs" />
            <input type="color" value={selectedEl.color ?? "#0f172a"} onChange={(e) => updateSelected({ color: e.target.value })} className="w-7 h-7 rounded border border-border" />
            <button onClick={() => updateSelected({ align: "left" })} className={`p-1.5 rounded hover:bg-muted ${selectedEl.align === "left" ? "bg-muted" : ""}`}><AlignLeft className="h-3.5 w-3.5" /></button>
            <button onClick={() => updateSelected({ align: "center" })} className={`p-1.5 rounded hover:bg-muted ${selectedEl.align === "center" ? "bg-muted" : ""}`}><AlignCenter className="h-3.5 w-3.5" /></button>
            <button onClick={() => updateSelected({ align: "right" })} className={`p-1.5 rounded hover:bg-muted ${selectedEl.align === "right" ? "bg-muted" : ""}`}><AlignRight className="h-3.5 w-3.5" /></button>
          </>
        )}
        {selectedEl?.kind === "shape" && (
          <>
            <label className="flex items-center gap-1.5 text-xs"><Palette className="h-3.5 w-3.5" /> Fill
              <input type="color" value={selectedEl.fill ?? "#2563eb"} onChange={(e) => updateSelected({ fill: e.target.value })} className="w-7 h-7 rounded border border-border" />
            </label>
          </>
        )}
        {selectedEl && (
          <button onClick={deleteSelected} className="ml-1 inline-flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-destructive/10 text-destructive text-xs"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        )}
        <div className="flex-1" />
        <select
          value={deck.theme.name}
          onChange={(e) => {
            const map: Record<string, typeof DEFAULT_THEME> = {
              Amineva: DEFAULT_THEME,
              Midnight: { name: "Midnight", primary: "#1E2761", accent: "#CADCFC", background: "#0F172A", text: "#F8FAFC", font: "Inter" },
              Forest:   { name: "Forest",   primary: "#2C5F2D", accent: "#97BC62", background: "#F5F5F5", text: "#1a2e05", font: "Inter" },
              Coral:    { name: "Coral",    primary: "#F96167", accent: "#2F3C7E", background: "#FFF8F0", text: "#1e1b2e", font: "Inter" },
            };
            push({ ...deck, theme: map[e.target.value] || DEFAULT_THEME });
          }}
          className="px-2 py-1.5 rounded border border-border bg-background text-xs"
        >
          <option>Amineva</option><option>Midnight</option><option>Forest</option><option>Coral</option>
        </select>
        <button onClick={() => setShowNotes(v => !v)} className="p-2 rounded hover:bg-muted" title="Toggle notes">
          {showNotes ? <EyeOff className="h-3.5 w-3.5" /> : <StickyNote className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Body: navigator | canvas | properties */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigator */}
        <div className="w-52 border-r border-border bg-card overflow-y-auto flex flex-col">
          <div className="p-2 space-y-2">
            {deck.slides.map((s, i) => {
              const thumbW = 176, thumbScale = thumbW / CANVAS_W;
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
                    <button title="Delete" onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this slide?")) deleteSlide(i); }} className="p-1 hover:bg-destructive/10 text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              );
            })}
            <button onClick={() => addSlide("titleContent")} className="w-full py-2 rounded border-2 border-dashed border-border text-xs text-muted-foreground hover:border-accent hover:text-accent flex items-center justify-center gap-1"><Plus className="h-3.5 w-3.5" /> New slide</button>
          </div>
        </div>

        {/* Canvas + notes */}
        <div className="flex-1 flex flex-col bg-muted/30 min-w-0">
          <div ref={stageRef} className="flex-1 flex items-center justify-center overflow-hidden p-4">
            {currentSlide && (
              <div data-slide-inner data-slide-scale={String(stageScale)}>
                <SlideView
                  slide={currentSlide}
                  scale={stageScale}
                  editable
                  selectedId={selectedElId}
                  onSelect={setSelectedElId}
                  onChange={patchElements}
                />
              </div>
            )}
          </div>
          {showNotes && (
            <div className="h-32 border-t border-border bg-card p-3 flex-shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><StickyNote className="h-3 w-3" /> Speaker notes</div>
              <textarea
                value={currentSlide?.notes ?? ""}
                onChange={(e) => patchActiveSlide({ notes: e.target.value })}
                placeholder="Notes for this slide…"
                className="w-full h-[calc(100%-1.25rem)] resize-none bg-transparent border-none outline-none text-sm"
              />
            </div>
          )}
        </div>

        {/* AI + layout panel */}
        <div className="w-72 border-l border-border bg-card overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3 text-accent" /> Odeneho</div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Generate slides from a topic, outline, or paste content…"
              className="w-full h-24 resize-none rounded border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
            <button
              disabled={aiBusy || !aiPrompt.trim()}
              onClick={aiGenerate}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-accent text-accent-foreground text-xs font-medium disabled:opacity-50 hover:bg-accent/90"
            >
              <Sparkles className="h-3.5 w-3.5" /> {aiBusy ? "Generating…" : "Generate slides"}
            </button>
          </div>
          <div className="p-3 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Switch slide layout</div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => switchActiveSlideLayout(l.id)}
                  className={`px-2 py-2 rounded border text-xs text-left transition ${
                    currentSlide?.layout === l.id
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : "border-border hover:border-accent hover:bg-accent/5"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Add slide layout</div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => addSlide(l.id)}
                  className="px-2 py-2 rounded border border-border hover:border-accent hover:bg-accent/5 text-xs text-left"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          {selectedEl && (
            <div className="p-3 border-b border-border space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Position & size</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label>X <input type="number" value={Math.round(selectedEl.x)} onChange={(e) => updateSelected({ x: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2 py-1 rounded border border-border bg-background" /></label>
                <label>Y <input type="number" value={Math.round(selectedEl.y)} onChange={(e) => updateSelected({ y: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2 py-1 rounded border border-border bg-background" /></label>
                <label>W <input type="number" value={Math.round(selectedEl.w)} onChange={(e) => updateSelected({ w: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2 py-1 rounded border border-border bg-background" /></label>
                <label>H <input type="number" value={Math.round(selectedEl.h)} onChange={(e) => updateSelected({ h: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2 py-1 rounded border border-border bg-background" /></label>
              </div>
            </div>
          )}
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Slide background</div>
            <input type="color" value={currentSlide?.background ?? "#ffffff"} onChange={(e) => patchActiveSlide({ background: e.target.value })} className="w-full h-8 rounded border border-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
