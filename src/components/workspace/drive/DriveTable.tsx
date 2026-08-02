import React from "react";
import {
  Folder,
  Star,
  MoreVertical,
  FileText,
  ChevronRight,
  ShieldCheck,
  Globe
} from "lucide-react";
import { DriveFolder, DriveFile } from "@/lib/workspace/drive/documents";
import { getFileIcon } from "./DriveGrid";

interface DriveTableProps {
  folders: DriveFolder[];
  files: DriveFile[];
  onOpenFolder: (id: string) => void;
  onOpenFile: (file: DriveFile) => void;
  onContextMenu: (e: React.MouseEvent, item: DriveFolder | DriveFile, type: "file" | "folder") => void;
  onToggleStar: (id: string, type: "file" | "folder") => void;
}

export function DriveTable({
  folders,
  files,
  onOpenFolder,
  onOpenFile,
  onContextMenu,
  onToggleStar,
}: DriveTableProps) {
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="border border-border rounded-2xl bg-card/40 overflow-hidden animate-fade-in shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/35">
              <th className="py-3 px-4 w-8"></th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4 hidden sm:table-cell">Owner</th>
              <th className="py-3 px-4 hidden md:table-cell">Type</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4 hidden lg:table-cell">Last Modified</th>
              <th className="py-3 px-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {/* Render Folders */}
            {folders.map((folder) => (
              <tr
                key={folder.id}
                onDoubleClick={() => onOpenFolder(folder.id)}
                className="hover:bg-muted/40 cursor-pointer group transition duration-150"
              >
                <td className="py-3 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(folder.id, "folder");
                    }}
                    className="text-muted-foreground hover:text-amber-500 transition duration-150"
                  >
                    <Star className={`h-4 w-4 ${folder.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                </td>
                <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-3">
                  <Folder className="h-4.5 w-4.5 text-sky-500 fill-current" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">{folder.name}</span>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground text-xs font-medium">Me</td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs font-medium">Folder</td>
                <td className="py-3 px-4 text-muted-foreground text-xs font-medium">—</td>
                <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-xs font-medium">
                  {new Date(folder.updated_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, folder, "folder");
                    }}
                    className="p-1 hover:bg-muted rounded text-muted-foreground opacity-0 group-hover:opacity-100 transition duration-150"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Render Files */}
            {files.map((file) => (
              <tr
                key={file.id}
                onDoubleClick={() => onOpenFile(file)}
                className="hover:bg-muted/40 cursor-pointer group transition duration-150"
              >
                <td className="py-3 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(file.id, "file");
                    }}
                    className="text-muted-foreground hover:text-amber-500 transition duration-150"
                  >
                    <Star className={`h-4 w-4 ${file.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                </td>
                <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-3">
                  <div className="shrink-0">{getFileIcon(file.kind, file.mime_type)}</div>
                  <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground text-xs font-medium">Me</td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs font-medium uppercase truncate max-w-[120px]">
                  {file.kind}
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs font-medium">{formatBytes(file.size_bytes)}</td>
                <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-xs font-medium">
                  {new Date(file.updated_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, file, "file");
                    }}
                    className="p-1 hover:bg-muted rounded text-muted-foreground opacity-0 group-hover:opacity-100 transition duration-150"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {folders.length === 0 && files.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No items found in this section.
        </div>
      )}
    </div>
  );
}
