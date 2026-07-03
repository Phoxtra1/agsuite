import { Plus, X } from "lucide-react";

interface Props {
  sheets: { name: string }[];
  active: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onRename: (i: number, name: string) => void;
  onDelete: (i: number) => void;
}

export function SheetTabs({ sheets, active, onSelect, onAdd, onRename, onDelete }: Props) {
  return (
    <div className="flex items-center h-9 bg-card border-t border-border px-2 gap-1 overflow-x-auto flex-shrink-0">
      {sheets.map((s, i) => (
        <div
          key={i}
          onClick={() => onSelect(i)}
          onDoubleClick={() => {
            const name = window.prompt("Rename sheet", s.name);
            if (name && name !== s.name) onRename(i, name);
          }}
          className={`group flex items-center gap-1 px-3 py-1 rounded-t-md text-xs cursor-pointer border-t border-l border-r ${
            i === active
              ? "bg-background border-border text-foreground font-semibold"
              : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>{s.name}</span>
          {sheets.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete sheet "${s.name}"?`)) onDelete(i); }}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <button onClick={onAdd} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
