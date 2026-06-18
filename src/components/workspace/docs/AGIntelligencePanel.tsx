import { useState } from "react";
import { Sparkles, FileText, CheckCircle, Tag, Wand2, RefreshCw, Languages, FileOutput } from "lucide-react";
import type { Editor } from "@tiptap/react";

export function AGIntelligencePanel({ editor }: { editor: Editor | null }) {
  const [activeTab, setActiveTab] = useState<"intelligence" | "templates" | "analyzer" | "classification">("intelligence");

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold tracking-tight text-foreground">AG Intelligence</h2>
      </div>

      <div className="flex border-b border-border">
        {(["intelligence", "templates", "analyzer", "classification"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-xs font-medium text-center capitalize border-b-2 ${
              activeTab === t ? "border-accent text-foreground bg-accent/5" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "intelligence" ? "AI" : t === "classification" ? "Tags" : t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "intelligence" && <IntelligenceTab editor={editor} />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "analyzer" && <AnalyzerTab />}
        {activeTab === "classification" && <ClassificationTab />}
      </div>
    </aside>
  );
}

function IntelligenceTab({ editor }: { editor: Editor | null }) {
  const actions = [
    { icon: FileText, label: "Summarize Document" },
    { icon: RefreshCw, label: "Rewrite Content" },
    { icon: CheckCircle, label: "Improve Grammar" },
    { icon: Sparkles, label: "Improve Tone" },
    { icon: Wand2, label: "Expand Content" },
    { icon: Wand2, label: "Shorten Content" },
    { icon: FileOutput, label: "Executive Summary" },
    { icon: CheckCircle, label: "Extract Action Items" },
    { icon: Tag, label: "Extract Decisions" },
    { icon: FileText, label: "Extract Risks" },
  ];

  const languages = [
    "English", "Twi", "French", "Spanish", "Arabic", "Portuguese", 
    "Chinese (Simplified)", "German", "Russian", "Swahili", "Hindi", "Japanese"
  ];
  const [selectedLang, setSelectedLang] = useState("English");
  const [showLangs, setShowLangs] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Select text or use the full document to apply AG Intelligence transformations.
      </p>
      
      {/* Translate Section */}
      <div className="bg-muted/30 p-3 rounded-lg border border-border">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Languages className="h-4 w-4 text-accent" />
                Amineva Translate
             </div>
             <button 
               onClick={() => setShowLangs(!showLangs)}
               className="text-xs px-2 py-1 bg-background border border-border rounded hover:bg-muted"
             >
               {selectedLang} ▼
             </button>
          </div>
          
          {showLangs && (
             <div className="grid grid-cols-2 gap-1 mt-2">
               {languages.map(lang => (
                 <button
                   key={lang}
                   onClick={() => { setSelectedLang(lang); setShowLangs(false); }}
                   className={`text-left text-[11px] px-2 py-1 rounded ${selectedLang === lang ? 'bg-accent/20 text-accent font-medium' : 'hover:bg-muted text-foreground'}`}
                 >
                   {lang}
                 </button>
               ))}
             </div>
          )}
          
          <button 
            className="w-full mt-2 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors"
            onClick={() => window.alert(`Translating to ${selectedLang}...`)}
          >
            Translate Document
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        {actions.map((a, i) => (
          <button
            key={i}
            className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-foreground bg-background border border-border rounded-lg hover:border-accent hover:shadow-sm hover:text-accent transition-all"
            onClick={() => window.alert(`Mock Action: ${a.label}`)}
          >
            <a.icon className="h-4 w-4 opacity-70" />
            <span className="font-medium">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TemplatesTab() {
  const templates = [
    "Business Proposal", "Company Profile", "Press Release", "Project Report",
    "Investment Pitch", "Partnership Proposal", "Contract Draft", "Meeting Minutes",
    "Research Report", "Operational Report"
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Start with a professional AG business template.</p>
      <div className="grid gap-2">
        {templates.map((t, i) => (
          <button key={i} className="px-3 py-2 text-left text-sm text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function AnalyzerTab() {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/40 rounded-xl border border-border flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-bold text-accent mb-1">87</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Document Score</div>
      </div>
      <div className="space-y-3">
        {[
          { label: "Readability", val: "High" },
          { label: "Grammar", val: "Excellent" },
          { label: "Formatting Consistency", val: "Good" },
          { label: "Missing Sections", val: "None" },
          { label: "Professional Quality", val: "Premium" },
          { label: "Completeness", val: "95%" },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassificationTab() {
  const tags = ["Business", "Finance", "Legal", "Research", "News", "Marketing", "Operations", "Personal"];
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Classify this document for the AG Workspace.</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => (
          <button key={i} className="px-3 py-1 text-xs font-medium bg-muted text-foreground rounded-full hover:bg-accent/20 hover:text-accent transition-colors border border-border">
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
