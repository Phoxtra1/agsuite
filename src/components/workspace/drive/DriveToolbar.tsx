import React from "react";
import {
  FolderPlus,
  Upload,
  Grid,
  List,
  ArrowUpDown,
  FileCode,
  Plus,
  Sparkles,
  FileText,
  Presentation,
  Sheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DriveToolbarProps {
  viewMode: "grid" | "list";
  onToggleViewMode: () => void;
  onNewFolder: () => void;
  onUploadFile: () => void;
  onImportDocument: (type: "doc" | "sheet" | "slide" | "form") => void;
  sortField: string;
  onSortChange: (field: string) => void;
  onOpenDipaAI: () => void;
}

export function DriveToolbar({
  viewMode,
  onToggleViewMode,
  onNewFolder,
  onUploadFile,
  onImportDocument,
  sortField,
  onSortChange,
  onOpenDipaAI,
}: DriveToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
      {/* Creation and Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> New Action
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl">
            <DropdownMenuLabel>Create New</DropdownMenuLabel>
            <DropdownMenuItem onClick={onNewFolder} className="gap-2 cursor-pointer">
              <FolderPlus className="h-4 w-4 text-sky-500" />
              <span>New Folder</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onUploadFile} className="gap-2 cursor-pointer">
              <Upload className="h-4 w-4 text-emerald-500" />
              <span>Upload File</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Import Amineva Suite Docs</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onImportDocument("doc")} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Amineva Doc</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onImportDocument("sheet")} className="gap-2 cursor-pointer">
              <Sheet className="h-4 w-4 text-emerald-500" />
              <span>Amineva Sheet</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onImportDocument("slide")} className="gap-2 cursor-pointer">
              <Presentation className="h-4 w-4 text-amber-500" />
              <span>Amineva Slide</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          onClick={onOpenDipaAI}
          className="border-accent/30 hover:border-accent text-foreground gap-2 rounded-xl bg-accent/5 hover:bg-accent/10"
        >
          <Sparkles className="h-4 w-4 text-accent" /> Dipa AI
        </Button>
      </div>

      {/* Sorting, View Toggle, Configuration buttons */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {/* Sort drop down */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 rounded-lg text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Sort: {sortField.toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-lg">
            <DropdownMenuItem onClick={() => onSortChange("name")} className="cursor-pointer">Name</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("date")} className="cursor-pointer">Modified Date</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("size")} className="cursor-pointer">Size</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("type")} className="cursor-pointer">Type</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Grid/List View toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleViewMode}
          title={viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
          className="h-8 w-8 rounded-lg"
        >
          {viewMode === "grid" ? (
            <List className="h-4.5 w-4.5 text-muted-foreground" />
          ) : (
            <Grid className="h-4.5 w-4.5 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}
