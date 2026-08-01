import { supabase } from "@/integrations/supabase/client";

export type SlideElementKind = "text" | "shape" | "image" | "table" | "chart" | "video" | "audio";
export type ShapeKind = "rect" | "ellipse" | "triangle" | "line" | "arrow" | "star" | "banner" | "hexagon";
export type SlideLayout =
  | "title"
  | "titleContent"
  | "twoColumn"
  | "comparison"
  | "sectionHeader"
  | "timeline"
  | "dashboard"
  | "quote"
  | "statistics"
  | "closing"
  | "blank";

export interface TableCell {
  row: number;
  col: number;
  text: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface ElementAnimation {
  type: "entrance" | "emphasis" | "exit";
  effect: "fade" | "flyIn" | "zoom" | "appear" | "pulse" | "spin" | "growShrink" | "flyOut" | "motionPath";
  duration: number; // in seconds
  delay: number; // in seconds
  trigger: "click" | "afterPrevious" | "withPrevious";
}

export interface SlideElement {
  id: string;
  kind: SlideElementKind;
  x: number; y: number; w: number; h: number;   // 1920x1080 coord space
  rotation?: number;
  z?: number;
  locked?: boolean;
  groupId?: string;

  // text & WordArt
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  align?: "left" | "center" | "right" | "justify";
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  bullet?: boolean;
  numbering?: boolean;
  lineSpacing?: number;
  textDirection?: "horizontal" | "vertical";
  indent?: number; // padding or indentation margin
  highlightColor?: string;
  wordArt?: boolean;
  wordArtStyle?: string; // outline color, shadows, etc

  // shape
  shape?: ShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  effects?: {
    shadow?: boolean;
    shadowColor?: string;
    glow?: boolean;
    glowColor?: string;
  };

  // image & Crop
  src?: string;
  alt?: string;
  crop?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  opacity?: number;
  blur?: number;

  // table
  rowsCount?: number;
  colsCount?: number;
  cells?: TableCell[];

  // chart
  chartType?: "bar" | "line" | "pie";
  chartTitle?: string;
  chartData?: ChartData[];

  // media (video, audio)
  mediaUrl?: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;

  // interactive
  hyperlink?: string;
  actionButton?: boolean;
  actionType?: "next" | "prev" | "first" | "last" | "url";
  embeddedCode?: string;

  // animation
  animations?: ElementAnimation[];
}

export interface BackgroundImageSettings {
  url?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  cropX?: number;
  cropY?: number;
  cropW?: number;
  cropH?: number;
  opacity?: number;
  blur?: number;
}

export interface SlideBackground {
  type: "solid" | "gradient" | "pattern" | "image";
  solidColor?: string;
  gradient?: {
    type: "linear" | "radial";
    colors: string[]; // e.g. ["#ffffff", "#000000"]
    angle?: number;
  };
  pattern?: string; // e.g. "dots", "stripes"
  image?: BackgroundImageSettings;
}

export interface SlideComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  background: string; // fallback string representation
  bgConfig?: SlideBackground;
  elements: SlideElement[];
  notes?: string;
  name?: string;
  hidden?: boolean;
  transition?: "none" | "fade" | "slide" | "push" | "morph";
  transitionDuration?: number; // seconds
  transitionSound?: string;
  comments?: SlideComment[];
}

export interface DeckTheme {
  name: string;
  primary: string;
  accent: string;
  background?: string;
  text?: string;
  font: string;
  headerFont?: string;
  colorScheme?: string[];
}

export interface DeckVersion {
  id: string;
  timestamp: string;
  title: string;
  deck_json: any;
}

export interface Deck {
  slides: Slide[];
  theme: DeckTheme;
  activeSlide?: number;
  versions?: DeckVersion[];
}

