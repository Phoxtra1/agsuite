import React from "react";
import {
  Folder,
  FileText,
  Image,
  Video,
  Music,
  File,
  FileSpreadsheet,
  Presentation,
  FileJson,
  Star,
  Users,
  MoreVertical,
  Calendar,
  CloudLightning
} from "lucide-react";
import { DriveFolder, DriveFile } from "@/lib/workspace/drive/documents";

interface DriveGridProps {
  folders: DriveFolder[];
  files: DriveFile[];
  onOpenFolder: (id: string) => void;
  onOpenFile: (file: DriveFile) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveFolder | DriveFile, type: "file" | "folder") => void;
  onToggleStar: (id: string, type: "file" | "folder") => void;
}

export function getFileIcon(kind: string, mime?: string) {
  if (kind === "doc" || mime?.includes("word") || mime?.includes("text/plain")) return <FileText className="h-8 w-8 text-blue-500" />;
  if (kind === "sheet" || mime?.includes("spreadsheet") || mime?.includes("excel") || mime?.includes("csv")) return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
  if (kind === "slide" || mime?.includes("presentation") || mime?.includes("powerpoint")) return <Presentation className="h-8 w-8 text-amber-500" />;
  if (kind === "form" || mime?.includes("form")) return <FileJson className="h-8 w-8 text-fuchsia-500" />;

  if (mime?.startsWith("image/")) return <Image className="h-8 w-8 text-violet-500" />;
  if (mime?.startsWith("video/")) return <Video className="h-8 w-8 text-rose-500" />;
  if (mime?.startsWith("audio/")) return <Music className="h-8 w-8 text-indigo-500" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

export function DriveGrid({
  folders,
  files,
  onOpenFolder,
  onOpenFile,
  onContextMenu,
  onToggleStar,
}: DriveGridProps) {
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Folders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onDoubleClick={() => onOpenFolder(folder.id)}
                className="group relative flex items-center justify-between p-4 bg-card/60 hover:bg-card border border-border/80 hover:border-sky-500/40 rounded-2xl cursor-pointer select-none shadow-sm hover:shadow transition duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl bg-sky-500/10 text-sky-500`}>
                    <Folder className="h-5 w-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{folder.name}</p>
                    {folder.description && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{folder.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(folder.id, "folder");
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-500"
                  >
                    <Star className={`h-4 w-4 ${folder.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, folder, "folder");
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Files</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                onDoubleClick={() => onOpenFile(file)}
                className="group relative flex flex-col p-4 bg-card/60 hover:bg-card border border-border/80 hover:border-sky-500/40 rounded-2xl cursor-pointer select-none shadow-sm hover:shadow transition duration-200 h-44 justify-between"
              >
                {/* File Header */}
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-muted/60 rounded-2xl">
                    {getFileIcon(file.kind, file.mime_type)}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(file.id, "file");
                      }}
                      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-500"
                    >
                      <Star className={`h-4 w-4 ${file.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, file, "file");
                      }}
                      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* File Meta */}
                <div className="min-w-0 mt-3">
                  <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span>{formatBytes(file.size_bytes)}</span>
                    <span>•</span>
                    <span className="truncate">{new Date(file.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {folders.length === 0 && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-card/30 text-muted-foreground">
          <CloudLightning className="h-10 w-10 text-sky-500/40 mb-3 animate-pulse" />
          <p className="font-medium text-sm">This workspace is completely empty</p>
          <p className="text-xs mt-1 text-muted-foreground/80">Use the action dropdown to create files or folders.</p>
        </div>
      )}
    </div>
  );
}
