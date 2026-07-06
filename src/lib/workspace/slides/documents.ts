import { supabase } from "@/integrations/supabase/client";

export type SlideElementKind = "text" | "shape" | "image";
export type ShapeKind = "rect" | "ellipse" | "triangle" | "line" | "arrow";
export type SlideLayout = "title" | "titleContent" | "twoColumn" | "sectionHeader" | "blank" | "quote";

export interface SlideElement {
  id: string;
  kind: SlideElementKind;
  x: number; y: number; w: number; h: number;   // 1920x1080 coord space
  rotation?: number;
  z?: number;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  align?: "left" | "center" | "right";
  italic?: boolean;
  underline?: boolean;
  // shape
  shape?: ShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // image
  src?: string;
  alt?: string;
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  background: string;
  elements: SlideElement[];
  notes?: string;
  name?: string;
  hidden?: boolean;
  transition?: "none" | "fade" | "slide" | "zoom" | "morph";
}

export interface DeckTheme {
  name: string;
  primary: string;
  accent: string;
  background?: string;
  text?: string;
  font: string;
  headerFont?: string;
}

export interface Deck {
  slides: Slide[];
  theme: DeckTheme;
  activeSlide?: number;
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
};

export function newSlideId(): string {
  return "s" + Math.random().toString(36).slice(2, 10);
}

export function makeSlide(layout: SlideLayout = "titleContent", theme = DEFAULT_THEME): Slide {
  const base: Slide = {
    id: newSlideId(),
    layout,
    background: theme.background ?? "#ffffff",
    elements: [],
    notes: "",
    transition: "fade",
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
    base.elements = [
      { id: newSlideId(), kind: "text", x: 120, y: 460, w: 1680, h: 180, text: "Section header", fontSize: 96, fontWeight: 800, color: "#ffffff", align: "left", fontFamily: theme.headerFont ?? theme.font },
    ];
  } else if (layout === "quote") {
    base.elements = [
      { id: newSlideId(), kind: "text", x: 200, y: 380, w: 1520, h: 220, text: "\u201CA great quote sits here.\u201D", fontSize: 64, italic: true, color: titleColor, align: "center", fontFamily: theme.headerFont ?? theme.font },
      { id: newSlideId(), kind: "text", x: 200, y: 640, w: 1520, h: 80, text: "— Attribution", fontSize: 28, color: accent, align: "center", fontFamily: theme.font },
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

export async function listDecks(): Promise<WorkspaceSlideDoc[]> {
  const { data, error } = await supabase.from(TBL).select("*").order("updated_at", { ascending: false });
  if (error) { console.error("[slides] list", error); return []; }
  return (data as any) || [];
}
export async function getDeck(id: string): Promise<WorkspaceSlideDoc | null> {
  const { data, error } = await supabase.from(TBL).select("*").eq("id", id).maybeSingle();
  if (error) { console.error("[slides] get", error); return null; }
  return data as any;
}
export async function createDeck(title = "Untitled presentation"): Promise<WorkspaceSlideDoc | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from(TBL)
    .insert({ title, owner_id: u.user.id, deck_json: EMPTY_DECK as any, content_text: "" })
    .select().single();
  if (error) { console.error("[slides] create", error); return null; }
  return data as any;
}
export async function updateDeck(id: string, patch: Partial<WorkspaceSlideDoc>): Promise<boolean> {
  const { error } = await supabase.from(TBL).update(patch as any).eq("id", id);
  if (error) { console.error("[slides] update", error); return false; }
  return true;
}
export async function deleteDeck(id: string): Promise<boolean> {
  const { error } = await supabase.from(TBL).delete().eq("id", id);
  return !error;
}
export async function duplicateDeck(d: WorkspaceSlideDoc): Promise<WorkspaceSlideDoc | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from(TBL)
    .insert({ owner_id: u.user.id, title: `${d.title} (copy)`, deck_json: d.deck_json as any, content_text: d.content_text })
    .select().single();
  if (error) return null;
  return data as any;
}
