import React from "react";
import {
  FolderOpen,
  Trash,
  Trash2,
  Star,
  FileEdit,
  Download,
  Share2,
  Eye,
  FolderInput,
  Info
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DriveFolder, DriveFile } from "@/lib/workspace/drive/documents";

interface DriveContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  targetItem: DriveFolder | DriveFile | null;
  targetType: "file" | "folder" | null;
  onOpen: (item: any, type: "file" | "folder") => void;
  onRename: (item: any, type: "file" | "folder") => void;
  onMove: (item: any, type: "file" | "folder") => void;
  onToggleStar: (id: string, type: "file" | "folder") => void;
  onShare: (item: any) => void;
  onDownload: (file: DriveFile) => void;
  onTrash: (id: string, type: "file" | "folder") => void;
  onDetails: (item: any, type: "file" | "folder") => void;
}

export function DriveContextMenu({
  isOpen,
  onClose,
  position,
  targetItem,
  targetType,
  onOpen,
  onRename,
  onMove,
  onToggleStar,
  onShare,
  onDownload,
  onTrash,
  onDetails,
}: DriveContextMenuProps) {
  if (!isOpen || !targetItem || !targetType) return null;

  const isFolder = targetType === "folder";
  const isStarred = targetItem.starred;

  return (
    <div
      className="fixed z-50 bg-popover rounded-xl shadow-xl border border-border/80 w-52 py-1"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => { onOpen(targetItem, targetType); onClose(); }}
        className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2"
      >
        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Open</span>
      </button>

      {!isFolder && (
        <button
          onClick={() => { onOpen(targetItem, targetType); onClose(); }}
          className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2"
        >
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Quick Preview</span>
        </button>
      )}

      <button
        onClick={() => { onToggleStar(targetItem.id, targetType); onClose(); }}
        className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2"
      >
        <Star className={`h-3.5 w-3.5 ${isStarred ? "text-amber-500 fill-current" : "text-muted-foreground"}`} />
        <span>{isStarred ? "Starred" : "Star Item"}</span>
      </button>

      <DropdownMenuSeparator className="my-1 border-t border-border" />

      <button
        onClick={() => { onRename(targetItem, targetType); onClose(); }}
        className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2"
      >
        <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Rename</span>
      </button>

      <button
        onClick={() => { onMove(targetItem, targetType); onClose(); }}
        className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2"
      >
        <FolderInput className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Move or Copy</span>
      </button>

      {!isFolder && (
        <>
          <button
            onClick={() => { onShare(targetItem); onClose(); }}
            className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2"
          >
            <Share2 className="h-3.5 w-3.5 text-sky-500" />
            <span>Share Link</span>
          </button>

          <button
            onClick={() => { onDownload(targetItem as DriveFile); onClose(); }}
            className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Download</span>
          </button>
        </>
      )}

      <DropdownMenuSeparator className="my-1 border-t border-border" />

      <button
        onClick={() => { onDetails(targetItem, targetType); onClose(); }}
        className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2"
      >
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
        <span>View Details</span>
      </button>

      <button
        onClick={() => { onTrash(targetItem.id, targetType); onClose(); }}
        className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-destructive/10 text-destructive flex items-center gap-2"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Move to Trash</span>
      </button>
    </div>
  );
}
