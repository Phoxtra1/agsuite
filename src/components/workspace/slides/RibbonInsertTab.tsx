import React, { useState } from "react";
import {
  Type, FileImage, Film, Volume2, Mic, Box, Star, Table, BarChart2,
  HelpCircle, Link2, Play, Layout, Plus, CheckCircle
} from "lucide-react";
import { SlideElement, newSlideId } from "@/lib/workspace/slides/documents";

interface RibbonInsertTabProps {
  onAddElement: (el: SlideElement) => void;
  themeAccent: string;
}

export function RibbonInsertTab({ onAddElement, themeAccent }: RibbonInsertTabProps) {
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const [showChartModal, setShowChartModal] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [chartTitle, setChartTitle] = useState("Analytics Report");

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://www.w3schools.com/html/mov_bbb.mp4");

  const [showWordArtModal, setShowWordArtModal] = useState(false);
  const [wordArtText, setWordArtText] = useState("Amineva Slides");
  const [wordArtStyle, setWordArtStyle] = useState("glow");

  const handleInsertTextBox = () => {
    onAddElement({
      id: newSlideId(),
      kind: "text",
      x: 200,
      y: 200,
      w: 800,
      h: 150,
      text: "Click double to edit text",
      fontSize: 32,
      fontFamily: "Inter",
      color: "#0f172a"
    });
  };

  const handleInsertWordArt = () => {
    onAddElement({
      id: newSlideId(),
      kind: "text",
      x: 200,
      y: 200,
      w: 900,
      h: 200,
      text: wordArtText,
      fontSize: 80,
      fontWeight: 900,
      fontFamily: "Inter",
      color: themeAccent,
      align: "center",
      wordArt: true,
      wordArtStyle: wordArtStyle
    });
    setShowWordArtModal(false);
  };

  const handleInsertHeaderFooter = () => {
    onAddElement({
      id: newSlideId(),
      kind: "text",
      x: 120,
      y: 1000,
      w: 800,
      h: 50,
      text: "Amineva Presentation Suite | Confidential",
      fontSize: 18,
      fontFamily: "Inter",
      color: "#64748b"
    });
    onAddElement({
      id: newSlideId(),
      kind: "text",
      x: 1680,
      y: 1000,
      w: 120,
      h: 50,
      text: "Page 1",
      fontSize: 18,
      fontFamily: "Inter",
      color: "#64748b",
      align: "right"
    });
  };

  const handleInsertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onAddElement({
          id: newSlideId(),
          kind: "image",
          x: 400,
          y: 200,
          w: 800,
          h: 500,
          src: String(reader.result),
          alt: "Uploaded Presentation Asset"
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleInsertVideo = () => {
    onAddElement({
      id: newSlideId(),
      kind: "video",
      x: 400,
      y: 200,
      w: 800,
      h: 450,
      mediaUrl: videoUrl,
      autoplay: false,
      loop: false
    });
    setShowVideoModal(false);
  };

  const handleInsertAudio = () => {
    onAddElement({
      id: newSlideId(),
      kind: "audio",
      x: 100,
      y: 100,
      w: 150,
      h: 150,
      mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      autoplay: false,
      volume: 0.8
    });
  };

  const handleInsertTable = () => {
    const cells = [];
    for (let r = 0; r < tableRows; r++) {
      for (let c = 0; c < tableCols; c++) {
        cells.push({
          row: r,
          col: c,
          text: r === 0 ? `Header ${c + 1}` : `Row ${r} Col ${c + 1}`
        });
      }
    }
    onAddElement({
      id: newSlideId(),
      kind: "table",
      x: 300,
      y: 200,
      w: 900,
      h: 300,
      rowsCount: tableRows,
      colsCount: tableCols,
      cells
    });
    setShowTableModal(false);
  };

  const handleInsertChart = () => {
    onAddElement({
      id: newSlideId(),
      kind: "chart",
      x: 400,
      y: 200,
      w: 800,
      h: 500,
      chartType,
      chartTitle,
      chartData: [
        { name: "Q1", value: 400 },
        { name: "Q2", value: 300 },
        { name: "Q3", value: 600 },
        { name: "Q4", value: 800 }
      ]
    });
    setShowChartModal(false);
  };

  const handleInsertInteractiveButton = () => {
    onAddElement({
      id: newSlideId(),
      kind: "shape",
      shape: "rect",
      x: 800,
      y: 800,
      w: 260,
      h: 70,
      fill: themeAccent,
      text: "Interactive Button",
      fontSize: 22,
      fontWeight: 700,
      color: "#ffffff",
      actionButton: true,
      actionType: "next"
    });
  };

  const handleInsertEmbed = () => {
    onAddElement({
      id: newSlideId(),
      kind: "shape",
      shape: "rect",
      x: 400,
      y: 200,
      w: 800,
      h: 450,
      fill: "#e2e8f0",
      stroke: "#cbd5e1",
      strokeWidth: 2,
      text: "Embedded Web View Frame (Odeneho Workspace API)",
      color: "#475569",
      fontSize: 24,
      embeddedCode: `<iframe src="https://www.amineva.com" width="100%" height="100%"></iframe>`
    });
  };

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Text */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={handleInsertTextBox}
            className="px-2.5 py-1.5 rounded hover:bg-muted text-xs font-semibold flex items-center gap-1.5 h-7 text-foreground"
          >
            <Type className="h-3.5 w-3.5 text-accent" /> Text Box
          </button>
          <button
            onClick={() => setShowWordArtModal(true)}
            className="px-2.5 py-1.5 rounded hover:bg-muted text-xs font-semibold flex items-center gap-1.5 h-7 text-foreground"
          >
            <Star className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> WordArt
          </button>
          <button
            onClick={handleInsertHeaderFooter}
            className="px-2.5 py-1.5 rounded hover:bg-muted text-xs font-semibold flex items-center gap-1.5 h-7 text-foreground"
            title="Insert standard Header and Footer tags"
          >
            <Layout className="h-3.5 w-3.5 text-slate-500" /> Header/Footer
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Text Elements</span>
      </div>

      {/* Group: Media */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1.5 mb-1">
          <button onClick={handleInsertImage} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium" title="Upload Image Asset">
            <FileImage className="h-4 w-4 text-emerald-500" /> Image
          </button>
          <button onClick={() => setShowVideoModal(true)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium" title="Insert Streaming Video">
            <Film className="h-4 w-4 text-red-500" /> Video
          </button>
          <button onClick={handleInsertAudio} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium" title="Insert Presentation Music">
            <Volume2 className="h-4 w-4 text-indigo-500" /> Audio
          </button>
          <button onClick={handleInsertAudio} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium" title="Record Voice Audio Note">
            <Mic className="h-4 w-4 text-orange-500" /> Screen Rec
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Media</span>
      </div>

      {/* Group: Graphics */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => setShowTableModal(true)}
            className="px-2.5 py-1.5 rounded hover:bg-muted text-xs font-semibold flex items-center gap-1.5 h-7 text-foreground"
          >
            <Table className="h-3.5 w-3.5 text-sky-500" /> Table
          </button>
          <button
            onClick={() => setShowChartModal(true)}
            className="px-2.5 py-1.5 rounded hover:bg-muted text-xs font-semibold flex items-center gap-1.5 h-7 text-foreground"
          >
            <BarChart2 className="h-3.5 w-3.5 text-pink-500" /> Chart
          </button>
          <button
            onClick={handleInsertEmbed}
            className="px-2.5 py-1.5 rounded hover:bg-muted text-xs font-semibold flex items-center gap-1.5 h-7 text-foreground"
            title="Smart Diagram / Process maps"
          >
            <Box className="h-3.5 w-3.5 text-amber-500" /> Smart Diagram
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Graphics & Tables</span>
      </div>

      {/* Group: Interactive */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={handleInsertInteractiveButton}
            className="px-2.5 py-1.5 rounded hover:bg-muted text-xs font-semibold flex items-center gap-1.5 h-7 text-foreground"
            title="Add slide trigger button"
          >
            <Play className="h-3.5 w-3.5 text-blue-600" /> Action Button
          </button>
          <button
            onClick={handleInsertEmbed}
            className="px-2.5 py-1.5 rounded hover:bg-muted text-xs font-semibold flex items-center gap-1.5 h-7 text-foreground"
            title="Embed custom HTML inside presentation frame"
          >
            <Link2 className="h-3.5 w-3.5 text-violet-600" /> Embed Content
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Interactive</span>
      </div>

      {/* MODALS */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowTableModal(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Table className="h-4 w-4 text-sky-500" /> Insert Presentation Table</h3>
            <div className="space-y-3 mb-5">
              <label className="block text-xs text-muted-foreground">Rows
                <input type="number" min={1} max={10} value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value) || 1)} className="w-full mt-1 px-3 py-1.5 rounded border border-border bg-background text-foreground" />
              </label>
              <label className="block text-xs text-muted-foreground">Columns
                <input type="number" min={1} max={10} value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value) || 1)} className="w-full mt-1 px-3 py-1.5 rounded border border-border bg-background text-foreground" />
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowTableModal(false)} className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted text-foreground">Cancel</button>
              <button onClick={handleInsertTable} className="px-3 py-1.5 text-xs rounded bg-accent text-accent-foreground font-semibold">Insert</button>
            </div>
          </div>
        </div>
      )}

      {showChartModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowChartModal(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-pink-500" /> Insert Analytical Chart</h3>
            <div className="space-y-3 mb-5">
              <label className="block text-xs text-muted-foreground">Chart Title
                <input type="text" value={chartTitle} onChange={(e) => setChartTitle(e.target.value)} className="w-full mt-1 px-3 py-1.5 rounded border border-border bg-background text-foreground" />
              </label>
              <label className="block text-xs text-muted-foreground">Chart Type
                <select value={chartType} onChange={(e) => setChartType(e.target.value as any)} className="w-full mt-1 px-3 py-1.5 rounded border border-border bg-background text-foreground">
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Graph</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowChartModal(false)} className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted text-foreground">Cancel</button>
              <button onClick={handleInsertChart} className="px-3 py-1.5 text-xs rounded bg-accent text-accent-foreground font-semibold">Insert</button>
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Film className="h-4 w-4 text-red-500" /> Insert Streaming Video</h3>
            <div className="space-y-3 mb-5">
              <label className="block text-xs text-muted-foreground">Video Stream URL (MP4 or Youtube)
                <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full mt-1 px-3 py-1.5 rounded border border-border bg-background text-foreground" />
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowVideoModal(false)} className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted text-foreground">Cancel</button>
              <button onClick={handleInsertVideo} className="px-3 py-1.5 text-xs rounded bg-accent text-accent-foreground font-semibold">Insert</button>
            </div>
          </div>
        </div>
      )}

      {showWordArtModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowWordArtModal(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Insert Amineva WordArt</h3>
            <div className="space-y-3 mb-5">
              <label className="block text-xs text-muted-foreground">Text Content
                <input type="text" value={wordArtText} onChange={(e) => setWordArtText(e.target.value)} className="w-full mt-1 px-3 py-1.5 rounded border border-border bg-background text-foreground" />
              </label>
              <label className="block text-xs text-muted-foreground">WordArt Style
                <select value={wordArtStyle} onChange={(e) => setWordArtStyle(e.target.value)} className="w-full mt-1 px-3 py-1.5 rounded border border-border bg-background text-foreground">
                  <option value="glow">Retro Glow Effect</option>
                  <option value="3d">3D Emboss Shadow</option>
                  <option value="outline">Thin Neon Outline</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowWordArtModal(false)} className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted text-foreground">Cancel</button>
              <button onClick={handleInsertWordArt} className="px-3 py-1.5 text-xs rounded bg-accent text-accent-foreground font-semibold">Insert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
