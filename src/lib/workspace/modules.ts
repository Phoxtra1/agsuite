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
    description: "Write, format and publish professional documents.",
    status: "active",
    icon: FileText,
    route: "/workspace/docs",
    accent: "bg-blue-500/15 text-blue-500",
  },
  {
    id: "amineva-sheets",
    name: "Amineva Sheets",
    description: "Build spreadsheets, run calculations and analyse your data.",
    status: "active",
    icon: Sheet,
    route: "/workspace/sheets",
    accent: "bg-emerald-500/15 text-emerald-500",
  },
  {
    id: "amineva-slides",
    name: "Amineva Slides",
    description: "Design and present polished presentations.",
    status: "active",
    icon: Presentation,
    route: "/workspace/slides",
    accent: "bg-amber-500/15 text-amber-500",
  },
  {
    id: "amineva-forms",
    name: "Amineva Forms",
    description: "Create forms and collect responses through a shareable link.",
    status: "active",
    icon: ClipboardList,
    route: "/workspace/forms",
    accent: "bg-fuchsia-500/15 text-fuchsia-500",
  },
  {
    id: "amineva-drive",
    name: "Amineva Drive",
    description: "Keep all your Workspace files in one place.",
    status: "coming_soon",
    icon: FolderOpen,
    accent: "bg-sky-500/15 text-sky-500",
  },
];

