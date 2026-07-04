# Amineva Sheets — Enterprise UX Upgrade (Turn 1 of 3)

Per your sequencing: **Sheets overhaul first**. Docs bug fixes, Dashboard recent-items sections, and realtime collaboration will follow in Turns 2 and 3. This turn keeps all existing Amineva Sheets features (HyperFormula engine, SPSS-style Analysis panel, AI intelligence edge function, XLSX/CSV I/O, sharing) and layers a professional spreadsheet interface on top.

## What ships this turn

### 1. Layout & shell
- Full-height 3-row shell: Ribbon (tabbed) → Formula bar → Grid → Sheet tabs + Status bar.
- Grid gets ~85% of viewport. Ribbon collapses to a slim mode via chevron.
- New tabbed ribbon: **Home · Insert · Data · View · Formulas · Amineva AI**, each with logical groups (Clipboard, Font, Alignment, Number, Cells, Editing…).
- Consistent 32px control height, 4px group gaps, group dividers, disabled/hover/active states, tooltips with shortcuts.

### 2. Ribbon groups (Home tab)
Clipboard (Cut/Copy/Paste/Format Painter) · Font (family, size, B/I/U, strike, color, fill, borders) · Alignment (H/V align, wrap, merge, rotation) · Number (currency, %, decimals ± , date/time, custom format) · Cells (insert/delete row/col, format) · Editing (find/replace, sort, filter, clear).
Insert tab: chart, table, image, hyperlink, comment, function. Data tab: sort, filter, validation, remove duplicates, text-to-columns. View tab: freeze rows/cols/panes, gridlines toggle, headers toggle, formula bar toggle, zoom. Formulas tab: function library grouped by category (Math, Stats, Logical, Lookup, Text, Date, Financial). Amineva AI tab: explain selection, suggest chart, generate formula, detect anomalies, clean data (already wired to `sheets-intelligence`).

### 3. Formula bar
Name Box (editable, jumps to named range or A1) · fx button (function picker dialog) · resizable formula input with syntax highlighting and function autocomplete (built from HyperFormula's function registry), parameter helper tooltip, error underline.

### 4. Right-click context menus (radix ContextMenu)
- **Cell**: Cut, Copy, Paste, Paste Special, Insert/Delete cells (shift), Insert row above/below, Insert column left/right, Delete row/column, Clear contents, Clear formatting, Merge/Split, Add comment, Insert link, Conditional formatting, Data validation, Duplicate, Hide/Unhide row+col.
- **Row header**: Insert above/below, Delete, Duplicate, Hide/Unhide, Resize, Auto-fit height, Freeze above.
- **Column header**: Insert left/right, Delete, Duplicate, Hide/Unhide, Resize, Auto-fit width, Freeze left.
- **Sheet tab**: Rename, Duplicate, Delete, Move left/right/start/end, Tab color, Hide/Unhide, Protect.

### 5. Left-click quick-action popovers
Small popover on row# / col-letter click with Insert · Delete · Duplicate · Hide · Resize. Right-click still shows the full menu.

### 6. Sheet tabs
Double-click to rename, drag-and-drop reorder (dnd-kit), context menu, tab color chip, sheet search dropdown, hidden-sheet manager, "+" affordance.

### 7. Selection & interaction
Single/range/row/column/all selection, shift-extend, ctrl-multi-range, drag-fill handle, keyboard nav (arrows, Tab/Shift-Tab, Enter, Home/End, Ctrl+arrows to edge, Ctrl+A). Copy animation (marching ants), active-cell 2px accent border, row/column header highlight, resize/drag indicators.

### 8. Editing experience
Undo/redo stack (50 steps, per-workbook). Shortcuts: Ctrl+C/V/X/Z/Y/B/I/U/S, Delete clears, F2 edit, Esc cancel. Paste Special (values / formulas / formatting).

### 9. Formula intelligence
Autocomplete popover on `=`, function signatures from HyperFormula, syntax highlight (bracket matching, string/number/ref colors), parameter helper as you type, recent + favorite functions.

### 10. Status bar (bottom)
Ready state · Selection: `12R × 3C` · Sum · Average · Min · Max · Count · Zoom slider (50–200%) · view mode toggle · Save state ("Saved · 2s ago").

### 11. Freeze panes, column/row sizing
Drag-resize on header borders, double-click to auto-fit, freeze first row / first col / custom panes via View tab. Frozen headers stay sticky during scroll.

### 12. Performance
Virtualization via `@tanstack/react-virtual` (rows + columns) — target 100k rows × 1k cols smoothly. Memoized cell renderer. HyperFormula evaluation debounced 80ms. Only visible cells re-render on selection change.

### 13. Accessibility & responsiveness
ARIA roles on grid/cells (`role="grid"`, `aria-rowindex`, `aria-colindex`), full keyboard navigation, screen-reader labels on ribbon buttons, focus rings, respects light/dark theme tokens (grid surface stays white as per intelligence-product rule). Touch: pinch-zoom, long-press = right-click, momentum scroll.

### 14. What stays untouched
`workspace_sheets` schema, share tokens, exporters (`XLSX`, CSV, JSON), Analysis panel (SPSS-style stats), `sheets-intelligence` edge function, HyperFormula engine wrapper.

---

## Technical section

### New / refactored files
- `src/pages/workspace/SheetsEditor.tsx` — new shell layout, wires ribbon tabs, formula bar, grid, tabs, status bar.
- `src/components/workspace/sheets/ribbon/` — `RibbonTabs.tsx`, `HomeTab.tsx`, `InsertTab.tsx`, `DataTab.tsx`, `ViewTab.tsx`, `FormulasTab.tsx`, `AmnivaAITab.tsx`, `RibbonGroup.tsx`, `RibbonButton.tsx`.
- `src/components/workspace/sheets/FormulaBar.tsx` — rewritten with Name Box + fx + autocomplete.
- `src/components/workspace/sheets/SheetGrid.tsx` — virtualized (tanstack-virtual), context-menu integrated, resize handles, fill handle, drag selection, freeze panes.
- `src/components/workspace/sheets/context/CellContextMenu.tsx`, `RowContextMenu.tsx`, `ColContextMenu.tsx`, `SheetTabContextMenu.tsx`.
- `src/components/workspace/sheets/StatusBar.tsx`.
- `src/components/workspace/sheets/SheetTabs.tsx` — rewritten with dnd-kit, colors, search.
- `src/components/workspace/sheets/hooks/`: `useUndoRedo.ts`, `useClipboard.ts`, `useSelection.ts`, `useKeyboardShortcuts.ts`, `useFormulaAutocomplete.ts`.
- `src/lib/workspace/sheets/functions.ts` — function registry metadata (name, category, signature, description) for autocomplete + Formulas tab.
- `src/lib/workspace/sheets/documents.ts` — extend `SheetPage` with `colWidths`, `rowHeights`, `frozenRows`, `frozenCols`, `hidden`, `tabColor`, `merges`.

### Dependencies to add
- `@tanstack/react-virtual` — grid virtualization.
- `@dnd-kit/core` + `@dnd-kit/sortable` — sheet tab reorder.
(Radix ContextMenu is already available via shadcn.)

### Non-goals this turn
- Docs pagination fixes, auto-doc-creation bug, workspace slowness → Turn 2.
- Dashboard recent-sheets/recent-docs sections → Turn 2.
- Realtime presence + live cells → Turn 3.
- Real image/chart insertion pipelines beyond stubs that open the existing Analysis/Chart panel.
- Server-side sheet protection enforcement (UI + client-side lock only this turn).

Ready to build this?
