import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-stretch border-r border-border pr-2 mr-1 last:border-r-0">
      <div className="flex items-center gap-0.5 flex-wrap min-h-[36px]">{children}</div>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground text-center mt-0.5 select-none">
        {label}
      </span>
    </div>
  );
}

interface BtnProps {
  onClick?: () => void;
  title?: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  compact?: boolean;
}

export function RibbonButton({ onClick, title, shortcut, active, disabled, children, compact }: BtnProps) {
  const el = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-8 ${compact ? "w-8 px-0" : "px-2"} rounded flex items-center justify-center gap-1 text-[11px] transition
        ${active ? "bg-accent/20 text-accent" : "text-foreground hover:bg-muted"}
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
  if (!title) return el;
  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{el}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-[11px]">
          <div className="flex items-center gap-2">
            <span>{title}</span>
            {shortcut && <span className="opacity-60 font-mono">{shortcut}</span>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function RibbonColorPicker({ icon, title, onPick }: { icon: ReactNode; title: string; onPick: (color: string) => void }) {
  return (
    <label
      className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center cursor-pointer text-foreground"
      title={title}
    >
      {icon}
      <input type="color" className="sr-only" onChange={(e) => onPick(e.target.value)} />
    </label>
  );
}
