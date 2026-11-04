import React from "react";
import { Bookmark, ExternalLink, Trash2, FolderPlus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type SavedTopicItem,
  removeSavedTopic,
  sendTopicToWorkspace,
} from "@/lib/infoDiscovery/savedTopics";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SavedTopicsDrawerProps {
  savedTopics: SavedTopicItem[];
  onRefresh: () => void;
  onClose: () => void;
}

export function SavedTopicsDrawer({ savedTopics, onRefresh, onClose }: SavedTopicsDrawerProps) {
  const navigate = useNavigate();

  const handleOpenWorkspace = async (item: SavedTopicItem) => {
    try {
      const res = await sendTopicToWorkspace({
        title: item.topicTitle,
        categoryTitle: item.categoryTitle,
        description: item.description,
        questions: item.questions,
        sources: item.sources,
        notes: item.notes,
      });
      toast.success(`Exported "${item.topicTitle}" to Workspace Docs!`);
      navigate(`/workspace/docs/${res.docId}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create document in Workspace.");
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedTopic(id);
    onRefresh();
    toast.info("Topic removed from saved list.");
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">Saved Topics in Workspace</h2>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
        >
          ✕
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Bookmark research areas, track your investigation goals, and sync findings directly with Amineva Docs.
      </p>

      <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
        {savedTopics.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground my-8">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold">No saved topics yet</p>
            <p className="mt-1 text-xs">
              Click the bookmark icon on any topic page to save it for quick access and Workspace export.
            </p>
          </div>
        ) : (
          savedTopics.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-background p-4 flex flex-col justify-between group hover:border-accent/50 transition shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {item.categoryTitle}
                  </Badge>
                  <button
                    onClick={(e) => handleRemove(item.id, e)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition"
                    title="Remove topic"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3
                  onClick={() => {
                    onClose();
                    navigate(`/info-discovery/${item.categorySlug}/${item.topicSlug}`);
                  }}
                  className="font-semibold text-sm mt-2 cursor-pointer hover:text-primary transition"
                >
                  {item.topicTitle}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate(`/info-discovery/${item.categorySlug}/${item.topicSlug}`);
                  }}
                  className="text-xs h-8"
                >
                  View Topic <ExternalLink className="ml-1 h-3 w-3" />
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleOpenWorkspace(item)}
                  className="text-xs h-8 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <FolderPlus className="mr-1 h-3.5 w-3.5" /> Keep in Workspace
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {savedTopics.length > 0 && (
        <div className="border-t border-border pt-4 mt-2">
          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
            onClick={onClose}
          >
            Close Saved Topics
          </Button>
        </div>
      )}
    </div>
  );
}
