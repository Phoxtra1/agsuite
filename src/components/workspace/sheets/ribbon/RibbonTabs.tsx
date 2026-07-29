import { useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Type, PaintBucket,
  AlignLeft, AlignCenter, AlignRight, WrapText,
  Hash, DollarSign, Percent, Calendar, Clock,
  Rows3, Columns3, Trash2, Copy, Scissors, Clipboard,
  Paintbrush, ArrowUpDown, Filter, Search, Undo2, Redo2, Save,
  BarChart3, Table2, Image as ImageIcon, Link as LinkIcon, MessageSquare, FunctionSquare,
  Sparkles, Snowflake, Grid3x3, ZoomIn, PanelTopClose, TrendingUp, Wand2, ChevronDown,
  Merge, Plus, Minus,
} from "lucide-react";
import { RibbonGroup, RibbonButton, RibbonColorPicker } from "./RibbonButton";
import { FUNCTIONS } from "@/lib/workspace/sheets/functions";
import type { CellFormat } from "@/lib/workspace/sheets/documents";

export type RibbonTab = "home" | "insert" | "data" | "view" | "formulas" | "ai";

export interface RibbonActions {
  format: (patch: Partial<CellFormat>) => void;
  clipboard: { cut: () => void; copy: () => void; paste: () => void; painter: () => void };
  edit: { undo: () => void; redo: () => void; save: () => void; canUndo: boolean; canRedo: boolean };
  cells: {
    insertRowAbove: () => void; insertRowBelow: () => void;
    insertColLeft: () => void; insertColRight: () => void;
    deleteRow: () => void; deleteCol: () => void;
    clearContents: () => void; clearFormat: () => void;
    mergeCells: () => void;
  };
  data: { sortAsc: () => void; sortDesc: () => void; toggleFilter: () => void; find: () => void };
  view: {
    freezeRow: () => void; freezeCol: () => void; unfreeze: () => void;
    toggleGridlines: () => void; toggleHeaders: () => void; toggleFormulaBar: () => void;
    gridlines: boolean; headers: boolean; formulaBar: boolean;
  };
  insert: { chart: () => void; func: () => void; image: () => void; link: () => void; comment: () => void; table: () => void };
  ai: { summarize: () => void; suggestChart: () => void; anomalies: () => void; cleanup: () => void; formula: () => void };
  formula: (name: string) => void;
}

const TABS: { id: RibbonTab; label: string }[] = [
  { id: "home", label: "Home" }, { id: "insert", label: "Insert" },
  { id: "data", label: "Data" }, { id: "view", label: "View" },
  { id: "formulas", label: "Formulas" }, { id: "ai", label: "Odeneho" },
];

export function RibbonTabs({ actions }: { actions: RibbonActions }) {
  const [tab, setTab] = useState<RibbonTab>("home");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-b border-border bg-card flex-shrink-0">
      <div className="flex items-center h-8 px-2 border-b border-border/60">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setCollapsed(false); }}
            className={`px-3 h-7 text-[11.5px] font-medium rounded-t transition
              ${tab === t.id && !collapsed ? "bg-background text-accent border-b-2 border-accent -mb-px" : "text-muted-foreground hover:text-foreground"}
              ${t.id === "ai" ? "flex items-center gap-1" : ""}`}
          >
            {t.id === "ai" && <Sparkles className="h-3 w-3" />}
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"
            title={collapsed ? "Expand ribbon" : "Collapse ribbon"}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="h-16 flex items-center px-2 gap-1 overflow-x-auto">
          {tab === "home" && <HomeTab actions={actions} />}
          {tab === "insert" && <InsertTab actions={actions} />}
          {tab === "data" && <DataTab actions={actions} />}
          {tab === "view" && <ViewTab actions={actions} />}
          {tab === "formulas" && <FormulasTab actions={actions} />}
          {tab === "ai" && <AiTab actions={actions} />}
        </div>
      )}
    </div>
  );
}

