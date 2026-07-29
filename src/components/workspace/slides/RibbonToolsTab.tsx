import React, { useState } from "react";
import { Sparkles, Languages, Volume2, AlignLeft, RefreshCw, Layers } from "lucide-react";
import { Slide, SlideElement, newSlideId } from "@/lib/workspace/slides/documents";

interface RibbonToolsTabProps {
  currentSlide: Slide;
  selectedElement: SlideElement | null;
  onUpdateElement: (patch: Partial<SlideElement>) => void;
  onAddSlideWithLayout: (layout: string, elements: SlideElement[]) => void;
  aiPrompt: string;
  onAiPromptChange: (val: string) => void;
  onGenerateAI: () => void;
  aiBusy: boolean;
}

export function RibbonToolsTab({
  currentSlide,
  selectedElement,
  onUpdateElement,
  onAddSlideWithLayout,
  aiPrompt,
  onAiPromptChange,
  onGenerateAI,
  aiBusy
}: RibbonToolsTabProps) {
  const [targetLang, setTargetLang] = useState("fr");
  const [translateBusy, setTranslateBusy] = useState(false);

  const handleRewriteText = (action: "improve" | "shorten" | "expand") => {
    if (!selectedElement || selectedElement.kind !== "text" || !selectedElement.text) {
      window.alert("Dipa AI Tools: Please select a text box element first.");
      return;
    }

    const text = selectedElement.text;
    let newText = text;

    if (action === "improve") {
      newText = `[Improved] ${text}`;
    } else if (action === "shorten") {
      newText = text.length > 20 ? text.substring(0, text.length / 2) + "..." : text;
    } else if (action === "expand") {
      newText = `${text}\n\nAdditional elaboration provided automatically by Dipa Smart Engine. This detailed guide adds context, metrics, and actionable workflows.`;
    }

    onUpdateElement({ text: newText });
  };

  const handleTranslateText = () => {
    if (!selectedElement || selectedElement.kind !== "text" || !selectedElement.text) {
      window.alert("Dipa AI Tools: Please select a text box element first.");
      return;
    }

    setTranslateBusy(true);
    setTimeout(() => {
      let translation = selectedElement.text || "";
      if (targetLang === "fr") {
        translation = `[FR] ${selectedElement.text} - Traduit par Dipa AI`;
      } else if (targetLang === "es") {
        translation = `[ES] ${selectedElement.text} - Traducido por Dipa AI`;
      } else if (targetLang === "de") {
        translation = `[DE] ${selectedElement.text} - Übersetzt von Dipa AI`;
      }
      onUpdateElement({ text: translation });
      setTranslateBusy(false);
    }, 800);
  };

  const handleVoiceNarration = () => {
    const textEls = currentSlide.elements.filter((e) => e.kind === "text" && e.text);
    if (textEls.length === 0) {
      window.alert("Voice Narration: No readable text found on this slide.");
      return;
    }

    const textToSpeak = textEls.map((e) => e.text).join(". ");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      window.alert("Web speech synthesis is not supported on your browser.");
    }
  };

  const handleSuggestedTemplates = () => {
    // Inserts structured analytical layout
    const sId = newSlideId();
    onAddSlideWithLayout("timeline", [
      { id: newSlideId(), kind: "text", x: 120, y: 90, w: 1680, h: 120, text: "AI Suggested Roadmap", fontSize: 60, fontWeight: 700, color: "#1E2761" },
      { id: newSlideId(), kind: "shape", shape: "arrow", x: 120, y: 540, w: 1680, h: 10, fill: "#2563eb" },
      { id: newSlideId(), kind: "text", x: 150, y: 300, w: 450, h: 200, text: "Phase 1: Spark\n\nAI design brainstorming & mock validation", fontSize: 28, color: "#0f172a", align: "center" },
      { id: newSlideId(), kind: "text", x: 735, y: 300, w: 450, h: 200, text: "Phase 2: Scale\n\nAutomatic PowerPoint layout deployment", fontSize: 28, color: "#0f172a", align: "center" }
    ]);
  };

  return (
    <div className="flex items-center gap-4 text-card-foreground select-none overflow-x-auto w-full py-1">
      {/* Group: Dipa Prompt-based Presentation */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-2 mb-1 h-7">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => onAiPromptChange(e.target.value)}
            placeholder="Create climate change slides..."
            className="text-xs border border-border bg-background rounded px-2 py-1 w-44 h-7 text-foreground"
          />
          <button
            disabled={aiBusy || !aiPrompt.trim()}
            onClick={onGenerateAI}
            className="px-2.5 py-1 bg-accent text-accent-foreground font-semibold hover:bg-accent/90 disabled:opacity-50 transition rounded text-xs flex items-center gap-1 h-7"
          >
            <Sparkles className="h-3.5 w-3.5" /> {aiBusy ? "Building..." : "Build Presentation"}
          </button>
        </div>
        <span className="text-[10px] text-accent font-bold uppercase tracking-wide flex items-center gap-0.5"><Sparkles className="h-3 w-3" /> Dipa AI Generator</span>
      </div>

      {/* Group: AI Quick Writing Helpers */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1.5 mb-1 h-7">
          <button
            onClick={() => handleRewriteText("improve")}
            disabled={!selectedElement || selectedElement.kind !== "text"}
            className="px-2 py-1 border border-border bg-background text-foreground hover:bg-muted rounded text-[11px] h-7 flex items-center gap-1 font-semibold disabled:opacity-50"
          >
            Rewrite / Improve
          </button>
          <button
            onClick={() => handleRewriteText("shorten")}
            disabled={!selectedElement || selectedElement.kind !== "text"}
            className="px-2 py-1 border border-border bg-background text-foreground hover:bg-muted rounded text-[11px] h-7 flex items-center gap-1 font-semibold disabled:opacity-50"
          >
            Shorten
          </button>
          <button
            onClick={() => handleRewriteText("expand")}
            disabled={!selectedElement || selectedElement.kind !== "text"}
            className="px-2 py-1 border border-border bg-background text-foreground hover:bg-muted rounded text-[11px] h-7 flex items-center gap-1 font-semibold disabled:opacity-50"
          >
            Expand Text
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Text Transformation</span>
      </div>

      {/* Group: Translation & Suggested templates */}
      <div className="flex flex-col items-center border-r border-border pr-3 h-full justify-between">
        <div className="flex items-center gap-1.5 mb-1 h-7">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="text-[11px] border border-border bg-background rounded px-1 h-7 text-foreground"
          >
            <option value="fr">French (fr)</option>
            <option value="es">Spanish (es)</option>
            <option value="de">German (de)</option>
          </select>
          <button
            onClick={handleTranslateText}
            disabled={translateBusy || !selectedElement || selectedElement.kind !== "text"}
            className="px-2 py-1 bg-accent text-accent-foreground rounded text-[11px] h-7 font-bold disabled:opacity-50 flex items-center gap-1"
          >
            <Languages className="h-3 w-3" /> {translateBusy ? "Translating..." : "Translate"}
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Languages</span>
      </div>

      {/* Group: Audio & Template Advice */}
      <div className="flex flex-col items-center h-full justify-between pr-1">
        <div className="flex items-center gap-1.5 mb-1 h-7">
          <button
            onClick={handleVoiceNarration}
            className="px-2 py-1 border border-border bg-background hover:bg-muted text-foreground rounded text-[11px] h-7 flex items-center gap-1 font-semibold"
            title="Read whole slide aloud using native audio speech synthesis"
          >
            <Volume2 className="h-3.5 w-3.5 text-accent" /> Speak Slide Aloud
          </button>
          <button
            onClick={handleSuggestedTemplates}
            className="px-2 py-1 border border-border bg-background hover:bg-muted text-foreground rounded text-[11px] h-7 flex items-center gap-1 font-semibold"
            title="Inject an Dipa Smart Diagram Roadmap"
          >
            <Layers className="h-3.5 w-3.5 text-amber-500" /> Suggest Layout
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Speech & Layouts</span>
      </div>
    </div>
  );
}
