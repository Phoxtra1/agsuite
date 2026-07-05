import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, FunctionSquare } from "lucide-react";
import { searchFunctions, FUNCTION_BY_NAME } from "@/lib/workspace/sheets/functions";

interface Props {
  activeCell: string;
  value: string;
  onCommit: (v: string) => void;
  onNameBox?: (v: string) => void; // jump to A1 or named range
  onOpenFxPicker?: () => void;
}

export function FormulaBar({ activeCell, value, onCommit, onNameBox, onOpenFxPicker }: Props) {
  const [v, setV] = useState(value);
  const [name, setName] = useState(activeCell);
  const [focused, setFocused] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  // Reverse logic: expand ONLY while typing/focused, collapse when done
  const expanded = focused && (v.length > 60 || v.includes("\n"));

  useEffect(() => setV(value), [value, activeCell]);
  useEffect(() => setName(activeCell), [activeCell]);

  const currentToken = useMemo(() => {
    if (!v.startsWith("=")) return "";
    const m = v.match(/([A-Z][A-Z0-9_.]*)$/i);
    return m ? m[1] : "";
  }, [v]);
  const suggestions = useMemo(() => (currentToken ? searchFunctions(currentToken) : []), [currentToken]);

  const paramHelper = useMemo(() => {
    if (!v.startsWith("=")) return null;
    const m = v.match(/([A-Z][A-Z0-9_]*)\(/i);
    if (!m) return null;
    const meta = FUNCTION_BY_NAME[m[1].toUpperCase()];
    return meta ?? null;
  }, [v]);

  function commit() { onCommit(v); setShowSuggest(false); }
  function insertSuggestion(fn: string) {
    const next = v.replace(/([A-Z][A-Z0-9_.]*)$/i, "") + fn + "(";
    setV(next); setShowSuggest(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="relative border-b border-border bg-card flex-shrink-0">
      <div className="flex items-stretch" style={{ minHeight: expanded ? 88 : 34 }}>
        {/* Name Box */}
        <div className="flex items-center border-r border-border">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            onBlur={() => onNameBox?.(name)}
            onKeyDown={(e) => { if (e.key === "Enter") { onNameBox?.(name); (e.target as HTMLInputElement).blur(); } }}
            className="w-24 px-2 py-1 text-xs font-mono font-semibold text-foreground bg-transparent outline-none focus:bg-muted/50 text-center"
            aria-label="Name box"
          />
          <ChevronDown className="h-3 w-3 text-muted-foreground mr-1" />
        </div>
        {/* fx */}
        <button
          onClick={onOpenFxPicker}
          className="px-2 flex items-center border-r border-border text-muted-foreground hover:text-accent hover:bg-muted"
          title="Insert function"
        >
          <FunctionSquare className="h-4 w-4" />
        </button>
        {/* Formula editor */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={v}
            onChange={(e) => { setV(e.target.value); setShowSuggest(e.target.value.startsWith("=")); }}
            onFocus={() => setShowSuggest(v.startsWith("="))}
            onBlur={() => { setTimeout(() => setShowSuggest(false), 150); commit(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); (e.target as HTMLTextAreaElement).blur(); }
              else if (e.key === "Escape") { setV(value); setShowSuggest(false); (e.target as HTMLTextAreaElement).blur(); }
              else if (e.key === "Tab" && suggestions[0]) { e.preventDefault(); insertSuggestion(suggestions[0].name); }
            }}
            placeholder="Enter a value or a formula starting with ="
            rows={expanded ? 4 : 1}
            className="w-full h-full px-3 py-1.5 text-sm bg-transparent outline-none text-foreground font-mono resize-none"
          />
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="px-2 border-l border-border text-muted-foreground hover:bg-muted flex items-center"
          title={expanded ? "Collapse formula" : "Expand formula"}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Autocomplete */}
      {showSuggest && suggestions.length > 0 && (
        <div className="absolute left-32 top-full mt-1 z-50 w-80 rounded-md border border-border bg-popover shadow-xl overflow-hidden">
          {suggestions.map((f) => (
            <button
              key={f.name}
              onMouseDown={(e) => { e.preventDefault(); insertSuggestion(f.name); }}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex flex-col border-b border-border/50 last:border-0"
            >
              <span className="text-xs font-mono font-semibold text-accent">{f.name}</span>
              <span className="text-[10.5px] text-muted-foreground truncate">{f.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Parameter helper */}
      {paramHelper && !showSuggest && (
        <div className="absolute left-32 top-full mt-1 z-40 px-3 py-1.5 rounded-md border border-border bg-popover shadow-md text-[11px]">
          <span className="font-mono text-accent font-semibold">{paramHelper.name}</span>
          <span className="text-muted-foreground ml-2 font-mono">{paramHelper.signature.replace(paramHelper.name, "")}</span>
        </div>
      )}
    </div>
  );
}
