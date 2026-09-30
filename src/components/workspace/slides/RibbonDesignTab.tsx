import React, { useState } from "react";
import {
  Palette, Image as ImageIcon, Sparkles, Sliders, Layout, Crop, RefreshCw, Trash2, Eye, PaintBucket
} from "lucide-react";
import { Slide, DeckTheme, DEFAULT_THEME, SlideBackground } from "@/lib/workspace/slides/documents";

interface RibbonDesignTabProps {
  currentSlide: Slide;
  onUpdateSlideBackground: (bg: string, config?: SlideBackground) => void;
  onApplyBackgroundToAll: (bg: string, config?: SlideBackground) => void;
  onUpdateTheme: (theme: DeckTheme) => void;
  theme: DeckTheme;
}

export function RibbonDesignTab({
  currentSlide,
  onUpdateSlideBackground,
  onApplyBackgroundToAll,
  onUpdateTheme,
  theme
}: RibbonDesignTabProps) {
  const [solidColor, setSolidColor] = useState(currentSlide.bgConfig?.solidColor ?? "#ffffff");
  const [gradientType, setGradientType] = useState<"linear" | "radial">("linear");
  const [gradientColors, setGradientColors] = useState(["#ffffff", "#2563eb"]);
  const [dragActive, setDragActive] = useState(false);

  // Background Image Options
  const [bgImageOpacity, setBgImageOpacity] = useState(100);
  const [bgImageBlur, setBgImageBlur] = useState(0);

  const themeOptions: DeckTheme[] = [
    {
      name: "Amineva",
      primary: "#1E2761",
      accent: "#2563eb",
      background: "#ffffff",
      text: "#0f172a",
      font: "Inter",
      headerFont: "Inter",
      colorScheme: ["#1E2761", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"]
    },
    {
      name: "Midnight",
      primary: "#0F172A",
      accent: "#38BDF8",
      background: "#0F172A",
      text: "#F8FAFC",
      font: "Inter",
      headerFont: "Inter",
      colorScheme: ["#0F172A", "#1E293B", "#334155", "#475569", "#38BDF8"]
    },
    {
      name: "Forest",
      primary: "#14532D",
      accent: "#22C55E",
      background: "#F0FDF4",
      text: "#14532D",
      font: "Georgia",
      headerFont: "Georgia",
      colorScheme: ["#14532D", "#15803D", "#22C55E", "#86EFAC", "#DCFCE7"]
    },
    {
      name: "Coral",
      primary: "#7C2D12",
      accent: "#F97316",
      background: "#FFF7ED",
      text: "#7C2D12",
      font: "Arial",
      headerFont: "Arial",
      colorScheme: ["#7C2D12", "#9A3412", "#F97316", "#FDBA74", "#FFEDD5"]
    }
  ];

  const handleApplySolid = (color: string) => {
    setSolidColor(color);
    onUpdateSlideBackground(color, {
      type: "solid",
      solidColor: color
    });
  };

  const handleApplyGradient = () => {
    const bgString = gradientType === "linear"
      ? `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`
      : `radial-gradient(circle, ${gradientColors[0]}, ${gradientColors[1]})`;

    onUpdateSlideBackground(bgString, {
      type: "gradient",
      gradient: {
        type: gradientType,
        colors: gradientColors,
        angle: 135
      }
    });
  };

  const handleApplyPattern = (pattern: string) => {
    let bgString = "";
    if (pattern === "dots") {
      bgString = "radial-gradient(#e2e8f0 20%, transparent 20%), radial-gradient(#e2e8f0 20%, transparent 20%)";
    } else {
      bgString = "repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 10px, #ffffff 10px, #ffffff 20px)";
    }
    onUpdateSlideBackground(bgString, {
      type: "pattern",
      pattern
    });
  };

  // Drag and drop image upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imgUrl = String(reader.result);
      onUpdateSlideBackground(`url(${imgUrl})`, {
        type: "image",
        image: {
          url: imgUrl,
          opacity: bgImageOpacity / 100,
          blur: bgImageBlur
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const updateImageSettings = (opacityVal: number, blurVal: number) => {
    setBgImageOpacity(opacityVal);
    setBgImageBlur(blurVal);
    if (currentSlide.bgConfig?.type === "image" && currentSlide.bgConfig.image?.url) {
      const imgUrl = currentSlide.bgConfig.image.url;
      onUpdateSlideBackground(`url(${imgUrl})`, {
        type: "image",
        image: {
          url: imgUrl,
          opacity: opacityVal / 100,
          blur: blurVal
        }
      });
    }
  };

  const handleApplyToAll = () => {
    if (currentSlide.bgConfig) {
      onApplyBackgroundToAll(currentSlide.background, currentSlide.bgConfig);
    }
  };

  const handleRemoveImage = () => {
    handleApplySolid("#ffffff");
  };

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Themes */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          {themeOptions.map((t) => (
            <button
              key={t.name}
              onClick={() => onUpdateTheme(t)}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex flex-col items-start gap-0.5 border transition ${
                theme.name === t.name
                  ? "border-accent bg-accent/10 text-accent font-bold"
                  : "border-border hover:bg-muted text-foreground"
              }`}
            >
              <span className="text-[11px]">{t.name}</span>
              <div className="flex gap-0.5 mt-0.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.primary }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.accent }} />
              </div>
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Theme Gallery</span>
      </div>

      {/* Group: Background Fills */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1">
          {/* Solid Fill */}
          <div className="flex items-center gap-1 border border-border bg-background rounded px-1.5 h-7">
            <PaintBucket className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="color"
              value={solidColor}
              onChange={(e) => handleApplySolid(e.target.value)}
              className="w-5 h-5 cursor-pointer p-0 border-0 outline-none bg-transparent"
              title="Solid Color Background"
            />
          </div>

          {/* Gradients */}
          <button
            onClick={() => {
              setGradientColors(["#ffffff", theme.accent]);
              handleApplyGradient();
            }}
            className="px-2 py-1 text-xs border border-border bg-background hover:bg-muted text-foreground rounded flex items-center gap-1 h-7"
            title="Linear Accent Gradient"
          >
            <Palette className="h-3.5 w-3.5" /> Gradient
          </button>

          {/* Patterns */}
          <button
            onClick={() => handleApplyPattern("stripes")}
            className="px-2 py-1 text-xs border border-border bg-background hover:bg-muted text-foreground rounded flex items-center gap-1 h-7"
            title="Pattern Background Fills"
          >
            <Sliders className="h-3.5 w-3.5" /> Pattern
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Background Fills</span>
      </div>

      {/* Group: Background Image System */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-3 mb-1">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border border-dashed rounded px-3 py-1 text-xs text-center cursor-pointer transition flex items-center gap-1.5 h-7 relative ${
              dragActive ? "border-accent bg-accent/10" : "border-border hover:bg-muted"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-semibold text-foreground">Drag Background Image Here</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Image Settings */}
          {currentSlide.bgConfig?.type === "image" && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground flex flex-col items-start">
                Opacity
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={bgImageOpacity}
                  onChange={(e) => updateImageSettings(parseInt(e.target.value), bgImageBlur)}
                  className="w-16 h-1 bg-accent/20 accent-accent rounded"
                />
              </label>
              <label className="text-[10px] text-muted-foreground flex flex-col items-start">
                Blur
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={bgImageBlur}
                  onChange={(e) => updateImageSettings(bgImageOpacity, parseInt(e.target.value))}
                  className="w-16 h-1 bg-accent/20 accent-accent rounded"
                />
              </label>
              <button
                onClick={handleRemoveImage}
                className="p-1 rounded hover:bg-destructive/15 text-destructive transition"
                title="Remove Image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Background Image</span>
      </div>

      {/* Group: Apply To All */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <button
          onClick={handleApplyToAll}
          className="px-3 py-1 bg-accent text-accent-foreground font-semibold hover:bg-accent/90 rounded text-xs h-7 flex items-center gap-1.5"
          title="Apply current slide background configuration to all slides in the deck"
        >
          <Layout className="h-3.5 w-3.5" /> Apply To All
        </button>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Batch</span>
      </div>
    </div>
  );
}
