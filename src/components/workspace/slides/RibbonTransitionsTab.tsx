import React from "react";
import { Play, Volume2, Clock, Sparkles } from "lucide-react";
import { Slide } from "@/lib/workspace/slides/documents";

interface RibbonTransitionsTabProps {
  currentSlide: Slide;
  onUpdateTransition: (transition: "none" | "fade" | "slide" | "push" | "morph", duration?: number, sound?: string) => void;
  onApplyTransitionToAll: () => void;
}

export function RibbonTransitionsTab({
  currentSlide,
  onUpdateTransition,
  onApplyTransitionToAll
}: RibbonTransitionsTabProps) {
  const transitions: { id: "none" | "fade" | "slide" | "push" | "morph"; label: string; desc: string }[] = [
    { id: "none", label: "None", desc: "No slide transition" },
    { id: "fade", label: "Fade", desc: "Smooth dissolve" },
    { id: "slide", label: "Slide", desc: "Slide from right" },
    { id: "push", label: "Push", desc: "Push old slide out" },
    { id: "morph", label: "Morph Style", desc: "Animate matching shapes" }
  ];

  const sounds = ["None", "Chime", "Click", "Whoosh", "Drum Roll", "Laser"];

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Transition Gallery */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          {transitions.map((t) => (
            <button
              key={t.id}
              onClick={() => onUpdateTransition(t.id, currentSlide.transitionDuration ?? 0.5, currentSlide.transitionSound ?? "None")}
              className={`px-3 py-1.5 rounded border text-xs font-semibold text-left transition flex items-center gap-1 ${
                currentSlide.transition === t.id
                  ? "border-accent bg-accent/15 text-accent font-bold"
                  : "border-border hover:bg-muted text-foreground"
              }`}
              title={t.desc}
            >
              <Sparkles className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Transition Gallery</span>
      </div>

      {/* Group: Timing Controls */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-3 mb-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5 h-7">
            <Clock className="h-3.5 w-3.5" /> Duration
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5.0"
              value={currentSlide.transitionDuration ?? 0.5}
              onChange={(e) => onUpdateTransition(currentSlide.transition ?? "fade", parseFloat(e.target.value) || 0.5, currentSlide.transitionSound ?? "None")}
              className="w-14 border border-border bg-background rounded px-1.5 py-0.5 text-foreground font-semibold"
            />
            s
          </label>

          <label className="text-xs text-muted-foreground flex items-center gap-1.5 h-7">
            <Volume2 className="h-3.5 w-3.5" /> Sound
            <select
              value={currentSlide.transitionSound ?? "None"}
              onChange={(e) => onUpdateTransition(currentSlide.transition ?? "fade", currentSlide.transitionDuration ?? 0.5, e.target.value)}
              className="border border-border bg-background rounded px-1.5 py-0.5 text-foreground font-semibold"
            >
              {sounds.map((sound) => (
                <option key={sound} value={sound}>{sound}</option>
              ))}
            </select>
          </label>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Timing</span>
      </div>

      {/* Group: Apply To All */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <button
          onClick={onApplyTransitionToAll}
          className="px-3 py-1 bg-accent text-accent-foreground hover:bg-accent/90 transition rounded text-xs font-semibold h-7 flex items-center gap-1.5"
          title="Apply current transition settings to all slides"
        >
          <Play className="h-3.5 w-3.5" /> Apply To All Slides
        </button>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Batch</span>
      </div>
    </div>
  );
}
