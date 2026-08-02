import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DriveFile, getSignedUrl } from "@/lib/workspace/drive/documents";
import { getFileIcon } from "./DriveGrid";
import { FileText, Image as ImageIcon, Music, Video, FileCode } from "lucide-react";

interface DrivePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: DriveFile | null;
}

export function DrivePreviewDialog({
  isOpen,
  onClose,
  file,
}: DrivePreviewDialogProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      setLoading(true);
      getSignedUrl(file)
        .then((url) => setSignedUrl(url))
        .finally(() => setLoading(false));
    } else {
      setSignedUrl(null);
    }
  }, [file, isOpen]);

  if (!file) return null;

  const isImage = file.mime_type?.startsWith("image/");
  const isVideo = file.mime_type?.startsWith("video/");
  const isAudio = file.mime_type?.startsWith("audio/");
  const isPdf = file.mime_type?.includes("pdf");
  const isText = file.mime_type?.startsWith("text/") || file.kind === "doc";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl rounded-3xl p-6 bg-card/95 border-border shadow-2xl flex flex-col gap-4">
        <DialogHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted/60 rounded-xl shrink-0">
              {getFileIcon(file.kind, file.mime_type)}
            </div>
            <div>
              <DialogTitle className="text-base font-bold truncate max-w-[400px] text-foreground">
                {file.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {(file.size_bytes / 1024).toFixed(1)} KB • {file.kind.toUpperCase()} document
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Preview Canvas */}
        <div className="flex-1 min-h-[300px] max-h-[500px] bg-background border border-border/80 rounded-2xl overflow-hidden flex items-center justify-center relative">
          {loading ? (
            <div className="text-sm text-muted-foreground animate-pulse">Loading secure preview…</div>
          ) : isImage && signedUrl ? (
            <img src={signedUrl} alt={file.name} className="max-w-full max-h-[480px] object-contain rounded-xl" />
          ) : isVideo && signedUrl ? (
            <video src={signedUrl} controls className="max-w-full max-h-[480px] rounded-xl" />
          ) : isAudio && signedUrl ? (
            <div className="p-8 w-full flex flex-col items-center justify-center gap-4 bg-muted/20">
              <Music className="h-16 w-16 text-sky-500 animate-bounce" />
              <audio src={signedUrl} controls className="w-full max-w-md" />
            </div>
          ) : isPdf ? (
            <iframe src={signedUrl || ""} className="w-full h-[450px] border-0" title={file.name} />
          ) : isText ? (
            <div className="p-6 overflow-y-auto text-sm leading-relaxed font-mono w-full h-[400px] text-foreground text-left whitespace-pre-wrap">
              This is a secure text/markdown document inside Amineva Workspace. You are previewing in real-time. Feel free to download to run direct edits.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <FileCode className="h-14 w-14 text-sky-500/30" />
              <p className="font-semibold text-foreground text-sm">No Preview Available</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                This item type does not support instant visual previews directly inside browser. Please download the file to inspect content locally.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-border/60 pt-3 flex-row gap-4">
          <div className="text-[10px] text-muted-foreground leading-normal">
            <p>Uploaded: {new Date(file.created_at).toLocaleDateString()}</p>
            <p>Last Modified: {new Date(file.updated_at).toLocaleDateString()}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              Dismiss
            </Button>
            {signedUrl && (
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl"
                onClick={() => window.open(signedUrl, "_blank")}
              >
                Download
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
