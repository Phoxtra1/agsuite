import React, { useState } from "react";
import {
  Scissors, Copy, Clipboard, Paintbrush, Plus, Trash2, Layout, RotateCcw,
  Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, ArrowUpDown, Indent, Outdent, Play, Search, Replace,
  Square, Circle, Triangle, Star, Hexagon, ArrowRight
} from "lucide-react";
import { Slide, SlideElement, SlideLayout, newSlideId } from "@/lib/workspace/slides/documents";

interface RibbonHomeTabProps {
  currentSlide: Slide;
  selectedElement: SlideElement | null;
  onUpdateElement: (patch: Partial<SlideElement>) => void;
  onDeleteElement: () => void;
  onAddSlide: (layout: SlideLayout) => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onResetSlide: () => void;
  onAddElement: (el: SlideElement) => void;
  onClipboardAction: (action: "cut" | "copy" | "paste" | "formatPainter") => void;
  onOpenFindReplace: () => void;
  themeAccent: string;
}

export function RibbonHomeTab({
  currentSlide,
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onResetSlide,
  onAddElement,
  onClipboardAction,
  onOpenFindReplace,
  themeAccent
}: RibbonHomeTabProps) {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showQuickStyles, setShowQuickStyles] = useState(false);

  const layouts: { id: SlideLayout; label: string }[] = [
    { id: "title", label: "Title Slide" },
    { id: "titleContent", label: "Title & Content" },
    { id: "twoColumn", label: "Two Column" },
    { id: "comparison", label: "Comparison" },
    { id: "sectionHeader", label: "Section Header" },
    { id: "timeline", label: "Timeline" },
    { id: "dashboard", label: "Dashboard" },
    { id: "quote", label: "Quote" },
    { id: "statistics", label: "Statistics" },
    { id: "closing", label: "Closing" },
    { id: "blank", label: "Blank" }
  ];

  const quickStyles = [
    { name: "Primary Solid", fill: themeAccent, stroke: "none", color: "#ffffff" },
    { name: "Slate Outline", fill: "transparent", stroke: "#64748b", strokeWidth: 2, color: "#0f172a" },
    { name: "Accent Light", fill: themeAccent + "20", stroke: themeAccent, strokeWidth: 1, color: themeAccent },
    { name: "Dark Solid", fill: "#0f172a", stroke: "none", color: "#ffffff" }
  ];

  const handleInsertShape = (shapeKind: "rect" | "ellipse" | "triangle" | "line" | "arrow" | "star" | "hexagon") => {
    onAddElement({
      id: newSlideId(),
      kind: "shape",
      shape: shapeKind,
      x: 400,
      y: 300,
      w: 200,
      h: 200,
      fill: themeAccent,
      stroke: "transparent",
      strokeWidth: 0
    });
  };

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Clipboard */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="grid grid-cols-2 gap-1 mb-1">
          <button
            onClick={() => onClipboardAction("cut")}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center"
            title="Cut (Ctrl+X)"
          >
            <Scissors className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onClipboardAction("copy")}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center"
            title="Copy (Ctrl+C)"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onClipboardAction("paste")}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center"
            title="Paste (Ctrl+V)"
          >
            <Clipboard className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onClipboardAction("formatPainter")}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center"
            title="Format Painter"
          >
            <Paintbrush className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Clipboard</span>
      </div>

      {/* Group: Slides */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1.5 mb-1">
          <button
            onClick={() => onAddSlide("titleContent")}
            className="px-2.5 py-1 rounded bg-accent text-accent-foreground hover:bg-accent/90 transition text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> New Slide
          </button>
          <button
            onClick={onDuplicateSlide}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
            title="Duplicate Slide"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDeleteSlide}
            className="p-1.5 rounded hover:bg-muted hover:text-destructive text-muted-foreground transition"
            title="Delete Slide"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-1"
              title="Change Layout"
            >
              <Layout className="h-3.5 w-3.5" />
            </button>
            {showLayoutMenu && (
              <div className="absolute top-8 left-0 z-50 bg-card border border-border rounded shadow-lg p-1 w-44 grid grid-cols-1 gap-0.5">
                {layouts.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onAddSlide(l.id);
                      setShowLayoutMenu(false);
                    }}
                    className="text-left text-[11px] px-2 py-1.5 rounded hover:bg-muted text-foreground font-medium"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onResetSlide}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
            title="Reset Slide elements to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Slides</span>
      </div>

      {/* Group: Font (Only active if text element is selected) */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1 mb-1">
          <select
            disabled={!selectedElement || selectedElement.kind !== "text"}
            value={selectedElement?.fontFamily ?? "Inter"}
            onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
            className="text-xs border border-border bg-background rounded px-1 py-1 w-24 h-7 disabled:opacity-50"
          >
            <option value="Inter">Inter</option>
            <option value="Georgia">Georgia</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
          <input
            type="number"
            disabled={!selectedElement || selectedElement.kind !== "text"}
            value={selectedElement?.fontSize ?? 32}
            onChange={(e) => onUpdateElement({ fontSize: parseInt(e.target.value) || 12 })}
            className="text-xs border border-border bg-background rounded px-1 py-1 w-12 h-7 disabled:opacity-50"
            min={8}
            max={200}
          />
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ fontWeight: (selectedElement?.fontWeight ?? 400) >= 700 ? 400 : 700 })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.fontWeight && selectedElement.fontWeight >= 700 ? "bg-accent/20 text-accent font-bold" : "text-muted-foreground"}`}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ italic: !selectedElement?.italic })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.italic ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ underline: !selectedElement?.underline })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.underline ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            title="Underline"
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-0.5 border border-border bg-background rounded px-1 h-7">
            <span className="text-[10px] font-bold text-muted-foreground">A</span>
            <input
              type="color"
              disabled={!selectedElement || selectedElement.kind !== "text"}
              value={selectedElement?.color ?? "#000000"}
              onChange={(e) => onUpdateElement({ color: e.target.value })}
              className="w-4 h-4 cursor-pointer p-0 border-0 outline-none bg-transparent"
              title="Text Color"
            />
          </div>
          <div className="flex items-center gap-0.5 border border-border bg-background rounded px-1 h-7">
            <span className="text-[10px] font-bold text-muted-foreground">BG</span>
            <input
              type="color"
              disabled={!selectedElement || selectedElement.kind !== "text"}
              value={selectedElement?.highlightColor ?? "#ffffff"}
              onChange={(e) => onUpdateElement({ highlightColor: e.target.value })}
              className="w-4 h-4 cursor-pointer p-0 border-0 outline-none bg-transparent"
              title="Highlight Color"
            />
          </div>
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({
              fontFamily: "Inter",
              fontSize: 32,
              fontWeight: 400,
              italic: false,
              underline: false,
              color: "#0f172a",
              highlightColor: "transparent"
            })}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
            title="Clear Formatting"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Font</span>
      </div>

      {/* Group: Paragraph */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1 mb-1">
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ align: "left" })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.align === "left" ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            title="Align Left"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ align: "center" })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.align === "center" ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            title="Align Center"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ align: "right" })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.align === "right" ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            title="Align Right"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ align: "justify" })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.align === "justify" ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            title="Justify"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-5 bg-border mx-0.5" />
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ bullet: !selectedElement?.bullet, numbering: false })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.bullet ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            title="Bullets"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={!selectedElement || selectedElement.kind !== "text"}
            onClick={() => onUpdateElement({ numbering: !selectedElement?.numbering, bullet: false })}
            className={`p-1 rounded hover:bg-muted disabled:opacity-50 ${selectedElement?.numbering ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            title="Numbering"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            disabled={!selectedElement || selectedElement.kind !== "text"}
            value={selectedElement?.lineSpacing ?? 1.25}
            onChange={(e) => onUpdateElement({ lineSpacing: parseFloat(e.target.value) || 1.25 })}
            step="0.1"
            min="1.0"
            max="3.0"
            className="text-xs border border-border bg-background rounded px-1 py-1 w-11 h-7 disabled:opacity-50"
            title="Line Spacing"
          />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Paragraph</span>
      </div>

      {/* Group: Drawing */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1.5 mb-1">
          <button onClick={() => handleInsertShape("rect")} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Rectangle"><Square className="h-3.5 w-3.5" /></button>
          <button onClick={() => handleInsertShape("ellipse")} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Oval/Circle"><Circle className="h-3.5 w-3.5" /></button>
          <button onClick={() => handleInsertShape("triangle")} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Triangle"><Triangle className="h-3.5 w-3.5" /></button>
          <button onClick={() => handleInsertShape("hexagon")} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Hexagon"><Hexagon className="h-3.5 w-3.5" /></button>
          <button onClick={() => handleInsertShape("star")} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Star"><Star className="h-3.5 w-3.5" /></button>
          <button onClick={() => handleInsertShape("arrow")} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Arrow"><ArrowRight className="h-3.5 w-3.5" /></button>

          {selectedElement && selectedElement.kind === "shape" && (
            <div className="relative">
              <button
                onClick={() => setShowQuickStyles(!showQuickStyles)}
                className="px-2 py-1 border border-border rounded text-[11px] h-7 bg-background text-foreground flex items-center gap-1"
              >
                Styles
              </button>
              {showQuickStyles && (
                <div className="absolute top-8 left-0 z-50 bg-card border border-border rounded shadow-lg p-1 w-44 grid grid-cols-1 gap-1">
                  {quickStyles.map((style, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onUpdateElement({
                          fill: style.fill,
                          stroke: style.stroke,
                          strokeWidth: style.strokeWidth ?? 0
                        });
                        setShowQuickStyles(false);
                      }}
                      className="text-left text-[11px] px-2 py-1.5 rounded hover:bg-muted font-medium flex items-center justify-between"
                    >
                      <span>{style.name}</span>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: style.fill !== "transparent" ? style.fill : undefined, border: style.stroke !== "none" ? `1px solid ${style.stroke}` : "1px dashed #cbd5e1" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Drawing</span>
      </div>

      {/* Group: Editing */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <div className="flex items-center gap-1 mb-1">
          <button
            onClick={onOpenFindReplace}
            className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition text-xs font-semibold flex items-center gap-1.5 h-7"
            title="Find and Replace"
          >
            <Search className="h-3.5 w-3.5" /> Find / Replace
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Editing</span>
      </div>
    </div>
  );
}
