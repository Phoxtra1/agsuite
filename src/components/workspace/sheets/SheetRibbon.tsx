import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette, Type, PaintBucket, Grid3x3, Trash2, Copy, Percent, DollarSign, Hash, Calendar, Sigma, Plus, Minus } from "lucide-react";

interface Props {
  onFormat: (patch: any) => void;
  onFormula: (name: string) => void;
  onAddRow: () => void;
  onAddCol: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  onClear: () => void;
}

const Btn = ({ children, title, onClick, active }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`h-8 px-2 rounded flex items-center gap-1 text-xs ${active ? "bg-accent/20 text-accent" : "text-foreground hover:bg-muted"}`}
  >
    {children}
  </button>
);

const Group = ({ children, label }: any) => (
  <div className="flex flex-col items-center border-r border-border pr-3 mr-1">
    <div className="flex items-center gap-0.5">{children}</div>
    <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>
  </div>
);

export function SheetRibbon({ onFormat, onFormula, onAddRow, onAddCol, onDeleteRow, onDeleteCol, onClear }: Props) {
  return (
    <div className="h-16 border-b border-border bg-card flex items-center px-3 gap-1 flex-shrink-0 overflow-x-auto">
      <Group label="Font">
        <Btn title="Bold" onClick={() => onFormat({ bold: true })}><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn title="Italic" onClick={() => onFormat({ italic: true })}><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn title="Underline" onClick={() => onFormat({ underline: true })}><Underline className="h-3.5 w-3.5" /></Btn>
        <label className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center cursor-pointer" title="Text color">
          <Type className="h-3.5 w-3.5" />
          <input type="color" className="sr-only" onChange={(e) => onFormat({ color: e.target.value })} />
        </label>
        <label className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center cursor-pointer" title="Fill color">
          <PaintBucket className="h-3.5 w-3.5" />
          <input type="color" className="sr-only" onChange={(e) => onFormat({ bg: e.target.value })} />
        </label>
      </Group>

      <Group label="Align">
        <Btn title="Left" onClick={() => onFormat({ align: "left" })}><AlignLeft className="h-3.5 w-3.5" /></Btn>
        <Btn title="Center" onClick={() => onFormat({ align: "center" })}><AlignCenter className="h-3.5 w-3.5" /></Btn>
        <Btn title="Right" onClick={() => onFormat({ align: "right" })}><AlignRight className="h-3.5 w-3.5" /></Btn>
      </Group>

      <Group label="Number">
        <Btn title="General" onClick={() => onFormat({ numberFormat: "general" })}><Hash className="h-3.5 w-3.5" /></Btn>
        <Btn title="Currency" onClick={() => onFormat({ numberFormat: "currency" })}><DollarSign className="h-3.5 w-3.5" /></Btn>
        <Btn title="Percent" onClick={() => onFormat({ numberFormat: "percent" })}><Percent className="h-3.5 w-3.5" /></Btn>
        <Btn title="Date" onClick={() => onFormat({ numberFormat: "date" })}><Calendar className="h-3.5 w-3.5" /></Btn>
      </Group>

      <Group label="Formulas">
        <Btn title="SUM" onClick={() => onFormula("SUM")}><Sigma className="h-3.5 w-3.5" /> SUM</Btn>
        <Btn title="AVERAGE" onClick={() => onFormula("AVERAGE")}>AVG</Btn>
        <Btn title="COUNT" onClick={() => onFormula("COUNT")}>COUNT</Btn>
        <Btn title="MAX" onClick={() => onFormula("MAX")}>MAX</Btn>
        <Btn title="MIN" onClick={() => onFormula("MIN")}>MIN</Btn>
        <Btn title="IF" onClick={() => onFormula("IF")}>IF</Btn>
        <Btn title="VLOOKUP" onClick={() => onFormula("VLOOKUP")}>VLOOKUP</Btn>
      </Group>

      <Group label="Cells">
        <Btn title="Insert row below" onClick={onAddRow}><Plus className="h-3.5 w-3.5" /> Row</Btn>
        <Btn title="Insert column right" onClick={onAddCol}><Plus className="h-3.5 w-3.5" /> Col</Btn>
        <Btn title="Delete row" onClick={onDeleteRow}><Minus className="h-3.5 w-3.5" /> Row</Btn>
        <Btn title="Delete column" onClick={onDeleteCol}><Minus className="h-3.5 w-3.5" /> Col</Btn>
        <Btn title="Clear content" onClick={onClear}><Trash2 className="h-3.5 w-3.5" /></Btn>
      </Group>
    </div>
  );
}
