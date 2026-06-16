import { FileText, Sheet, Presentation, ClipboardList, FolderOpen, type LucideIcon } from "lucide-react";

export type WorkspaceModuleStatus = "active" | "coming_soon";

export interface WorkspaceModule {
  id: string;
  name: string;
  description: string;
  status: WorkspaceModuleStatus;
  icon: LucideIcon;
  route?: string;
  accent: string; // tailwind class for the icon background
}

export const WORKSPACE_MODULES: WorkspaceModule[] = [
  {
    id: "ag-docs",
    name: "AG Docs",
    description:
      "Structured document editor with intelligence tagging, multi-format export, and shareable links.",
    status: "active",
    icon: FileText,
    route: "/workspace/docs",
    accent: "bg-blue-500/15 text-blue-500",
  },
  {
    id: "ag-sheets",
    name: "AG Sheets",
    description: "Collaborative spreadsheets connected to your data intelligence layer.",
    status: "coming_soon",
    icon: Sheet,
    accent: "bg-emerald-500/15 text-emerald-500",
  },
  {
    id: "ag-slides",
    name: "AG Slides",
    description: "Boardroom-grade presentations built from live Workspace data.",
    status: "coming_soon",
    icon: Presentation,
    accent: "bg-amber-500/15 text-amber-500",
  },
  {
    id: "ag-forms",
    name: "AG Forms",
    description: "Structured data collection forms with link-based distribution.",
    status: "coming_soon",
    icon: ClipboardList,
    accent: "bg-fuchsia-500/15 text-fuchsia-500",
  },
  {
    id: "ag-drive",
    name: "AG Drive",
    description: "Unified storage layer for every Workspace document and export.",
    status: "coming_soon",
    icon: FolderOpen,
    accent: "bg-sky-500/15 text-sky-500",
  },
];
