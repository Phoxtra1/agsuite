import { FileText, Sheet, Presentation, ClipboardList, FolderOpen, type LucideIcon } from "lucide-react";

export type WorkspaceModuleStatus = "active" | "coming_soon";

export interface WorkspaceModule {
  id: string;
  name: string;
  description: string;
  status: WorkspaceModuleStatus;
  icon: LucideIcon;
  route?: string;
  accent: string;
}

export const WORKSPACE_MODULES: WorkspaceModule[] = [
  {
    id: "amineva-docs",
    name: "Amineva Docs",
    description:
      "Professional document workspace with structured intelligence, AI assistance and multi-format export.",
    status: "active",
    icon: FileText,
    route: "/workspace/docs",
    accent: "bg-blue-500/15 text-blue-500",
  },
  {
    id: "amineva-sheets",
    name: "Amineva Sheets",
    description:
      "Intelligence-grade spreadsheets with 400+ functions, SPSS-style analytics, and AI-assisted insight.",
    status: "active",
    icon: Sheet,
    route: "/workspace/sheets",
    accent: "bg-emerald-500/15 text-emerald-500",
  },
  {
    id: "amineva-slides",
    name: "Amineva Slides",
    description:
      "Boardroom-grade presentations with AI generation, live data links, presenter tools and PDF export.",
    status: "active",
    icon: Presentation,
    route: "/workspace/slides",
    accent: "bg-amber-500/15 text-amber-500",
  },
  {
    id: "amineva-forms",
    name: "Amineva Forms",
    description: "Structured data collection forms with link-based distribution.",
    status: "active",
    icon: ClipboardList,
    route: "/workspace/forms",
    accent: "bg-fuchsia-500/15 text-fuchsia-500",
  },

  {
    id: "amineva-drive",
    name: "Amineva Drive",
    description: "Unified storage layer for every Workspace document and export.",
    status: "coming_soon",
    icon: FolderOpen,
    accent: "bg-sky-500/15 text-sky-500",
  },
];
