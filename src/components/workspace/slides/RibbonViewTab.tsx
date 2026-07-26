import React from "react";
import { Layout, Grid, Ruler, Eye, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface RibbonViewTabProps {
  currentView: "normal" | "sorter" | "reading";
  onSetView: (view: "normal" | "sorter" | "reading") => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  zoomPercent: number;
  onZoomPercentChange: (z: number) => void;
}

export function RibbonViewTab({
  currentView,
  onSetView,
  showRuler,
  onToggleRuler,
  showGrid,
  onToggleGrid,
  showGuides,
  onToggleGuides,
  zoomPercent,
  onZoomPercentChange
}: RibbonViewTabProps) {
  const views: { id: "normal" | "sorter" | "reading"; label: string; icon: any }[] = [
    { id: "normal", label: "Normal View", icon: Layout },
    { id: "sorter", label: "Slide Sorter", icon: Grid },
    { id: "reading", label: "Reading View", icon: Eye }
  ];

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Presentation Views */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => onSetView(v.id)}
                className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 transition ${
                  currentView === v.id
                    ? "border-accent bg-accent/15 text-accent font-bold"
                    : "border-border hover:bg-muted text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {v.label}
              </button>
            );
          })}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Presentation Views</span>
      </div>

      {/* Group: Show / Hide Toggles */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-3 mb-1 h-7 text-xs">
          <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={showRuler}
              onChange={onToggleRuler}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <Ruler className="h-3.5 w-3.5" /> Ruler
          </label>
          <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={onToggleGrid}
              className="rounded border-border text-accent focus:ring-accent"
            />
            Gridlines
          </label>
          <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={onToggleGuides}
              className="rounded border-border text-accent focus:ring-accent"
            />
            Guides
          </label>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Display Elements</span>
      </div>

      {/* Group: Zoom Controls */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <div className="flex items-center gap-2 mb-1 h-7 text-xs">
          <button
            onClick={() => onZoomPercentChange(Math.max(20, zoomPercent - 10))}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="font-bold text-slate-700 w-10 text-center">{zoomPercent}%</span>
          <button
            onClick={() => onZoomPercentChange(Math.min(150, zoomPercent + 10))}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => onZoomPercentChange(50)}
            className="text-[10px] font-bold text-accent border border-accent/20 hover:bg-accent/10 px-1.5 py-0.5 rounded"
          >
            Fit Page
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Zoom Controls</span>
      </div>
    </div>
  );
}