function HomeTab({ actions: a }: { actions: RibbonActions }) {
  return (
    <>
      <RibbonGroup label="Clipboard">
        <RibbonButton title="Cut" shortcut="Ctrl+X" onClick={a.clipboard.cut} compact><Scissors className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Copy" shortcut="Ctrl+C" onClick={a.clipboard.copy} compact><Copy className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Paste" shortcut="Ctrl+V" onClick={a.clipboard.paste} compact><Clipboard className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Format Painter" onClick={a.clipboard.painter} compact><Paintbrush className="h-3.5 w-3.5" /></RibbonButton>
      </RibbonGroup>

      <RibbonGroup label="Font">
        <select
          onChange={(e) => a.format({ fontFamily: e.target.value })}
          className="h-8 text-[11px] border border-border rounded bg-background px-1 focus:outline-none focus:ring-1 focus:ring-accent font-medium text-foreground max-w-[80px]"
          title="Font family"
          defaultValue="Inter"
        >
          <option value="sans-serif">Sans-Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Roboto', sans-serif">Roboto</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
        </select>
        <select
          onChange={(e) => a.format({ fontSize: Number(e.target.value) })}
          className="h-8 w-12 text-[11px] border border-border rounded bg-background px-1 focus:outline-none focus:ring-1 focus:ring-accent font-medium text-foreground"
          title="Font size"
          defaultValue="13"
        >
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
          <option value="13">13</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="24">24</option>
        </select>
        <RibbonButton title="Bold" shortcut="Ctrl+B" onClick={() => a.format({ bold: true })} compact><Bold className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Italic" shortcut="Ctrl+I" onClick={() => a.format({ italic: true })} compact><Italic className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Underline" shortcut="Ctrl+U" onClick={() => a.format({ underline: true })} compact><Underline className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Strikethrough" onClick={() => a.format({ strike: true })} compact><Strikethrough className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonColorPicker icon={<Type className="h-3.5 w-3.5" />} title="Text color" onPick={(c) => a.format({ color: c })} />
        <RibbonColorPicker icon={<PaintBucket className="h-3.5 w-3.5" />} title="Fill color" onPick={(c) => a.format({ bg: c })} />
      </RibbonGroup>

      <RibbonGroup label="Alignment & Borders">
        <RibbonButton title="Align left" onClick={() => a.format({ align: "left" })} compact><AlignLeft className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Align center" onClick={() => a.format({ align: "center" })} compact><AlignCenter className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Align right" onClick={() => a.format({ align: "right" })} compact><AlignRight className="h-3.5 w-3.5" /></RibbonButton>
        <select
          onChange={(e) => a.format({ valign: e.target.value as any })}
          className="h-8 text-[11px] border border-border rounded bg-background px-1 focus:outline-none focus:ring-1 focus:ring-accent font-medium text-foreground"
          title="Vertical alignment"
          defaultValue="middle"
        >
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </select>
        <select
          onChange={(e) => a.format({ border: e.target.value as any })}
          className="h-8 text-[11px] border border-border rounded bg-background px-1 focus:outline-none focus:ring-1 focus:ring-accent font-medium text-foreground"
          title="Borders"
          defaultValue="none"
        >
          <option value="none">No Border</option>
          <option value="all">All Borders</option>
          <option value="top">Top Border</option>
          <option value="bottom">Bottom Border</option>
          <option value="left">Left Border</option>
          <option value="right">Right Border</option>
        </select>
        <RibbonButton title="Wrap text" onClick={() => a.format({ wrap: true })} compact><WrapText className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Merge cells" onClick={a.cells.mergeCells} compact><Merge className="h-3.5 w-3.5" /></RibbonButton>
      </RibbonGroup>

      <RibbonGroup label="Number">
        <RibbonButton title="General" onClick={() => a.format({ numberFormat: "general" })} compact><Hash className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Currency" onClick={() => a.format({ numberFormat: "currency" })} compact><DollarSign className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Percent" onClick={() => a.format({ numberFormat: "percent" })} compact><Percent className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Date" onClick={() => a.format({ numberFormat: "date" })} compact><Calendar className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Time" onClick={() => a.format({ numberFormat: "time" })} compact><Clock className="h-3.5 w-3.5" /></RibbonButton>
      </RibbonGroup>

      <RibbonGroup label="Cells">
        <RibbonButton title="Insert row above" onClick={a.cells.insertRowAbove}><Plus className="h-3 w-3" /> Row ↑</RibbonButton>
        <RibbonButton title="Insert row below" onClick={a.cells.insertRowBelow}><Plus className="h-3 w-3" /> Row ↓</RibbonButton>
        <RibbonButton title="Insert column right" onClick={a.cells.insertColRight}><Plus className="h-3 w-3" /> Col</RibbonButton>
        <RibbonButton title="Delete row" onClick={a.cells.deleteRow}><Minus className="h-3 w-3" /> Row</RibbonButton>
        <RibbonButton title="Delete column" onClick={a.cells.deleteCol}><Minus className="h-3 w-3" /> Col</RibbonButton>
      </RibbonGroup>

      <RibbonGroup label="Editing">
        <RibbonButton title="Undo" shortcut="Ctrl+Z" onClick={a.edit.undo} disabled={!a.edit.canUndo} compact><Undo2 className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Redo" shortcut="Ctrl+Y" onClick={a.edit.redo} disabled={!a.edit.canRedo} compact><Redo2 className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Save" shortcut="Ctrl+S" onClick={a.edit.save} compact><Save className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Find & replace" shortcut="Ctrl+F" onClick={a.data.find} compact><Search className="h-3.5 w-3.5" /></RibbonButton>
        <RibbonButton title="Clear contents" onClick={a.cells.clearContents} compact><Trash2 className="h-3.5 w-3.5" /></RibbonButton>
      </RibbonGroup>
    </>
  );
}

