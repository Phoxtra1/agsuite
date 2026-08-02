import React, { useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface DriveUploadDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
}

interface UploadProgressItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "queued" | "uploading" | "completed" | "failed";
}

export function DriveUploadDropzone({
  isOpen,
  onClose,
  onUpload,
}: DriveUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const newItems: UploadProgressItem[] = fileArray.map((f, i) => ({
      id: `${f.name}-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "queued",
    }));

    setUploadQueue((prev) => [...newItems, ...prev]);

    // Simulating multiple concurrent/sequential uploads with progress tracking
    for (const item of newItems) {
      const fileToUpload = fileArray.find((f) => f.name === item.name);
      if (!fileToUpload) continue;

      setUploadQueue((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "uploading" } : p))
      );

      // Simulate upload progress
      await new Promise<void>((resolve) => {
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += Math.floor(Math.random() * 20) + 10;
          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(interval);
            resolve();
          }
          setUploadQueue((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, progress: currentProgress } : p))
          );
        }, 150);
      });

      // Commit actual data upload via Prop Callback
      try {
        await onUpload([fileToUpload]);
        setUploadQueue((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "completed" } : p))
        );
      } catch (err) {
        setUploadQueue((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "failed" } : p))
        );
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
  };

  const clearQueue = () => {
    setUploadQueue([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Upload Center</DialogTitle>
          <DialogDescription className="text-xs">
            Drag and drop multiple files to register them safely inside your workspace drive.
          </DialogDescription>
        </DialogHeader>

        {/* Drag Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition duration-200 ${
            isDragging
              ? "border-sky-500 bg-sky-500/5 text-sky-500"
              : "border-border hover:border-sky-500/40 hover:bg-card/50 text-muted-foreground"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
          <Upload className="h-10 w-10 text-sky-500 mb-3" />
          <p className="text-sm font-semibold text-foreground">
            Drag files here, or <span className="text-sky-500">browse files</span>
          </p>
          <p className="text-[11px] mt-1 text-muted-foreground/80">
            Supports documents, images, video, zip archives, spreadsheets, and more.
          </p>
        </div>

        {/* Upload Status / Progress Queue */}
        {uploadQueue.length > 0 && (
          <div className="space-y-3 mt-4 max-h-56 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upload Progress
              </span>
              <button
                onClick={clearQueue}
                className="text-[11px] hover:underline text-muted-foreground"
              >
                Clear completed
              </button>
            </div>

            <div className="space-y-2">
              {uploadQueue.map((item) => (
                <div key={item.id} className="p-3 bg-muted/40 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="truncate max-w-[280px] text-foreground">{item.name}</span>
                    {item.status === "completed" && (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </span>
                    )}
                    {item.status === "failed" && (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Failed
                      </span>
                    )}
                    {item.status === "uploading" && (
                      <span className="text-sky-500 animate-pulse">{item.progress}%</span>
                    )}
                    {item.status === "queued" && <span className="text-muted-foreground">Queued</span>}
                  </div>
                  {item.status === "uploading" && (
                    <Progress value={item.progress} className="h-1.5 rounded-full [&>div]:bg-sky-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