export interface WorkspaceSlideDoc {
  id: string;
  owner_id: string;
  title: string;
  deck_json: Deck;
  content_text: string;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_THEME: DeckTheme = {
  name: "Amineva",
  primary: "#1E2761",
  accent: "#2563eb",
  background: "#ffffff",
  text: "#0f172a",
  font: "Inter",
  headerFont: "Inter",
  colorScheme: ["#1E2761", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"],
};

export function newSlideId(): string {
  return "s" + Math.random().toString(36).slice(2, 10);
}

export function makeSlide(layout: SlideLayout = "titleContent", theme = DEFAULT_THEME): Slide {
  const base: Slide = {
    id: newSlideId(),
    layout,
    background: theme.background ?? "#ffffff",
    bgConfig: { type: "solid", solidColor: theme.background ?? "#ffffff" },
    elements: [],
    notes: "",
    transition: "fade",
    transitionDuration: 0.5,
  };
  const titleColor = theme.text ?? "#0f172a";
  const accent = theme.accent;

  if (layout === "title") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 160, y: 380, w: 1600, h: 200, text: "Presentation Title", fontSize: 96, fontWeight: 800, color: titleColor, align: "center", fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 160, y: 600, w: 1600, h: 90, text: "Subtitle · Amineva Slides", fontSize: 36, color: accent, align: "center", fontFamily: theme.font },
    ];
  } else if (layout === "titleContent") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 90, w: 1680, h: 130, text: "Slide title", fontSize: 72, fontWeight: 700, color: titleColor, align: "left", fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 120, y: 260, w: 1680, h: 720, text: "• First point\n• Second point\n• Third point", fontSize: 36, color: titleColor, align: "left", fontFamily: theme.font },
    ];
  } else if (layout === "twoColumn") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 90, w: 1680, h: 120, text: "Two column layout", fontSize: 60, fontWeight: 700, color: titleColor, fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 120, y: 260, w: 800, h: 720, text: "Left column…", fontSize: 32, color: titleColor, fontFamily: theme.font },
      { id: newSlideId(), kind: "text", x: 1000, y: 260, w: 800, h: 720, text: "Right column…", fontSize: 32, color: titleColor, fontFamily: theme.font },
    ];
  } else if (layout === "sectionHeader") {
    base.background = theme.primary;
    base.bgConfig = { type: "solid", solidColor: theme.primary };
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 460, w: 1680, h: 180, text: "Section header", fontSize: 96, fontWeight: 800, color: "#ffffff", align: "left", fontFamily: theme.headerFont ?? theme.font },
    ];
  } else if (layout === "comparison") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 90, w: 1680, h: 120, text: "Comparison Layout", fontSize: 60, fontWeight: 700, color: titleColor, fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 120, y: 240, w: 800, h: 80, text: "Option A", fontSize: 44, fontWeight: 700, color: accent, fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 120, y: 340, w: 800, h: 600, text: "• High speed execution\n• Enhanced cloud scale\n• Seamless collaboration", fontSize: 32, color: titleColor, fontFamily: theme.font },
      { id: newSlideId(), kind: "text", x: 1000, y: 240, w: 800, h: 80, text: "Option B", fontSize: 44, fontWeight: 700, color: titleColor, fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 1000, y: 340, w: 800, h: 600, text: "• Lower implementation cost\n• Standard integration tools\n• Traditional infrastructure", fontSize: 32, color: titleColor, fontFamily: theme.font },
      { id: newSlideId(), kind: "shape", shape: "line", x: 960, y: 240, w: 4, h: 700, fill: accent },
    ];
  } else if (layout === "timeline") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 90, w: 1680, h: 120, text: "Project Timeline", fontSize: 60, fontWeight: 700, color: titleColor, fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "shape", shape: "arrow", x: 120, y: 540, w: 1680, h: 10, fill: accent },
      { id: newSlideId(), kind: "text", x: 150, y: 300, w: 450, h: 200, text: "Phase 1: Research\n\nQ1 2026\nInitial planning & discovery", fontSize: 28, color: titleColor, align: "center", fontFamily: theme.font },
      { id: newSlideId(), kind: "text", x: 735, y: 300, w: 450, h: 200, text: "Phase 2: Build\n\nQ2 2026\nActive development phase", fontSize: 28, color: titleColor, align: "center", fontFamily: theme.font },
      { id: newSlideId(), kind: "text", x: 1320, y: 300, w: 450, h: 200, text: "Phase 3: Launch\n\nQ3 2026\nDeployment and release", fontSize: 28, color: titleColor, align: "center", fontFamily: theme.font },
    ];
  } else if (layout === "dashboard") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 90, w: 1680, h: 120, text: "Performance Dashboard", fontSize: 60, fontWeight: 700, color: titleColor, fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "shape", shape: "rect", x: 120, y: 260, w: 780, h: 320, fill: accent + "15" },
      { id: newSlideId(), kind: "text", x: 150, y: 300, w: 720, h: 240, text: "$14.2M\nQuarterly Revenue (+15% YoY)", fontSize: 44, fontWeight: 700, color: titleColor, align: "center", fontFamily: theme.font },
      { id: newSlideId(), kind: "shape", shape: "rect", x: 1020, y: 260, w: 780, h: 320, fill: accent + "15" },
      { id: newSlideId(), kind: "text", x: 1050, y: 300, w: 720, h: 240, text: "94.8%\nCustomer Satisfaction Score", fontSize: 44, fontWeight: 700, color: titleColor, align: "center", fontFamily: theme.font },
      { id: newSlideId(), kind: "shape", shape: "rect", x: 120, y: 640, w: 780, h: 320, fill: accent + "15" },
      { id: newSlideId(), kind: "text", x: 150, y: 680, w: 720, h: 240, text: "420K\nMonthly Active Users (+8%)", fontSize: 44, fontWeight: 700, color: titleColor, align: "center", fontFamily: theme.font },
      { id: newSlideId(), kind: "shape", shape: "rect", x: 1020, y: 640, w: 780, h: 320, fill: accent + "15" },
      { id: newSlideId(), kind: "text", x: 1050, y: 680, w: 720, h: 240, text: "99.99%\nPlatform SLA & Uptime", fontSize: 44, fontWeight: 700, color: titleColor, align: "center", fontFamily: theme.font },
    ];
  } else if (layout === "quote") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 200, y: 380, w: 1520, h: 220, text: "“A great quote sits here.”", fontSize: 64, italic: true, color: titleColor, align: "center", fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 200, y: 640, w: 1520, h: 80, text: "— Attribution", fontSize: 28, color: accent, align: "center", fontFamily: theme.font },
    ];
  } else if (layout === "statistics") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 90, w: 1680, h: 120, text: "Key Market Statistics", fontSize: 60, fontWeight: 700, color: titleColor, fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 120, y: 350, w: 1680, h: 250, text: "98%", fontSize: 240, fontWeight: 900, color: accent, align: "center", fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 120, y: 640, w: 1680, h: 120, text: "of enterprise clients report exceptional productivity gains with Dipa Workspace.", fontSize: 44, color: titleColor, align: "center", fontFamily: theme.font },
    ];
  } else if (layout === "closing") {
    base.background = theme.primary;
    base.bgConfig = { type: "solid", solidColor: theme.primary };
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 350, w: 1680, h: 200, text: "Thank You!", fontSize: 120, fontWeight: 800, color: "#ffffff", align: "center", fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 120, y: 580, w: 1680, h: 120, text: "Questions? Get in touch:\nsupport@amineva.com | www.amineva.com", fontSize: 36, color: accent, align: "center", fontFamily: theme.font },
    ];
  }
  return base;
}