function InsertTab({ actions: a }: { actions: RibbonActions }) {
  return (
    <>
      <RibbonGroup label="Charts">
        <RibbonButton title="Insert chart" onClick={a.insert.chart}><BarChart3 className="h-3.5 w-3.5" /> Chart</RibbonButton>
      </RibbonGroup>
      <RibbonGroup label="Tables">
        <RibbonButton title="Format as table" onClick={a.insert.table}><Table2 className="h-3.5 w-3.5" /> Table</RibbonButton>
      </RibbonGroup>
      <RibbonGroup label="Media">
        <RibbonButton title="Insert image" onClick={a.insert.image}><ImageIcon className="h-3.5 w-3.5" /> Image</RibbonButton>
        <RibbonButton title="Insert link" onClick={a.insert.link}><LinkIcon className="h-3.5 w-3.5" /> Link</RibbonButton>
        <RibbonButton title="Insert comment" onClick={a.insert.comment}><MessageSquare className="h-3.5 w-3.5" /> Comment</RibbonButton>
      </RibbonGroup>
      <RibbonGroup label="Formulas">
        <RibbonButton title="Insert function" onClick={a.insert.func}><FunctionSquare className="h-3.5 w-3.5" /> fx</RibbonButton>
      </RibbonGroup>
    </>
  );
}

function DataTab({ actions: a }: { actions: RibbonActions }) {
  return (
    <>
      <RibbonGroup label="Sort">
        <RibbonButton title="Sort ascending" onClick={a.data.sortAsc}><ArrowUpDown className="h-3.5 w-3.5" /> A→Z</RibbonButton>
        <RibbonButton title="Sort descending" onClick={a.data.sortDesc}><ArrowUpDown className="h-3.5 w-3.5" /> Z→A</RibbonButton>
      </RibbonGroup>
      <RibbonGroup label="Filter">
        <RibbonButton title="Toggle filters" onClick={a.data.toggleFilter}><Filter className="h-3.5 w-3.5" /> Filter</RibbonButton>
      </RibbonGroup>
      <RibbonGroup label="Tools">
        <RibbonButton title="Find & replace" onClick={a.data.find}><Search className="h-3.5 w-3.5" /> Find</RibbonButton>
      </RibbonGroup>
    </>
  );
}

function ViewTab({ actions: a }: { actions: RibbonActions }) {
  return (
    <>
      <RibbonGroup label="Freeze">
        <RibbonButton title="Freeze first row" onClick={a.view.freezeRow}><Snowflake className="h-3.5 w-3.5" /> Row</RibbonButton>
        <RibbonButton title="Freeze first column" onClick={a.view.freezeCol}><Snowflake className="h-3.5 w-3.5" /> Col</RibbonButton>
        <RibbonButton title="Unfreeze" onClick={a.view.unfreeze}>Unfreeze</RibbonButton>
      </RibbonGroup>
      <RibbonGroup label="Show">
        <RibbonButton title="Toggle gridlines" active={a.view.gridlines} onClick={a.view.toggleGridlines}><Grid3x3 className="h-3.5 w-3.5" /> Gridlines</RibbonButton>
        <RibbonButton title="Toggle headers" active={a.view.headers} onClick={a.view.toggleHeaders}><PanelTopClose className="h-3.5 w-3.5" /> Headers</RibbonButton>
        <RibbonButton title="Toggle formula bar" active={a.view.formulaBar} onClick={a.view.toggleFormulaBar}><FunctionSquare className="h-3.5 w-3.5" /> Formula bar</RibbonButton>
      </RibbonGroup>
    </>
  );
}

function FormulasTab({ actions: a }: { actions: RibbonActions }) {
  const cats = Array.from(new Set(FUNCTIONS.map((f) => f.category)));
  return (
    <>
      {cats.slice(0, 6).map((cat) => (
        <RibbonGroup label={cat} key={cat}>
          {FUNCTIONS.filter((f) => f.category === cat).slice(0, 5).map((f) => (
            <RibbonButton key={f.name} title={f.signature + " — " + f.description} onClick={() => a.formula(f.name)}>
              {f.name}
            </RibbonButton>
          ))}
        </RibbonGroup>
      ))}
    </>
  );
}

function AiTab({ actions: a }: { actions: RibbonActions }) {
  return (
    <>
      <RibbonGroup label="Odeneho">
        <RibbonButton title="Explain this data" onClick={a.ai.summarize}><Sparkles className="h-3.5 w-3.5" /> Explain</RibbonButton>
        <RibbonButton title="Suggest a chart" onClick={a.ai.suggestChart}><BarChart3 className="h-3.5 w-3.5" /> Chart</RibbonButton>
        <RibbonButton title="Detect anomalies" onClick={a.ai.anomalies}><TrendingUp className="h-3.5 w-3.5" /> Anomalies</RibbonButton>
        <RibbonButton title="Data cleanup" onClick={a.ai.cleanup}><Wand2 className="h-3.5 w-3.5" /> Cleanup</RibbonButton>
        <RibbonButton title="Generate formula" onClick={a.ai.formula}><FunctionSquare className="h-3.5 w-3.5" /> Formula</RibbonButton>
      </RibbonGroup>
    </>
  );
}
