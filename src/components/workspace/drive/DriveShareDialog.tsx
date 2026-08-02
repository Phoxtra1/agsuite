import React, { useState } from "react";
import { Copy, Link, Check, Mail, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { createShare, DriveFile } from "@/lib/workspace/drive/documents";

interface DriveShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: DriveFile | null;
}

export function DriveShareDialog({
  isOpen,
  onClose,
  file,
}: DriveShareDialogProps) {
  const [accessLevel, setAccessLevel] = useState<"view" | "edit">("view");
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [loading, setLoading] = useState(false);

  const generateLink = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const pathToken = await createShare(file.id, accessLevel);
      if (pathToken) {
        const fullUrl = window.location.origin + pathToken;
        setShareLink(fullUrl);
        toast({
          title: "Share Link Generated",
          description: "Your secure workspace file access is active.",
        });
      }
    } catch (e) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate share link, try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Secure sharing URL copied successfully to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Link className="h-5 w-5 text-sky-500" /> Secure Link Sharing
          </DialogTitle>
          <DialogDescription className="text-xs">
            Generate and configure temporary web links for sharing document files externally.
          </DialogDescription>
        </DialogHeader>

        {/* Access Permissions Configurator */}
        <div className="space-y-4 py-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Access level</label>
            <div className="flex gap-2">
              <Button
                variant={accessLevel === "view" ? "default" : "outline"}
                onClick={() => {
                  setAccessLevel("view");
                  setShareLink("");
                }}
                className={`flex-1 rounded-xl text-xs ${accessLevel === "view" ? "bg-sky-500 hover:bg-sky-600 text-white" : ""}`}
              >
                Viewer
              </Button>
              <Button
                variant={accessLevel === "edit" ? "default" : "outline"}
                onClick={() => {
                  setAccessLevel("edit");
                  setShareLink("");
                }}
                className={`flex-1 rounded-xl text-xs ${accessLevel === "edit" ? "bg-sky-500 hover:bg-sky-600 text-white" : ""}`}
              >
                Editor
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {shareLink ? (
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="rounded-xl bg-muted/30 border-border text-xs focus-visible:ring-sky-500"
                />
                <Button onClick={copyToClipboard} size="icon" className="shrink-0 rounded-xl bg-sky-500 hover:bg-sky-600 text-white">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Button
                onClick={generateLink}
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs"
              >
                {loading ? "Generating Link…" : "Generate Share Link"}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-border/60 pt-3 flex-row text-[10px] text-muted-foreground leading-normal">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Optional expiry automatically sets inside link generation protocol.</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