export const EMPTY_DECK: Deck = {
  slides: [makeSlide("title")],
  theme: DEFAULT_THEME,
  activeSlide: 0,
};

export function flattenDeckText(d: Deck): string {
  return d.slides.map((s) => s.elements.filter(e => e.kind === "text").map(e => e.text ?? "").join(" ")).join("\n");
}

/* ------------------- CRUD ------------------- */
const TBL = "workspace_slides" as any;
const CACHE_KEY = "amineva_workspace_slides";

function getLocalDecks(): WorkspaceSlideDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDecks(decks: WorkspaceSlideDoc[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(decks));
  } catch (e) {
    console.error("[slides] Failed to save local slides", e);
  }
}

function seedDefaultDecks(): WorkspaceSlideDoc[] {
  const now = new Date().toISOString();
  const defaultDecks: WorkspaceSlideDoc[] = [
    {
      id: "slide-welcome",
      owner_id: "usr-demo",
      title: "Amineva Suite Platform Overview",
      deck_json: EMPTY_DECK,
      content_text: "Presentation Title Subtitle Amineva Slides",
      created_at: now,
      updated_at: now,
    }
  ];
  saveLocalDecks(defaultDecks);
  return defaultDecks;
}

export async function listDecks(): Promise<WorkspaceSlideDoc[]> {
  try {
    const { data, error } = await supabase.from(TBL).select("*").order("updated_at", { ascending: false });
    if (!error && data && Array.isArray(data) && data.length > 0) {
      saveLocalDecks(data as any);
      return data as any;
    }
  } catch (e) {
    console.warn("[slides] Offline fetch fallback", e);
  }
  const local = getLocalDecks();
  if (local.length > 0) return local;
  return seedDefaultDecks();
}

