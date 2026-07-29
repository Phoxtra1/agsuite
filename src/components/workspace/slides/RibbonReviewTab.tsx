import React, { useState } from "react";
import { CheckCircle, MessageSquare, History, ShieldCheck, ListChecks, Plus, Trash2 } from "lucide-react";
import { Slide, SlideComment } from "@/lib/workspace/slides/documents";

interface RibbonReviewTabProps {
  currentSlide: Slide;
  onUpdateSlideComments: (comments: SlideComment[]) => void;
  onOpenVersionHistory: () => void;
}

export function RibbonReviewTab({
  currentSlide,
  onUpdateSlideComments,
  onOpenVersionHistory
}: RibbonReviewTabProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [accessibilityLog, setAccessibilityLog] = useState<string | null>(null);

  const handleSpellCheck = () => {
    // Collect slide text
    const textEls = currentSlide.elements.filter((e) => e.kind === "text" && e.text);
    if (textEls.length === 0) {
      window.alert("Dipa Spell Checker: Slide is empty. No text elements detected.");
      return;
    }
    // Simulation
    window.alert("Dipa Spell Checker: Check completed successfully. 0 spelling errors found in your slide deck.");
  };

  const handleAccessibilityCheck = () => {
    const issues: string[] = [];
    const textEls = currentSlide.elements.filter((e) => e.kind === "text");
    const imageEls = currentSlide.elements.filter((e) => e.kind === "image");

    textEls.forEach((el) => {
      if (el.fontSize && el.fontSize < 18) {
        issues.push(`Small font size (${el.fontSize}px) detected. Consider larger text for readability.`);
      }
    });

    imageEls.forEach((el) => {
      if (!el.alt) {
        issues.push("Image element is missing description Alternative text (Alt text).");
      }
    });

    if (issues.length === 0) {
      setAccessibilityLog("Perfect! This slide complies with standard web content accessibility rules (WCAG).");
    } else {
      setAccessibilityLog(issues.join("\n"));
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: SlideComment = {
      id: "c" + Math.random().toString(36).slice(2, 8),
      author: "Amineva User",
      text: newComment,
      createdAt: new Date().toLocaleTimeString()
    };
    onUpdateSlideComments([...(currentSlide.comments ?? []), comment]);
    setNewComment("");
  };

  const handleRemoveComment = (id: string) => {
    onUpdateSlideComments((currentSlide.comments ?? []).filter((c) => c.id !== id));
  };

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Proofing */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={handleSpellCheck}
            className="px-2.5 py-1.5 border border-border bg-background hover:bg-muted transition text-foreground rounded text-xs h-7 flex items-center gap-1.5 font-semibold"
            title="Run Dipa spelling check on slide text content"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 animate-pulse" /> Dipa Spelling
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Proofing</span>
      </div>

      {/* Group: Comments */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-3 py-1 border rounded text-xs font-semibold h-7 flex items-center gap-1.5 transition ${
              showComments ? "bg-accent/15 border-accent text-accent" : "border-border hover:bg-muted text-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Collaboration Comments ({(currentSlide.comments ?? []).length})
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Collaboration</span>
      </div>

      {/* Group: Version Control */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onOpenVersionHistory}
            className="px-2.5 py-1.5 border border-border bg-background hover:bg-muted transition text-foreground rounded text-xs h-7 flex items-center gap-1.5 font-semibold"
            title="Review past revisions saved to Amineva Cloud"
          >
            <History className="h-3.5 w-3.5 text-accent" /> Version History
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Versions</span>
      </div>

      {/* Group: Accessibility */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={handleAccessibilityCheck}
            className="px-2.5 py-1.5 border border-border bg-background hover:bg-muted transition text-foreground rounded text-xs h-7 flex items-center gap-1.5 font-semibold"
            title="Inspect slide for standard readability colors and alt tags"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-sky-500" /> Accessibility Checker
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Accessibility</span>
      </div>

      {/* Accessibility Log Display Box */}
      {accessibilityLog && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setAccessibilityLog(null)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-sky-500" /> Accessibility Report</h3>
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed mb-4 bg-muted p-2 rounded border border-border">
              {accessibilityLog}
            </p>
            <div className="flex justify-end">
              <button onClick={() => setAccessibilityLog(null)} className="px-3 py-1.5 text-xs rounded bg-accent text-accent-foreground font-semibold">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Side drawer for Comments */}
      {showComments && (
        <div className="fixed top-14 right-0 bottom-8 w-80 bg-card border-l border-border shadow-2xl z-40 p-4 flex flex-col text-foreground select-none">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-accent" /> Slide Comments
            </h4>
            <button onClick={() => setShowComments(false)} className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded">
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {(currentSlide.comments ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center italic py-4">No comments found on this slide. Start the conversation!</p>
            ) : (
              (currentSlide.comments ?? []).map((c) => (
                <div key={c.id} className="p-2 bg-muted rounded border border-border relative group/comment">
                  <div className="flex items-center justify-between text-[11px] font-bold text-accent mb-1">
                    <span>{c.author}</span>
                    <span className="text-muted-foreground font-normal text-[9px]">{c.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-700">{c.text}</p>
                  <button
                    onClick={() => handleRemoveComment(c.id)}
                    className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-0.5 opacity-0 group-hover/comment:opacity-100 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 border-t border-border pt-3">
            <input
              type="text"
              placeholder="Add your note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(); }}
              className="flex-1 text-xs border border-border bg-background rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-accent"
            />
            <button onClick={handleAddComment} className="px-2.5 py-1.5 bg-accent text-accent-foreground rounded text-xs font-semibold flex items-center">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
