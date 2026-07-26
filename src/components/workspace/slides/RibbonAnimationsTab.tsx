import React, { useState } from "react";
import { Play, Sparkles, Clock, ListOrdered, PanelRight, Zap } from "lucide-react";
import { Slide, SlideElement, ElementAnimation } from "@/lib/workspace/slides/documents";

interface RibbonAnimationsTabProps {
  currentSlide: Slide;
  selectedElement: SlideElement | null;
  onUpdateElementAnimations: (animations: ElementAnimation[]) => void;
}

export function RibbonAnimationsTab({
  currentSlide,
  selectedElement,
  onUpdateElementAnimations
}: RibbonAnimationsTabProps) {
  const [showTimeline, setShowTimeline] = useState(false);

  const entranceEffects: { effect: "fade" | "flyIn" | "zoom" | "appear"; label: string }[] = [
    { effect: "fade", label: "Fade In" },
    { effect: "flyIn", label: "Fly In" },
    { effect: "zoom", label: "Zoom" },
    { effect: "appear", label: "Appear" }
  ];

  const emphasisEffects: { effect: "pulse" | "spin" | "growShrink"; label: string }[] = [
    { effect: "pulse", label: "Pulse" },
    { effect: "spin", label: "Spin" },
    { effect: "growShrink", label: "Grow / Shrink" }
  ];

  const exitEffects: { effect: "fade" | "flyOut"; label: string }[] = [
    { effect: "fade", label: "Fade Out" },
    { effect: "flyOut", label: "Fly Out" }
  ];

  const handleAddOrUpdateAnimation = (
    type: "entrance" | "emphasis" | "exit",
    effect: "fade" | "flyIn" | "zoom" | "appear" | "pulse" | "spin" | "growShrink" | "flyOut" | "motionPath"
  ) => {
    if (!selectedElement) return;

    const existingAnim = selectedElement.animations?.find((a) => a.type === type);
    const updatedAnim: ElementAnimation = {
      type,
      effect,
      duration: existingAnim?.duration ?? 0.8,
      delay: existingAnim?.delay ?? 0.0,
      trigger: existingAnim?.trigger ?? "click"
    };

    const nextAnimations = selectedElement.animations
      ? selectedElement.animations.filter((a) => a.type !== type).concat(updatedAnim)
      : [updatedAnim];

    onUpdateElementAnimations(nextAnimations);
  };

  const handleUpdateTimelineProp = (
    type: "entrance" | "emphasis" | "exit",
    patch: Partial<ElementAnimation>
  ) => {
    if (!selectedElement || !selectedElement.animations) return;
    const nextAnimations = selectedElement.animations.map((a) =>
      a.type === type ? { ...a, ...patch } : a
    );
    onUpdateElementAnimations(nextAnimations);
  };

  const handleClearAnimations = () => {
    onUpdateElementAnimations([]);
  };

  const activeEntrance = selectedElement?.animations?.find((a) => a.type === "entrance");
  const activeEmphasis = selectedElement?.animations?.find((a) => a.type === "emphasis");
  const activeExit = selectedElement?.animations?.find((a) => a.type === "exit");

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Entrance */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1.5 mb-1">
          {entranceEffects.map((eff) => (
            <button
              key={eff.effect}
              disabled={!selectedElement}
              onClick={() => handleAddOrUpdateAnimation("entrance", eff.effect)}
              className={`px-2 py-1 text-xs border rounded transition disabled:opacity-50 ${
                activeEntrance?.effect === eff.effect
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 font-bold"
                  : "border-border hover:bg-muted text-foreground"
              }`}
            >
              <Sparkles className="h-3 w-3 inline mr-1" /> {eff.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Entrance Animations</span>
      </div>

      {/* Group: Emphasis */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1.5 mb-1">
          {emphasisEffects.map((eff) => (
            <button
              key={eff.effect}
              disabled={!selectedElement}
              onClick={() => handleAddOrUpdateAnimation("emphasis", eff.effect)}
              className={`px-2 py-1 text-xs border rounded transition disabled:opacity-50 ${
                activeEmphasis?.effect === eff.effect
                  ? "border-amber-500 bg-amber-500/15 text-amber-600 font-bold"
                  : "border-border hover:bg-muted text-foreground"
              }`}
            >
              <Zap className="h-3 w-3 inline mr-1" /> {eff.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Emphasis Animations</span>
      </div>

      {/* Group: Exit */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1.5 mb-1">
          {exitEffects.map((eff) => (
            <button
              key={eff.effect}
              disabled={!selectedElement}
              onClick={() => handleAddOrUpdateAnimation("exit", eff.effect)}
              className={`px-2 py-1 text-xs border rounded transition disabled:opacity-50 ${
                activeExit?.effect === eff.effect
                  ? "border-rose-500 bg-rose-500/15 text-rose-600 font-bold"
                  : "border-border hover:bg-muted text-foreground"
              }`}
            >
              <Sparkles className="h-3 w-3 inline mr-1" /> {eff.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-rose-600 font-semibold uppercase tracking-wide">Exit Animations</span>
      </div>

      {/* Group: Timing Controls */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-3 mb-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1 h-7">
            <Clock className="h-3.5 w-3.5" /> Duration
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5.0"
              disabled={!selectedElement || (!activeEntrance && !activeEmphasis && !activeExit)}
              value={activeEntrance?.duration ?? activeEmphasis?.duration ?? activeExit?.duration ?? 0.8}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0.8;
                if (activeEntrance) handleUpdateTimelineProp("entrance", { duration: val });
                else if (activeEmphasis) handleUpdateTimelineProp("emphasis", { duration: val });
                else if (activeExit) handleUpdateTimelineProp("exit", { duration: val });
              }}
              className="w-12 border border-border bg-background rounded px-1.5 py-0.5 text-foreground font-semibold disabled:opacity-50"
            />
            s
          </label>

          <label className="text-xs text-muted-foreground flex items-center gap-1 h-7">
            Delay
            <input
              type="number"
              step="0.1"
              min="0.0"
              max="5.0"
              disabled={!selectedElement || (!activeEntrance && !activeEmphasis && !activeExit)}
              value={activeEntrance?.delay ?? activeEmphasis?.delay ?? activeExit?.delay ?? 0.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0.0;
                if (activeEntrance) handleUpdateTimelineProp("entrance", { delay: val });
                else if (activeEmphasis) handleUpdateTimelineProp("emphasis", { delay: val });
                else if (activeExit) handleUpdateTimelineProp("exit", { delay: val });
              }}
              className="w-12 border border-border bg-background rounded px-1.5 py-0.5 text-foreground font-semibold disabled:opacity-50"
            />
            s
          </label>

          <select
            disabled={!selectedElement || (!activeEntrance && !activeEmphasis && !activeExit)}
            value={activeEntrance?.trigger ?? activeEmphasis?.trigger ?? activeExit?.trigger ?? "click"}
            onChange={(e) => {
              const val = e.target.value as "click" | "afterPrevious" | "withPrevious";
              if (activeEntrance) handleUpdateTimelineProp("entrance", { trigger: val });
              else if (activeEmphasis) handleUpdateTimelineProp("emphasis", { trigger: val });
              else if (activeExit) handleUpdateTimelineProp("exit", { trigger: val });
            }}
            className="text-xs border border-border bg-background rounded px-1.5 py-1 h-7 disabled:opacity-50 text-foreground"
          >
            <option value="click">On Click</option>
            <option value="withPrevious">With Previous</option>
            <option value="afterPrevious">After Previous</option>
          </select>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Timing Controls</span>
      </div>

      {/* Group: Timeline Panel Toggle */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <div className="flex items-center gap-1.5 mb-1">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`px-3 py-1 border rounded text-xs font-semibold h-7 flex items-center gap-1.5 transition ${
              showTimeline ? "bg-accent/10 border-accent text-accent" : "border-border hover:bg-muted text-foreground"
            }`}
          >
            <PanelRight className="h-3.5 w-3.5" /> Animation Pane
          </button>
          {selectedElement && selectedElement.animations && selectedElement.animations.length > 0 && (
            <button
              onClick={handleClearAnimations}
              className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10 border border-transparent rounded h-7 font-semibold"
            >
              Clear
            </button>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Timeline & Pane</span>
      </div>

      {/* Slide-out Animation Timeline Panel */}
      {showTimeline && (
        <div className="fixed top-14 right-0 bottom-8 w-80 bg-card border-l border-border shadow-2xl z-40 p-4 flex flex-col text-foreground select-none">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4 text-accent" /> Animation Timeline
            </h4>
            <button
              onClick={() => setShowTimeline(false)}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {currentSlide.elements.map((el, index) => {
              const hasAnims = el.animations && el.animations.length > 0;
              return (
                <div key={el.id} className={`p-2.5 rounded-lg border text-xs ${hasAnims ? "border-accent bg-accent/5" : "border-border bg-muted/20 opacity-80"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold capitalize text-slate-700">
                      {index + 1}. {el.kind} element ({el.text ? `"${el.text.slice(0, 15)}..."` : "Graphic"})
                    </span>
                    {hasAnims && <span className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent font-semibold rounded">Active</span>}
                  </div>
                  {el.animations?.map((anim, idx) => (
                    <div key={idx} className="pl-3 mt-1.5 border-l-2 border-accent/40 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-medium capitalize">{anim.type} - {anim.effect}</span>
                        <span>{anim.duration}s (Delay: {anim.delay}s)</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Trigger: <span className="font-semibold text-foreground">{anim.trigger}</span></div>
                    </div>
                  ))}
                  {!hasAnims && (
                    <span className="text-[10px] text-muted-foreground block italic pl-1 mt-1">No animations configured</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
