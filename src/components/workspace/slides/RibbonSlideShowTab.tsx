import React, { useState, useEffect } from "react";
import { Play, Tv, Presentation, Volume2, Clock, MonitorPlay, Keyboard } from "lucide-react";
import { Slide } from "@/lib/workspace/slides/documents";

interface RibbonSlideShowTabProps {
  currentSlideIndex: number;
  onStartPresentation: (fromIndex: number) => void;
  onTogglePresenterMode: () => void;
  presenterModeActive: boolean;
}

export function RibbonSlideShowTab({
  currentSlideIndex,
  onStartPresentation,
  onTogglePresenterMode,
  presenterModeActive
}: RibbonSlideShowTabProps) {
  const [timerCount, setTimerCount] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerCount((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Start Slideshow */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => onStartPresentation(0)}
            className="px-2.5 py-1.5 bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition rounded text-xs h-7 flex items-center gap-1.5"
            title="Start slide show from first slide (F5)"
          >
            <Play className="h-3.5 w-3.5" /> From Beginning
          </button>
          <button
            onClick={() => onStartPresentation(currentSlideIndex)}
            className="px-2.5 py-1.5 border border-border bg-background hover:bg-muted transition text-foreground rounded text-xs h-7 flex items-center gap-1.5"
            title="Start slide show from current active slide (Shift+F5)"
          >
            <Tv className="h-3.5 w-3.5 text-accent" /> From Current
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Start Slideshow</span>
      </div>

      {/* Group: Presenter Mode */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onTogglePresenterMode}
            className={`px-3 py-1 border rounded text-xs font-semibold h-7 flex items-center gap-1.5 transition ${
              presenterModeActive ? "bg-accent/15 border-accent text-accent font-bold" : "border-border hover:bg-muted text-foreground"
            }`}
            title="Toggle presenter overlay with notes, timer, and next slide preview"
          >
            <MonitorPlay className="h-3.5 w-3.5" /> Presenter View Mode
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Presenter View</span>
      </div>

      {/* Group: Timer & Remote */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <div className="flex items-center gap-3 mb-1 h-7">
          <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded text-xs font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span>{formatTime(timerCount)}</span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="text-[10px] uppercase font-bold text-accent hover:underline ml-1"
            >
              {timerRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => { setTimerCount(0); setTimerRunning(false); }}
              className="text-[10px] uppercase font-bold text-muted-foreground hover:underline ml-1"
            >
              Reset
            </button>
          </div>

          <button
            onClick={() => window.alert("Keyboard navigation guide: Use Left/Right Arrow or Spacebar to change slides. Escape to exit fullscreen.")}
            className="p-1 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Keyboard Remote Nav Support Guide"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Timer & Nav Guidance</span>
      </div>
    </div>
  );
}
