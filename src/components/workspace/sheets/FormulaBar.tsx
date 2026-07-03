import { useEffect, useState } from "react";
import { FunctionSquare } from "lucide-react";

interface Props {
  activeCell: string;
  value: string;
  onCommit: (v: string) => void;
}

export function FormulaBar({ activeCell, value, onCommit }: Props) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value, activeCell]);
  return (
    <div className="flex items-stretch border-b border-border bg-card h-9">
      <div className="px-3 flex items-center gap-2 border-r border-border min-w-[100px]">
        <span className="text-xs font-mono font-semibold text-foreground">{activeCell}</span>
      </div>
      <div className="px-2 flex items-center border-r border-border text-muted-foreground">
        <FunctionSquare className="h-4 w-4" />
      </div>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onCommit(v)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
          else if (e.key === "Escape") { setV(value); (e.target as HTMLInputElement).blur(); }
        }}
        placeholder="Enter a value or a formula starting with ="
        className="flex-1 px-3 text-sm bg-transparent outline-none text-foreground font-mono"
      />
    </div>
  );
}
