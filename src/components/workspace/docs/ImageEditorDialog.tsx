import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { X, Crop, Move, Sparkles, Sliders, Settings2, Palette, RefreshCw } from "lucide-react";

interface ImageEditorDialogProps {
  editor: Editor;
  onClose: () => void;
}

export function ImageEditorDialog({ editor, onClose }: ImageEditorDialogProps) {
  // Get currently selected image attributes
  const { selection } = editor.state;
  const isImage = selection && (selection as any).node && (selection as any).node.type.name === "image";
  const attrs = isImage ? (selection as any).node.attrs : {};

  // Store image attributes and position on mount to prevent loss on selection change
  const [imgSrc] = useState(attrs.src || "");
  const [imgAlt] = useState(attrs.alt || "");
  const [imagePos] = useState(() => {
    const { selection: sel } = editor.state;
    return sel && (sel as any).node && (sel as any).node.type.name === "image" ? sel.from : null;
  });

  // Parse existing styles from style string
  const styleStr = attrs.style || "";
  const initialStyles = parseStyleString(styleStr);

  // --- State Variables ---
  // Size
  const [width, setWidth] = useState(attrs.width || initialStyles["width"] || "100%");
  const [height, setHeight] = useState(attrs.height || initialStyles["height"] || "auto");

  // Wrapping / Alignment
  const [wrap, setWrap] = useState<"inline" | "left" | "right" | "center">(getInitialWrap(initialStyles));

  // Cropping (percentage inset: 0..100)
  const [cropTop, setCropTop] = useState(0);
  const [cropRight, setCropRight] = useState(0);
  const [cropBottom, setCropBottom] = useState(0);
  const [cropLeft, setCropLeft] = useState(0);

  // Border & Corners
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [borderWidth, setBorderWidth] = useState<number>(0);
  const [borderStyle, setBorderStyle] = useState<string>("solid");
  const [borderColor, setBorderColor] = useState<string>("#2563eb");

  // Effects
  const [rotation, setRotation] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(1);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);

  // Load existing styles on mount
  useEffect(() => {
    if (!styleStr) return;
    const s = parseStyleString(styleStr);

    // Parse clip-path for crop
    const clipPath = s["clip-path"] || "";
    const cropMatch = clipPath.match(/inset\(\s*([\d.]+)%\s*([\d.]+)%\s*([\d.]+)%\s*([\d.]+)%\s*\)/);
    if (cropMatch) {
      setCropTop(Math.round(parseFloat(cropMatch[1]) || 0));
      setCropRight(Math.round(parseFloat(cropMatch[2]) || 0));
      setCropBottom(Math.round(parseFloat(cropMatch[3]) || 0));
      setCropLeft(Math.round(parseFloat(cropMatch[4]) || 0));
    }

    // Parse border-radius
    if (s["border-radius"]) {
      const val = parseInt(s["border-radius"]) || 0;
      setBorderRadius(val);
    }

    // Parse border
    if (s["border"]) {
      const borderParts = s["border"].split(" ");
      if (borderParts.length >= 3) {
        setBorderWidth(parseInt(borderParts[0]) || 0);
        setBorderStyle(borderParts[1] || "solid");
        setBorderColor(borderParts[2] || "#000000");
      }
    }

    // Parse transform (rotation)
    if (s["transform"]) {
      const rotMatch = s["transform"].match(/rotate\(([-\d.]+)deg\)/);
      if (rotMatch) {
        setRotation(parseFloat(rotMatch[1]) || 0);
      }
    }

    // Parse opacity
    if (s["opacity"]) {
      setOpacity(parseFloat(s["opacity"]) || 1);
    }

    // Parse filters
    if (s["filter"]) {
      const gMatch = s["filter"].match(/grayscale\(([\d.]+)%\)/);
      if (gMatch) setGrayscale(parseFloat(gMatch[1]) || 0);

      const sMatch = s["filter"].match(/sepia\(([\d.]+)%\)/);
      if (sMatch) setSepia(parseFloat(sMatch[1]) || 0);

      const bMatch = s["filter"].match(/blur\(([\d.]+)px\)/);
      if (bMatch) setBlur(parseFloat(bMatch[1]) || 0);
    }
  }, [styleStr]);

  // Sync state to editor attributes on every state change
  useEffect(() => {
    if (imagePos === null) return;

    // Check if the node at imagePos is still an image
    const node = editor.state.doc.nodeAt(imagePos);
    if (!node || node.type.name !== "image") return;

    const style = buildStyleString({
      width,
      height,
      wrap,
      cropTop,
      cropRight,
      cropBottom,
      cropLeft,
      borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined,
      borderWidth: borderWidth > 0 ? `${borderWidth}px` : undefined,
      borderStyle,
      borderColor,
      rotation,
      opacity,
      grayscale,
      sepia,
      blur,
    });

    // Use ProseMirror setNodeMarkup to update attributes precisely without focus jumping or losing selection
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(imagePos, undefined, {
        ...node.attrs,
        style,
        width,
        height,
      })
    );
  }, [
    width, height, wrap, cropTop, cropRight, cropBottom, cropLeft,
    borderRadius, borderWidth, borderStyle, borderColor,
    rotation, opacity, grayscale, sepia, blur,
    imagePos, editor,
  ]);

  function handleReset() {
    setWidth("100%");
    setHeight("auto");
    setWrap("inline");
    setCropTop(0);
    setCropRight(0);
    setCropBottom(0);
    setCropLeft(0);
    setBorderRadius(0);
    setBorderWidth(0);
    setBorderStyle("solid");
    setBorderColor("#2563eb");
    setRotation(0);
    setOpacity(1);
    setGrayscale(0);
    setSepia(0);
    setBlur(0);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground text-sm">Image Formatting & Alignment</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body (scrollable side panels + preview) */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Controls - Left (8 cols) */}
          <div className="md:col-span-7 space-y-6">

            {/* Wrap & Alignment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Move className="h-3.5 w-3.5 text-accent" /> Text Wrap & Position
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "inline", label: "Inline", desc: "Flows with text" },
                  { id: "left", label: "Left", desc: "Float Left" },
                  { id: "right", label: "Right", desc: "Float Right" },
                  { id: "center", label: "Center", desc: "Block Center" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setWrap(item.id as any)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition ${
                      wrap === item.id
                        ? "border-accent bg-accent/5 text-accent font-semibold"
                        : "border-border bg-background text-muted-foreground hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs">{item.label}</span>
                    <span className="text-[9px] opacity-80 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sizing */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Move className="h-3.5 w-3.5 text-accent" /> Dimension & Scale
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Width (e.g. 50% or 300px)</span>
                  <input
                    type="text"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Height (e.g. auto or 200px)</span>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Cropping */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Crop className="h-3.5 w-3.5 text-accent" /> Crop Image (Inset %)
              </label>
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-xl border border-border/60">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Top <span>{cropTop}%</span></span>
                  <input
                    type="range" min="0" max="80" value={cropTop}
                    onChange={(e) => setCropTop(parseInt(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Bottom <span>{cropBottom}%</span></span>
                  <input
                    type="range" min="0" max="80" value={cropBottom}
                    onChange={(e) => setCropBottom(parseInt(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Left <span>{cropLeft}%</span></span>
                  <input
                    type="range" min="0" max="80" value={cropLeft}
                    onChange={(e) => setCropLeft(parseInt(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Right <span>{cropRight}%</span></span>
                  <input
                    type="range" min="0" max="80" value={cropRight}
                    onChange={(e) => setCropRight(parseInt(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Border & Corners */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-accent" /> Border & Corner Styling
              </label>
              <div className="bg-muted/20 p-3 rounded-xl border border-border/60 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground flex justify-between">Border Radius <span>{borderRadius}px</span></span>
                    <input
                      type="range" min="0" max="100" value={borderRadius}
                      onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                      className="w-full accent-accent h-1 rounded bg-border appearance-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground flex justify-between">Border Width <span>{borderWidth}px</span></span>
                    <input
                      type="range" min="0" max="15" value={borderWidth}
                      onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                      className="w-full accent-accent h-1 rounded bg-border appearance-none"
                    />
                  </div>
                </div>
                {borderWidth > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Border Style</span>
                      <select
                        value={borderStyle}
                        onChange={(e) => setBorderStyle(e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded border border-border bg-background"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Border Color</span>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          className="h-6 w-8 rounded border border-border p-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          className="flex-1 text-[11px] px-2 py-0.5 rounded border border-border bg-background outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Effects & Filters */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-accent" /> Effects & Filters
              </label>
              <div className="bg-muted/20 p-3 rounded-xl border border-border/60 grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Rotation <span>{rotation}°</span></span>
                  <input
                    type="range" min="-180" max="180" value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Opacity <span>{Math.round(opacity * 100)}%</span></span>
                  <input
                    type="range" min="0.1" max="1" step="0.05" value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Grayscale <span>{grayscale}%</span></span>
                  <input
                    type="range" min="0" max="100" value={grayscale}
                    onChange={(e) => setGrayscale(parseInt(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Sepia <span>{sepia}%</span></span>
                  <input
                    type="range" min="0" max="100" value={sepia}
                    onChange={(e) => setSepia(parseInt(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-[10px] text-muted-foreground flex justify-between">Blur <span>{blur}px</span></span>
                  <input
                    type="range" min="0" max="10" step="0.5" value={blur}
                    onChange={(e) => setBlur(parseFloat(e.target.value))}
                    className="w-full accent-accent h-1 rounded bg-border appearance-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Preview Panel - Right (5 cols) */}
          <div className="md:col-span-5 flex flex-col h-full justify-start space-y-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Live Preview
            </span>
            <div className="border border-border/80 bg-muted/10 rounded-2xl p-4 flex items-center justify-center min-h-[220px] max-h-[300px] overflow-hidden relative">
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-muted/20 pointer-events-none" />
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={imgAlt || "Selected Image"}
                  className="max-w-full max-h-full object-contain shadow-md rounded"
                  style={{
                    clipPath: (cropTop > 0 || cropRight > 0 || cropBottom > 0 || cropLeft > 0)
                      ? `inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%)`
                      : undefined,
                    borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined,
                    border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : undefined,
                    transform: rotation ? `rotate(${rotation}deg)` : undefined,
                    opacity: opacity,
                    filter: [
                      grayscale > 0 ? `grayscale(${grayscale}%)` : "",
                      sepia > 0 ? `sepia(${sepia}%)` : "",
                      blur > 0 ? `blur(${blur}px)` : "",
                    ].filter(Boolean).join(" ") || undefined,
                  }}
                />
              ) : (
                <span className="text-xs text-muted-foreground">No image source</span>
              )}
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold border border-border/60 hover:bg-secondary/80 flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset Formatting
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border bg-muted/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-accent text-accent-foreground rounded-xl text-xs font-semibold hover:bg-accent/90 shadow-sm"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
}

// ---- Helpers ----

function parseStyleString(styleStr: string): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!styleStr) return styles;
  styleStr.split(";").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx > -1) {
      const key = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      styles[key] = val;
    }
  });
  return styles;
}

function getInitialWrap(s: Record<string, string>): "inline" | "left" | "right" | "center" {
  const float = s["float"] || "none";
  const display = s["display"] || "";
  const margin = s["margin"] || "";

  if (float === "left") return "left";
  if (float === "right") return "right";
  if (display === "block" && margin.includes("auto")) return "center";
  return "inline";
}

interface StyleStringConfig {
  width?: string;
  height?: string;
  wrap: "inline" | "left" | "right" | "center";
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  rotation: number;
  opacity: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

function buildStyleString(cfg: StyleStringConfig): string {
  const parts: string[] = [];

  // Dimensions
  if (cfg.width) parts.push(`width: ${cfg.width}`);
  if (cfg.height) parts.push(`height: ${cfg.height}`);

  // Wrapping & Alignment
  if (cfg.wrap === "left") {
    parts.push("float: left");
    parts.push("margin: 12px 16px 12px 0");
    parts.push("display: inline-block");
  } else if (cfg.wrap === "right") {
    parts.push("float: right");
    parts.push("margin: 12px 0 12px 16px");
    parts.push("display: inline-block");
  } else if (cfg.wrap === "center") {
    parts.push("float: none");
    parts.push("margin: 16px auto");
    parts.push("display: block");
  } else {
    parts.push("float: none");
    parts.push("margin: 8px");
    parts.push("display: inline-block");
  }

  // Cropping
  if (cfg.cropTop > 0 || cfg.cropRight > 0 || cfg.cropBottom > 0 || cfg.cropLeft > 0) {
    parts.push(`clip-path: inset(${cfg.cropTop}% ${cfg.cropRight}% ${cfg.cropBottom}% ${cfg.cropLeft}%)`);
  }

  // Border Radius
  if (cfg.borderRadius) {
    parts.push(`border-radius: ${cfg.borderRadius}`);
  }

  // Border
  if (cfg.borderWidth) {
    parts.push(`border: ${cfg.borderWidth} ${cfg.borderStyle || "solid"} ${cfg.borderColor || "#000000"}`);
  }

  // Rotation
  if (cfg.rotation && cfg.rotation !== 0) {
    parts.push(`transform: rotate(${cfg.rotation}deg)`);
  }

  // Opacity
  if (cfg.opacity !== undefined && cfg.opacity !== 1) {
    parts.push(`opacity: ${cfg.opacity}`);
  }

  // Filters
  const filters: string[] = [];
  if (cfg.grayscale > 0) filters.push(`grayscale(${cfg.grayscale}%)`);
  if (cfg.sepia > 0) filters.push(`sepia(${cfg.sepia}%)`);
  if (cfg.blur > 0) filters.push(`blur(${cfg.blur}px)`);
  if (filters.length > 0) {
    parts.push(`filter: ${filters.join(" ")}`);
  }

  return parts.join("; ") + ";";
}
