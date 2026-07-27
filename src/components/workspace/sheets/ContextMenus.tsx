import { ReactNode } from "react";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
} from "@/components/ui/context-menu";

interface Actions {
  cut: () => void; copy: () => void; paste: () => void;
  pasteValuesOnly: () => void;
  pasteFormatsOnly: () => void;
  insertRowAbove: () => void; insertRowBelow: () => void;
  insertColLeft: () => void; insertColRight: () => void;
  deleteRow: () => void; deleteCol: () => void;
  clearContents: () => void; clearFormat: () => void;
  mergeCells: () => void;
  mergeHorizontal: () => void;
  mergeVertical: () => void;
  splitCells: () => void;
  addComment: () => void; insertLink: () => void;
  conditionalFormat: () => void; dataValidation: () => void;
  duplicate: () => void; hideRow: () => void; hideCol: () => void;
}

export function CellContextMenu({ children, actions }: { children: ReactNode; actions: Actions }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        <ContextMenuItem onClick={actions.cut}>Cut <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+X</span></ContextMenuItem>
        <ContextMenuItem onClick={actions.copy}>Copy <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+C</span></ContextMenuItem>
        <ContextMenuItem onClick={actions.paste}>Paste <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+V</span></ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Paste special…</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={actions.pasteValuesOnly}>Paste values only</ContextMenuItem>
            <ContextMenuItem onClick={actions.pasteFormatsOnly}>Paste formatting only</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Insert</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={actions.insertRowAbove}>Row above</ContextMenuItem>
            <ContextMenuItem onClick={actions.insertRowBelow}>Row below</ContextMenuItem>
            <ContextMenuItem onClick={actions.insertColLeft}>Column left</ContextMenuItem>
            <ContextMenuItem onClick={actions.insertColRight}>Column right</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Delete</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={actions.deleteRow}>Row</ContextMenuItem>
            <ContextMenuItem onClick={actions.deleteCol}>Column</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onClick={actions.duplicate}>Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={actions.clearContents}>Clear contents <span className="ml-auto text-[10px] text-muted-foreground">Del</span></ContextMenuItem>
        <ContextMenuItem onClick={actions.clearFormat}>Clear formatting</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Merge cells</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={actions.mergeCells}>Merge block</ContextMenuItem>
            <ContextMenuItem onClick={actions.mergeHorizontal}>Merge horizontally</ContextMenuItem>
            <ContextMenuItem onClick={actions.mergeVertical}>Merge vertically</ContextMenuItem>
            <ContextMenuItem onClick={actions.splitCells}>Unmerge cells</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={actions.addComment}>Add comment</ContextMenuItem>
        <ContextMenuItem onClick={actions.insertLink}>Insert link</ContextMenuItem>
        <ContextMenuItem onClick={actions.conditionalFormat}>Conditional formatting</ContextMenuItem>
        <ContextMenuItem onClick={actions.dataValidation}>Data validation</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={actions.hideRow}>Hide row</ContextMenuItem>
        <ContextMenuItem onClick={actions.hideCol}>Hide column</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface RowActions {
  insertAbove: () => void; insertBelow: () => void; delete: () => void; duplicate: () => void;
  hide: () => void; unhide: () => void; resize: () => void; autoFit: () => void;
  freezeAbove: () => void; protect: () => void;
}

export function RowContextMenu({ children, actions }: { children: ReactNode; actions: RowActions }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={actions.insertAbove}>Insert row above</ContextMenuItem>
        <ContextMenuItem onClick={actions.insertBelow}>Insert row below</ContextMenuItem>
        <ContextMenuItem onClick={actions.delete}>Delete row</ContextMenuItem>
        <ContextMenuItem onClick={actions.duplicate}>Duplicate row</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={actions.hide}>Hide row</ContextMenuItem>
        <ContextMenuItem onClick={actions.unhide}>Unhide row</ContextMenuItem>
        <ContextMenuItem onClick={actions.resize}>Resize row…</ContextMenuItem>
        <ContextMenuItem onClick={actions.autoFit}>Auto-fit height</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={actions.freezeAbove}>Freeze above</ContextMenuItem>
        <ContextMenuItem onClick={actions.protect}>Protect row</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface ColActions {
  insertLeft: () => void; insertRight: () => void; delete: () => void; duplicate: () => void;
  hide: () => void; unhide: () => void; resize: () => void; autoFit: () => void;
  freezeLeft: () => void; protect: () => void;
}
export function ColContextMenu({ children, actions }: { children: ReactNode; actions: ColActions }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={actions.insertLeft}>Insert column left</ContextMenuItem>
        <ContextMenuItem onClick={actions.insertRight}>Insert column right</ContextMenuItem>
        <ContextMenuItem onClick={actions.delete}>Delete column</ContextMenuItem>
        <ContextMenuItem onClick={actions.duplicate}>Duplicate column</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={actions.hide}>Hide column</ContextMenuItem>
        <ContextMenuItem onClick={actions.unhide}>Unhide column</ContextMenuItem>
        <ContextMenuItem onClick={actions.resize}>Resize column…</ContextMenuItem>
        <ContextMenuItem onClick={actions.autoFit}>Auto-fit width</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={actions.freezeLeft}>Freeze left</ContextMenuItem>
        <ContextMenuItem onClick={actions.protect}>Protect column</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface SheetTabActions {
  rename: () => void; duplicate: () => void; delete: () => void;
  moveLeft: () => void; moveRight: () => void; moveStart: () => void; moveEnd: () => void;
  color: (c: string) => void; hide: () => void; protect: () => void;
}
export function SheetTabContextMenu({ children, actions }: { children: ReactNode; actions: SheetTabActions }) {
  const colors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "transparent"];
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={actions.rename}>Rename</ContextMenuItem>
        <ContextMenuItem onClick={actions.duplicate}>Duplicate</ContextMenuItem>
        <ContextMenuItem onClick={actions.delete}>Delete</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={actions.moveLeft}>Move left</ContextMenuItem>
        <ContextMenuItem onClick={actions.moveRight}>Move right</ContextMenuItem>
        <ContextMenuItem onClick={actions.moveStart}>Move to beginning</ContextMenuItem>
        <ContextMenuItem onClick={actions.moveEnd}>Move to end</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Tab color</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <div className="grid grid-cols-4 gap-1 p-2">
              {colors.map((c) => (
                <button key={c} onClick={() => actions.color(c)}
                  className="h-6 w-6 rounded border border-border"
                  style={{ background: c === "transparent" ? "repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 8px 8px" : c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onClick={actions.hide}>Hide sheet</ContextMenuItem>
        <ContextMenuItem onClick={actions.protect}>Protect sheet</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
