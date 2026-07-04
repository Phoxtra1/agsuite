import { useEffect, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SheetPage } from "@/lib/workspace/sheets/documents";
import { SheetTabContextMenu } from "./ContextMenus";

interface Props {
  sheets: SheetPage[];
  active: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onRename: (i: number, name: string) => void;
  onDelete: (i: number) => void;
  onDuplicate: (i: number) => void;
  onReorder: (from: number, to: number) => void;
  onMove: (from: number, to: number) => void;
  onColor: (i: number, color: string) => void;
  onHide: (i: number) => void;
  onProtect: (i: number) => void;
}

export function SheetTabs(props: Props) {
  const { sheets, active, onAdd } = props;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const from = sheets.findIndex((s) => s.name === a.id);
    const to = sheets.findIndex((s) => s.name === over.id);
    if (from >= 0 && to >= 0) props.onReorder(from, to);
  }

  const visible = search
    ? sheets.map((s, i) => ({ s, i })).filter(({ s }) => s.name.toLowerCase().includes(search.toLowerCase()))
    : sheets.map((s, i) => ({ s, i }));

  return (
    <div className="flex items-center h-9 bg-card border-t border-border px-2 gap-1 overflow-x-auto flex-shrink-0">
      <button onClick={onAdd} className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground" title="Add sheet">
        <Plus className="h-3.5 w-3.5" />
      </button>
      <div className="w-px h-4 bg-border mx-1" />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sheets.map((s) => s.name)} strategy={horizontalListSortingStrategy}>
          <div className="flex items-center gap-1">
            {visible.map(({ s, i }) => (
              <SortableTab key={s.name} sheet={s} index={i} active={active === i} {...props} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="ml-auto flex items-center gap-1">
        {showSearch ? (
          <div className="flex items-center gap-1 bg-muted rounded px-2 h-6">
            <Search className="h-3 w-3 text-muted-foreground" />
            <input
              autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Find sheet…" className="w-32 bg-transparent outline-none text-xs"
            />
            <button onClick={() => { setSearch(""); setShowSearch(false); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowSearch(true)} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground" title="Search sheets">
            <Search className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function SortableTab({
  sheet, index, active, onSelect, onRename, onDelete, onDuplicate, onMove, onColor, onHide, onProtect, sheets,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sheet.name });
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(sheet.name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { if (renaming) inputRef.current?.select(); }, [renaming]);

  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const commitRename = () => {
    setRenaming(false);
    if (name && name !== sheet.name) onRename(index, name);
    else setName(sheet.name);
  };

  return (
    <SheetTabContextMenu
      actions={{
        rename: () => setRenaming(true),
        duplicate: () => onDuplicate(index),
        delete: () => { if (sheets.length > 1 && confirm(`Delete sheet "${sheet.name}"?`)) onDelete(index); },
        moveLeft: () => onMove(index, Math.max(0, index - 1)),
        moveRight: () => onMove(index, Math.min(sheets.length - 1, index + 1)),
        moveStart: () => onMove(index, 0),
        moveEnd: () => onMove(index, sheets.length - 1),
        color: (c: string) => onColor(index, c),
        hide: () => onHide(index),
        protect: () => onProtect(index),
      }}
    >
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => onSelect(index)}
        onDoubleClick={() => setRenaming(true)}
        className={`group flex items-center gap-1.5 px-3 py-1 rounded-t-md text-xs cursor-pointer border-t border-l border-r select-none
          ${active ? "bg-background border-border text-foreground font-semibold" : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground"}`}
      >
        {sheet.tabColor && sheet.tabColor !== "transparent" && (
          <span className="h-2 w-2 rounded-full" style={{ background: sheet.tabColor }} />
        )}
        {renaming ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setName(sheet.name); setRenaming(false); } }}
            onClick={(e) => e.stopPropagation()}
            className="w-24 bg-white border border-accent rounded px-1 text-foreground outline-none"
          />
        ) : (
          <span>{sheet.name}</span>
        )}
        {sheets.length > 1 && !renaming && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); if (confirm(`Delete sheet "${sheet.name}"?`)) onDelete(index); }}
            className="opacity-0 group-hover:opacity-100 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </SheetTabContextMenu>
  );
}
