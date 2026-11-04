import React from "react";
import { Target, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProjectGoalTrackerProps {
  mainGoal: string;
  onChangeMainGoal: (val: string) => void;
  numberToTrack: string;
  onChangeNumberToTrack: (val: string) => void;
}

export function ProjectGoalTracker({
  mainGoal,
  onChangeMainGoal,
  numberToTrack,
  onChangeNumberToTrack,
}: ProjectGoalTrackerProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 mt-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Target className="h-4 w-4 text-accent" />
        <span>Project Investigation Goals & Metrics (for Schools & Organisations)</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        Define your project's main purpose and the key number or indicator to track. This will be included in the shareable PDF export and Workspace sync.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Project Main Goal
          </label>
          <Input
            value={mainGoal}
            onChange={(e) => onChangeMainGoal(e.target.value)}
            placeholder="e.g. Evaluate suitability of vocational learning path"
            className="text-xs h-9 bg-background"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Key Number or Metric to Track
          </label>
          <div className="relative">
            <BarChart2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={numberToTrack}
              onChange={(e) => onChangeNumberToTrack(e.target.value)}
              placeholder="e.g. 85% completion rate, 3 certified competencies"
              className="pl-8 text-xs h-9 bg-background"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