export async function getDeck(id: string): Promise<WorkspaceSlideDoc | null> {
  try {
    const { data, error } = await supabase.from(TBL).select("*").eq("id", id).maybeSingle();
    if (!error && data) {
      const local = getLocalDecks();
      const idx = local.findIndex((d) => d.id === id);
      if (idx >= 0) local[idx] = data as any;
      else local.unshift(data as any);
      saveLocalDecks(local);
      return data as any;
    }
  } catch (e) {
    console.warn("[slides] Offline get deck", e);
  }
  const local = getLocalDecks();
  const found = local.find((d) => d.id === id);
  if (found) return found;

  const now = new Date().toISOString();
  const fallback: WorkspaceSlideDoc = {
    id,
    owner_id: "usr-demo",
    title: "Untitled Presentation",
    deck_json: EMPTY_DECK,
    content_text: "",
    created_at: now,
    updated_at: now,
  };
  local.unshift(fallback);
  saveLocalDecks(local);
  return fallback;
}

export async function createDeck(title = "Untitled presentation"): Promise<WorkspaceSlideDoc | null> {
  let userId = "usr-demo";
  try {
    const { data: u } = await supabase.auth.getUser();
    if (u?.user) userId = u.user.id;
  } catch {}

  const now = new Date().toISOString();
  const localId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newDeck: WorkspaceSlideDoc = {
    id: localId,
    owner_id: userId,
    title,
    deck_json: EMPTY_DECK,
    content_text: "",
    created_at: now,
    updated_at: now,
  };

  const local = getLocalDecks();
  local.unshift(newDeck);
  saveLocalDecks(local);

  supabase.from(TBL)
    .insert({ title, owner_id: userId, deck_json: EMPTY_DECK as any, content_text: "" })
    .select().single()
    .then(({ data }) => {
      if (data) {
        const updatedLocal = getLocalDecks();
        const idx = updatedLocal.findIndex((d) => d.id === localId);
        if (idx >= 0) {
          updatedLocal[idx] = data as any;
          saveLocalDecks(updatedLocal);
        }
      }
    });

  return newDeck;
}

export async function updateDeck(id: string, patch: Partial<WorkspaceSlideDoc>): Promise<boolean> {
  const now = new Date().toISOString();
  const local = getLocalDecks();
  const idx = local.findIndex((d) => d.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...patch, updated_at: now };
    saveLocalDecks(local);
  }

  try {
    const { error } = await supabase.from(TBL).update(patch as any).eq("id", id);
    if (!error) return true;
  } catch (e) {
    console.warn("[slides] Offline update queued locally", e);
  }
  return true;
}

export async function deleteDeck(id: string): Promise<boolean> {
  const local = getLocalDecks();
  const filtered = local.filter((d) => d.id !== id);
  saveLocalDecks(filtered);

  try {
    await supabase.from(TBL).delete().eq("id", id);
  } catch {}
  return true;
}

export async function duplicateDeck(d: WorkspaceSlideDoc): Promise<WorkspaceSlideDoc | null> {
  let userId = "usr-demo";
  try {
    const { data: u } = await supabase.auth.getUser();
    if (u?.user) userId = u.user.id;
  } catch {}

  const now = new Date().toISOString();
  const localId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const duplicated: WorkspaceSlideDoc = {
    id: localId,
    owner_id: userId,
    title: `${d.title} (copy)`,
    deck_json: d.deck_json,
    content_text: d.content_text,
    created_at: now,
    updated_at: now,
  };

  const local = getLocalDecks();
  local.unshift(duplicated);
  saveLocalDecks(local);
  return duplicated;
}
