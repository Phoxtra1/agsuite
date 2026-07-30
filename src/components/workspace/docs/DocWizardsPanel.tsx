import { useState } from "react";
import {
  Wand2, Sparkles, FileText, ChevronRight, ArrowLeft, Check, Play,
  Briefcase, Presentation, UserCheck, FolderGit2, FileCode, CheckCircle2,
  FileCheck, ScrollText, Mail, ShieldAlert, PieChart, Layers, HelpCircle
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { toast } from "@/hooks/use-toast";

interface DocWizardsPanelProps {
  editor: Editor | null;
}

export function DocWizardsPanel({ editor }: DocWizardsPanelProps) {
  const [activeWizard, setActiveWizard] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  // Form states for Wizards
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const insertGeneratedDoc = (title: string, html: string) => {
    if (!editor) {
      toast({ title: "Editor Not Ready", variant: "destructive" as any });
      return;
    }
    editor.chain().focus().setContent(html).run();
    toast({
      title: `${title} Generated`,
      description: "Formatted document inserted into editor. Fully editable!",
    });
    setActiveWizard(null);
    setStep(0);
    setFormData({});
  };

  // 1. Business Plan Generator
  const generateBusinessPlan = () => {
    const company = formData.companyName || "Acme Innovations Ltd";
    const industry = formData.industry || "Software & Technology";
    const targetMarket = formData.targetMarket || "Enterprise & SMB Clients";
    const funding = formData.fundingNeed || "$250,000";

    const html = `
      <h1>Business Plan — ${company}</h1>
      <p><em>Industry Sector: ${industry} | Target Funding: ${funding}</em></p>
      
      <h2>1. Executive Summary</h2>
      <p><strong>${company}</strong> is a high-growth entity operating within the <strong>${industry}</strong> market. Our vision is to deliver transformative solutions designed for ${targetMarket}.</p>
      
      <h2>2. Market Analysis & Industry Outlook</h2>
      <p>The total addressable market (TAM) for ${industry} is rapidly expanding. Key growth drivers include digital transformation and demand for specialized services among ${targetMarket}.</p>
      <ul>
        <li><strong>Target Audience:</strong> ${targetMarket}</li>
        <li><strong>Competitive Advantage:</strong> Proprietary workflow architecture and rapid execution speed.</li>
      </ul>

      <h2>3. Operations & Implementation Plan</h2>
      <p>Operations are streamlined through structured phases focusing on product iteration, quality assurance, and automated deployment.</p>

      <h2>4. Financial Projections & Funding Requirements</h2>
      <p>We are seeking <strong>${funding}</strong> in capital expenditure to accelerate product development, expand market presence, and scale client success operations.</p>
      
      <table>
        <thead>
          <tr><th>Fiscal Year</th><th>Target Revenue</th><th>Gross Margin</th></tr>
        </thead>
        <tbody>
          <tr><td>Year 1</td><td>$150,000</td><td>65%</td></tr>
          <tr><td>Year 2</td><td>$450,000</td><td>72%</td></tr>
          <tr><td>Year 3</td><td>$1,200,000</td><td>78%</td></tr>
        </tbody>
      </table>
    `;
    insertGeneratedDoc("Business Plan", html);
  };

  // 2. Pitch Deck Generator
  const generatePitchDeck = () => {
    const title = formData.pitchTitle || "NextGen Platform";
    const problem = formData.problem || "Existing solutions are slow and unintegrated.";
    const solution = formData.solution || "An intelligent, unified platform powering real-time workflow.";

    const html = `
      <h1>Pitch Deck Document — ${title}</h1>
      
      <h2>Slide 1: Executive Overview & Opportunity</h2>
      <p><strong>${title}</strong> — Re-imagining operations for modern teams.</p>
      
      <h2>Slide 2: The Core Problem</h2>
      <p>${problem}</p>

      <h2>Slide 3: Our Solution</h2>
      <p>${solution}</p>

      <h2>Slide 4: Market Size & Opportunity</h2>
      <p>Addressing a multi-billion dollar market across regional and global markets.</p>

      <h2>Slide 5: Business Model & Revenue Streams</h2>
      <ul>
        <li>Subscription SaaS Tiered Licensing</li>
        <li>Enterprise Integration & Advisory Services</li>
      </ul>

      <h2>Slide 6: Financial Ask & Milestones</h2>
      <p>Seeking seed capital to execute aggressive market expansion and product scaling.</p>
    `;
    insertGeneratedDoc("Pitch Deck Document", html);
  };

  // Additional quick generators
  const generateQuickDoc = (type: string) => {
    let title = type;
    let html = "";

    switch (type) {
      case "Proposal":
        html = `<h1>Project Proposal</h1><h2>1. Objective</h2><p>Deliver high-impact solutions for client requirements.</p><h2>2. Scope of Work</h2><ul><li>Phase I: Research & Design</li><li>Phase II: Development</li><li>Phase III: Deployment</li></ul><h2>3. Budget & Timeline</h2><p>Total Estimated Timeline: 6 Weeks.</p>`;
        break;
      case "Report":
        html = `<h1>Performance & Status Report</h1><p><em>Date: ${new Date().toLocaleDateString()}</em></p><h2>Executive Summary</h2><p>Overview of key operational metrics and quarterly highlights.</p><h2>Key Metrics</h2><ul><li>Target Completion: 94%</li><li>User Engagement: +28% YoY</li></ul>`;
        break;
      case "Meeting Minutes":
        html = `<h1>Meeting Minutes</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Attendees:</strong> Executive Team</p><h2>1. Agenda Topics</h2><p>Review of strategic goals and project milestones.</p><h2>2. Decisions Made</h2><ul><li>Approved Q3 Budget allocation.</li><li>Finalized launch schedule.</li></ul><h2>3. Action Items</h2><p>1. Complete documentation audit by Friday.</p>`;
        break;
      case "SWOT Analysis":
        html = `<h1>SWOT Analysis Matrix</h1><table><thead><tr><th>Strengths</th><th>Weaknesses</th></tr></thead><tbody><tr><td>Strong tech stack & domain expertise</td><td>Resource constraints during peak cycles</td></tr></tbody><thead><tr><th>Opportunities</th><th>Threats</th></tr></thead><tbody><tr><td>Emerging international markets</td><td>Increased market competition</td></tr></tbody></table>`;
        break;
      default:
        html = `<h1>${type}</h1><h2>Overview</h2><p>Draft template for ${type}. Modify text directly in editor.</p>`;
    }

    insertGeneratedDoc(title, html);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/40 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-accent" />
          <span className="font-bold text-foreground">AI Guided Wizards & Assistants</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {!activeWizard ? (
          <>
            {/* Step-by-Step Wizards Section */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Step-by-Step AI Wizards</span>
              <div className="grid gap-2">
                {[
                  { id: "bizplan", title: "Business Plan Wizard", icon: Briefcase, desc: "Executive Summary, Market Analysis, Operations & Financials" },
                  { id: "pitch", title: "Pitch Deck Document Wizard", icon: Presentation, desc: "Problem, Solution, Traction, Market Size & Investment Ask" },
                  { id: "profile", title: "Company Profile Wizard", icon: FolderGit2, desc: "Mission, Vision, Services & Achievements" },
                  { id: "bio", title: "Personal Profile / CV Bios Wizard", icon: UserCheck, desc: "Consultant Bios, Executive CV & Founder Highlights" },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => { setActiveWizard(w.id); setStep(0); }}
                    className="p-3 bg-card border border-border rounded-xl hover:border-accent hover:shadow-sm text-left transition flex items-start justify-between group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition">
                        <w.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-xs">{w.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{w.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground mt-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Assistants Section */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Additional Document Generators</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  "Proposal", "Report", "Research Paper", "Meeting Minutes",
                  "Letter", "Policy Document", "Contract Draft", "SWOT Analysis"
                ].map((item) => (
                  <button
                    key={item}
                    onClick={() => generateQuickDoc(item)}
                    className="p-2 bg-background border border-border rounded-lg hover:border-accent text-left transition text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>{item}</span>
                    <Play className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Active Wizard Wizard Guided Form */
          <div className="space-y-4">
            <button
              onClick={() => setActiveWizard(null)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Wizard List
            </button>

            {activeWizard === "bizplan" && (
              <div className="space-y-3 bg-card p-3 border rounded-xl">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-accent" /> Business Plan Wizard
                </h3>
                
                <div className="space-y-2">
                  <label className="font-semibold text-foreground text-xs">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Technologies"
                    value={formData.companyName || ""}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-foreground text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-foreground text-xs">Industry & Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Healthcare AI / Fintech"
                    value={formData.industry || ""}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-foreground text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-foreground text-xs">Funding Target</label>
                  <input
                    type="text"
                    placeholder="e.g. $500,000"
                    value={formData.fundingNeed || ""}
                    onChange={(e) => handleInputChange("fundingNeed", e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-foreground text-xs"
                  />
                </div>

                <button
                  onClick={generateBusinessPlan}
                  className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 transition flex items-center justify-center gap-1.5 mt-2"
                >
                  <Sparkles className="h-4 w-4" /> Generate Business Plan
                </button>
              </div>
            )}

            {activeWizard === "pitch" && (
              <div className="space-y-3 bg-card p-3 border rounded-xl">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Presentation className="h-4 w-4 text-accent" /> Pitch Deck Document Wizard
                </h3>
                
                <div className="space-y-2">
                  <label className="font-semibold text-foreground text-xs">Project / Pitch Title</label>
                  <input
                    type="text"
                    placeholder="e.g. NextGen SaaS"
                    value={formData.pitchTitle || ""}
                    onChange={(e) => handleInputChange("pitchTitle", e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-foreground text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-foreground text-xs">Core Problem Addressed</label>
                  <textarea
                    rows={2}
                    placeholder="What friction exists in the market?"
                    value={formData.problem || ""}
                    onChange={(e) => handleInputChange("problem", e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-foreground text-xs"
                  />
                </div>

                <button
                  onClick={generatePitchDeck}
                  className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 transition flex items-center justify-center gap-1.5 mt-2"
                >
                  <Sparkles className="h-4 w-4" /> Generate Pitch Deck Document
                </button>
              </div>
            )}

            {(activeWizard === "profile" || activeWizard === "bio") && (
              <div className="space-y-3 bg-card p-3 border rounded-xl text-center py-6">
                <FileCheck className="h-8 w-8 text-accent mx-auto" />
                <h3 className="font-bold text-foreground">Generate {activeWizard === "profile" ? "Company Profile" : "Personal CV Bio"}</h3>
                <p className="text-muted-foreground text-xs">Click below to auto-generate formatted content directly into editor.</p>
                <button
                  onClick={() => generateQuickDoc(activeWizard === "profile" ? "Company Profile" : "Personal Bio")}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 transition inline-flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" /> Create Document
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
