import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDocument, updateDocument, snapshotVersion, type WorkspaceDocument,
} from "@/lib/workspace/documents";
import { useDocEditor } from "@/components/workspace/docs/DocEditor";
import { Ribbon } from "@/components/workspace/docs/Ribbon";
import { LeftDocPanel } from "@/components/workspace/docs/LeftDocPanel";
import { AmnivaIntelligencePanel } from "@/components/workspace/docs/AmnivaIntelligencePanel";
import { PageCanvas, DEFAULT_PAGE_SETTINGS, type PageSettings } from "@/components/workspace/docs/PageCanvas";
import { ShareDialog } from "@/components/workspace/docs/ShareDialog";
import { ImageEditorDialog } from "@/components/workspace/docs/ImageEditorDialog";
import { CollaborateDropdown } from "@/components/workspace/docs/CollaborateDropdown";
import { exportCSV, exportDOC, exportJSON, exportPDF } from "@/components/workspace/docs/exporters";
import {
  ChevronLeft, CloudUpload, Loader2, Download, Share2, ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

export default function DocsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const [doc, setDoc] = useState<WorkspaceDocument | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [showShare, setShowShare] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [pageSettings, setPageSettingsState] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS);
  const [classification, setClassification] = useState<string | null>(null);
  const [trackChanges, setTrackChanges] = useState(false);
  const [rightWidth, setRightWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [totalPageCount, setTotalPageCount] = useState(1);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = window.innerWidth - moveEvent.clientX;
      if (nextWidth >= 280 && nextWidth <= 800) {
        setRightWidth(nextWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const saveTimer = useRef<number | null>(null);
  const versionTimer = useRef<number | null>(null);

  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const onUpdateRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    onUpdateRef.current = () => {
      scheduleSave();
    };
  });

  // Docs always render on a white page (Amineva intelligence surface).
  // Chrome around the page still respects the user's theme choice.
  // No forced theme mutation here.


  const editor = useDocEditor({
    initialContent: { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: () => {
      onUpdateRef.current?.();
    },
    onDoubleClickImage: () => {
      setShowImageEditor(true);
    },
  });

  // Load
  useEffect(() => {
    if (!id) return;
    (async () => {
      const d = await getDocument(id);
      if (!d) { toast({ title: "Document not found", variant: "destructive" as any }); navigate("/workspace/docs"); return; }
      setDoc(d);
      setTitle(d.title);
      document.title = d.title ? `${d.title} - Amineva Docs` : "Untitled - Amineva Docs";
      editor?.commands.setContent(d.content_json || { type: "doc", content: [{ type: "paragraph" }] });
      // Restore page settings + classification from outline json
      const outline = (d as any).outline || {};
      if (outline.__page__) setPageSettingsState({ ...DEFAULT_PAGE_SETTINGS, ...outline.__page__ });
      if ((d as any).classification) setClassification((d as any).classification);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor]);

  useEffect(() => {
    document.title = title ? `${title} - Amineva Docs` : "Untitled - Amineva Docs";
  }, [title]);

  function scheduleSave(extra: Partial<any> = {}) {
    if (!id || !editor) return;
    const immediateJson = editor.getJSON();
    const immediateText = editor.getText();
    void updateDocument(id, { content_json: immediateJson, content_text: immediateText, title: titleRef.current, ...extra } as any);
    setSaving("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const json = editor.getJSON();
      const text = editor.getText();
      const ok = await updateDocument(id, { content_json: json, content_text: text, title: titleRef.current, ...extra } as any);
      setSaving(ok ? "saved" : "idle");
    }, 800) as any;
    if (versionTimer.current) window.clearTimeout(versionTimer.current);
    versionTimer.current = window.setTimeout(() => {
      if (editor) snapshotVersion(id, editor.getJSON());
    }, 30000) as any;
  }

  useEffect(() => {
    return () => {
      if (!id || !editor) return;
      void updateDocument(id, { content_json: editor.getJSON(), content_text: editor.getText(), title: titleRef.current });
    };
  }, [id, editor]);

  function updatePageSettings(patch: Partial<PageSettings>) {
    const next = { ...pageSettings, ...patch };
    setPageSettingsState(next);
    if (id) {
      const outline = (doc as any)?.outline || {};
      updateDocument(id, { outline: { ...outline, __page__: next } } as any);
    }
  }
  function updateClassification(tag: string) {
    setClassification(tag);
    if (id) updateDocument(id, { classification: tag } as any);
  }

  async function commitTitle() {
    if (!id) return;
    await updateDocument(id, { title });
    setDoc((d) => (d ? { ...d, title } : d));
  }

  async function handleAction(action: string, payload?: any) {
    if (!editor) return;
    if (action === "dipa:legal") {
      setRightCollapsed(false);
      toast({ title: "Dipa Legal Panel Activated", description: "Analyzing document legal structure and precedents." });
      return;
    }
    if (action === "image:position") {
      const { selection } = editor.state;
      const isImage = selection && (selection as any).node && (selection as any).node.type.name === "image";
      if (!isImage) {
        toast({
          title: "No image selected",
          description: "Click on an image in the document first to format and edit it.",
        });
        return;
      }
      setShowImageEditor(true);
      return;
    }
    if (action === "toast") { toast({ title: payload?.title || "" }); return; }
    if (action === "track:toggle") { setTrackChanges((v) => !v); toast({ title: trackChanges ? "Track changes off" : "Track changes on" }); return; }
    if (action === "comment:add") {
      const c = window.prompt("Comment");
      if (c) editor.chain().focus().insertContent(`<mark>[Comment: ${c}]</mark>`).run();
      return;
    }
    if (action === "ai") {
      try {
        const { action: a, label } = payload || {};
        const sel = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ");
        const text = sel || editor.getText();
        toast({ title: `${label}…`, description: "Dipa is working." });
        const { data, error } = await supabase.functions.invoke("docs-intelligence", { body: { action: a, text } });
        if (error) throw error;
        const result = (data as any)?.result || (data as any)?.text;
        if (result) {
          if (sel) editor.chain().focus().deleteSelection().insertContent(result).run();
          else editor.chain().focus().insertContent(`\n\n${result}`).run();
          toast({ title: `${label} applied` });
        }
      } catch (e: any) {
        toast({ title: "AI action failed", description: e?.message, variant: "destructive" as any });
      }
    }
  }

  async function applyTemplate(name: string) {
    if (!editor) return;

    const currentText = editor.getText().trim();

    if (currentText.length > 20) {
      toast({
        title: `Converting document to ${name}…`,
        description: "Dipa AI is restructuring your content into a comprehensive document.",
      });

      try {
        const prompt = `Convert the following notes/text into a highly professional, beautifully styled, fully-fleshed out, and comprehensive ${name} in HTML format.
Do not include markdown wrappers like \`\`\`html or \`\`\`. Output ONLY the raw HTML content starting directly with standard HTML elements like <h1>, <h2>, <p>, <strong>, <ul>, <li>.
The document must be a complete, fully populated ${name} without any placeholder text, bracketed instructions, or empty templates.

Source Notes:
${currentText}`;

        const { data, error } = await supabase.functions.invoke("docs-intelligence", {
          body: { action: "rewrite", text: prompt },
        });

        if (error) throw error;

        const result = (data as any)?.result || (data as any)?.text;
        if (result) {
          const cleanedHtml = result
            .replace(/^```html\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();

          editor.chain().focus().setContent(cleanedHtml).run();
          setTitle(name);
          toast({ title: `${name} generated successfully via Dipa AI` });
          return;
        }
      } catch (e: any) {
        console.warn("Dipa conversion failed, using robust fallback template:", e);
      }
    }

    const html = TEMPLATES[name] || `<h1>${name}</h1><p>This is a professionally generated ${name} document designed for the Amineva Docs workspace.</p>`;
    editor.chain().focus().setContent(html).run();
    setTitle(name);
    toast({ title: `${name} template applied` });
  }

  const words = (editor?.storage as any)?.characterCount?.words?.() || 0;
  const chars = (editor?.storage as any)?.characterCount?.characters?.() || 0;

  if (!editor) return null;

  return (
    <div className="h-[100dvh] flex flex-col bg-muted/30 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/workspace/docs")}
            className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
            title="Back to documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1.5">
            <span>Workspace</span>
            <ChevronLeft className="h-3 w-3 rotate-180 opacity-50" />
            <span className="text-accent font-semibold">Amineva Docs</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex flex-col min-w-0">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); scheduleSave(); }}
              onBlur={commitTitle}
              placeholder="Untitled Document"
              className="text-base font-semibold text-foreground bg-transparent border-0 outline-none focus:bg-muted/50 rounded px-2 py-0.5 min-w-[180px] truncate"
            />
            <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground">
              {saving === "saving" ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Saving…</span> :
               saving === "saved" ? <span className="flex items-center gap-1 text-success"><CloudUpload className="h-3 w-3"/> All changes saved</span> :
               <span>Edited just now</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu onPDF={() => surfaceRef.current && exportPDF(title, surfaceRef.current)}
            onDOC={() => exportDOC(title, editor.getHTML(), title)}
            onJSON={() => exportJSON(title, editor.getJSON())}
            onCSV={() => exportCSV(title, editor.getJSON())}
            onPrint={() => window.print()}
          />
          <CollaborateDropdown
            documentId={id}
            documentTitle={title}
            onOpenShare={() => setShowShare(true)}
            onInsertMeetingLink={(link, topic) => {
              editor?.chain().focus().insertContent(`<p style="background: #e0e7ff; padding: 8px 12px; border-radius: 6px; border-left: 4px solid #4f46e5;"><strong>📅 Online Meeting: ${topic}</strong><br/><a href="${link}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${link}</a></p>`).run();
            }}
          />
        </div>
      </header>

      <div className="overflow-x-auto flex-shrink-0">
        <Ribbon
          editor={editor}
          pageSettings={pageSettings}
          onPageSettings={updatePageSettings}
          onAction={handleAction}
          wordsCount={words}
          charCount={chars}
          onToggleLeftPanel={() => setLeftCollapsed((v) => !v)}
          onToggleRightPanel={() => setRightCollapsed((v) => !v)}
          onZoom={(z) => {
            if (z === "fit-width" || z === "fit-page") setZoom(z === "fit-width" ? 1 : 0.7);
            else setZoom(z as number);
          }}
          zoom={zoom}
          showRuler={showRuler}
          onToggleRuler={() => setShowRuler((v) => !v)}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden lg:flex">
          <LeftDocPanel
            collapsed={leftCollapsed}
            onToggleCollapsed={() => setLeftCollapsed((v) => !v)}
            currentId={id}
          />
        </div>

        <main className="flex-1 overflow-auto bg-muted/30 py-4 sm:py-8 px-2 sm:px-4" id="doc-scroll-container">
          {showRuler && (
            <div className="hidden sm:flex max-w-[900px] mx-auto h-6 bg-card border border-border rounded mb-2 items-center px-2 text-[9px] text-muted-foreground">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="flex-1 border-l border-border h-3" />
              ))}
            </div>
          )}
          <PageCanvas
            editor={editor}
            settings={pageSettings}
            zoom={zoom}
            surfaceRef={surfaceRef}
            onHeaderChange={(s) => updatePageSettings({ header: s })}
            onFooterChange={(s) => updatePageSettings({ footer: s })}
            onPageCountChange={(cnt) => setTotalPageCount(cnt)}
          />
        </main>

        {!rightCollapsed && (
          <div
            onMouseDown={startResize}
            className={`hidden lg:block w-1 hover:w-1.5 bg-border hover:bg-accent/50 cursor-col-resize transition-all h-full flex-shrink-0 select-none ${isResizing ? 'bg-accent w-1.5' : ''}`}
          />
        )}

        <div className="hidden lg:flex">
          <AmnivaIntelligencePanel
            editor={editor}
            collapsed={rightCollapsed}
            onToggleCollapsed={() => setRightCollapsed((v) => !v)}
            onApplyTemplate={applyTemplate}
            classification={classification}
            onSetClassification={updateClassification}
            width={rightWidth}
          />
        </div>
      </div>


      {/* Status bar */}
      <footer className="h-7 border-t border-border bg-card flex items-center justify-between px-4 text-[11px] text-muted-foreground flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded border border-border">Page 1 of {totalPageCount}</span>
          <span>Words: <span className="text-foreground font-medium">{words}</span></span>
          <span>Chars: <span className="text-foreground font-medium">{chars}</span></span>
          <span>{pageSettings.size} · {pageSettings.orientation}</span>
          {classification && <span className="text-accent">#{classification}</span>}
          {trackChanges && <span className="text-warning">Track changes on</span>}
        </div>
        <div className="flex items-center gap-3">
          <span>{pageSettings.mode === "print" ? "Print Layout" : pageSettings.mode === "web" ? "Web Layout" : "Reading"}</span>
          <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="hover:text-foreground">−</button>
            <span className="min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} className="hover:text-foreground">+</button>
          </div>
        </div>
      </footer>

      {showShare && id && <ShareDialog documentId={id} onClose={() => setShowShare(false)} />}
      {showImageEditor && editor && <ImageEditorDialog editor={editor} onClose={() => setShowImageEditor(false)} />}
    </div>
  );
}

function ExportMenu({ onPDF, onDOC, onJSON, onCSV, onPrint }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border text-xs font-medium hover:bg-secondary/80 flex items-center gap-1.5">
        <Download className="h-3.5 w-3.5" /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-[100] w-44 rounded-lg border border-border bg-popover shadow-xl py-1 text-sm">
            {[["PDF", onPDF], ["DOC", onDOC], ["JSON", onJSON], ["CSV", onCSV], ["Print", onPrint]].map(([l, fn]: any) => (
              <button key={l} onClick={() => { setOpen(false); fn(); }} className="w-full text-left px-3 py-1.5 hover:bg-muted text-foreground">{l}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TEMPLATES: Record<string, string> = {
  "Business Plan": `<h1>Strategic Business Plan</h1>
<h2>1. Executive Summary</h2>
<p>Amineva Enterprise is a pioneering platform that integrates essential business productivity tools—including documents, spreadsheets, slides, forms, and custom solutions—into a cohesive, secure, and AI-enabled workspace. Our mission is to eliminate tool fragmentation and enable seamless enterprise collaboration.</p>
<p>By leveraging local-first data layers, high-fidelity spreadsheet-to-solution bi-directional synchronization, and our context-aware Dipa AI intelligence engine, we address key bottlenecks in administrative and operational workflows worldwide.</p>
<h2>2. Company & Team Overview</h2>
<p>Amineva operates on a hybrid model that combines the high-fidelity editing experience of desktop software with the real-time synchronization and sharing of cloud platforms. Our leadership team consists of seasoned software engineers, product designers, and corporate advisors who have successfully shipped global-scale collaborative software. Our headquarters directs core research, security auditing, and partner integrations.</p>
<h2>3. Market Analysis & Strategy</h2>
<p>The office productivity and enterprise software market represents a massive opportunity, projected to grow past $50 billion by 2030. Existing players offer feature-rich individual products but suffer from severe cross-tool silos and high licensing fees. Amineva targets medium-and-large enterprises, legal operations, HR divisions, and project managers, offering complete custom business environments right out of the box.</p>
<h2>4. Financial Forecast</h2>
<p>Amineva utilizes a subscription-based pricing model combined with custom enterprise licensing agreements. With heavily optimized, containerized backend pipelines and highly efficient client-side rendering engines, we project an outstanding gross margin of 78% by Year 2, establishing a strong foundation for rapid global expansion.</p>`,

  "Business Proposal": `<h1>Professional Business Proposal</h1>
<h2>1. Executive Summary</h2>
<p>This proposal outlines a strategic plan to optimize your organization's administrative and document workflow by integrating the Amineva unified workspace. Our solution combines advanced word processing, cell merge calculations, slides development, and custom data workflows into a single platform.</p>
<h2>2. Project Objectives</h2>
<p>Our core objective is to reduce average task completion time by 35% within the first quarter of deployment. This will be achieved by streamlining internal communications, implementing secure print-once sharing mechanisms, and automating routine legal and content audits through Dipa AI.</p>
<h2>3. Our Approach</h2>
<p>We propose a three-phased implementation strategy: first, a detailed workflow analysis to map your existing schemas; second, a localized pilot deployment utilizing our secure databases; and third, full organizational onboarding combined with custom training and 24/7 technical support.</p>
<h2>4. Investment & Timeline</h2>
<p>The total investment for the pilot and initial rollout phase is fully outlined in the attached pricing matrix. The onboarding and integration timeline spans exactly six weeks from authorization, with key deliverables scheduled at bi-weekly milestones.</p>`,

  "Company Profile": `<h1>Corporate Company Profile</h1>
<h2>1. About Us</h2>
<p>We are a premier provider of high-fidelity software and workspace solutions dedicated to optimizing operational workflows and business productivity across global markets. Since our founding, we have consistently designed and delivered elegant, robust, and secure technologies that empower cross-functional teams to collaborate seamlessly and with high intelligence.</p>
<h2>2. Our Mission & Vision</h2>
<p><strong>Mission:</strong> To democratize high-end enterprise software by delivering exceptional, unified workspaces that make professional collaboration effortless, secure, and highly intelligent for every organization.</p>
<p><strong>Vision:</strong> To be the global benchmark for enterprise cloud-native workspaces, driving positive administrative and operational outcomes through user-centric engineering and outstanding design.</p>
<h2>3. Services & Specializations</h2>
<ul>
  <li><strong>Unified Workspace Suites:</strong> Comprehensive text editors, powerful spreadsheet engines, and beautiful slides designers.</li>
  <li><strong>Dipa AI Intelligence:</strong> Contextual real-time legal audits, advanced translation across 12 languages, and automatic document restructuring.</li>
  <li><strong>Enterprise Solutions:</strong> Private database synchronization, compliance management, and localized data storage architectures.</li>
</ul>`,

  "Personal Profile": `<h1>Professional Profile & Portfolio</h1>
<h2>1. Personal & Professional Summary</h2>
<p>I am a highly motivated, solutions-oriented professional with extensive experience leading cross-functional teams and implementing high-impact enterprise workflows. With a background in software systems, project management, and business analytics, I excel at turning complex technical requirements into elegant, high-performing operational realities.</p>
<h2>2. Core Competencies & Skills</h2>
<ul>
  <li><strong>Technical Leadership:</strong> System architecture, full-stack software design, and cloud-native integration.</li>
  <li><strong>Operations Management:</strong> Agile development methodologies, workflow automation, and performance metrics tracking.</li>
  <li><strong>Strategic Communication:</strong> Executive reporting, cross-departmental alignment, and stakeholder relations.</li>
</ul>
<h2>3. Key Career Accomplishments</h2>
<p><strong>Lead Solutions Architect</strong> | Amineva Systems (2022 - Present)</p>
<p>Directed the core design of a highly secure, local-storage first document management workspace, reducing foreign-key constraint sharing errors to 0%. Successfully launched an unauthenticated respondent portal for dynamic data collection, boosting enterprise data intake efficiency by over 40%.</p>`,

  "Press Release": `<h1>FOR IMMEDIATE RELEASE</h1>
<h2>Amineva Launches Next-Generation Collaborative Workspace "Amineva Docs"</h2>
<p><strong>Silicon Valley, CA — Today —</strong> Amineva, a leading innovator in enterprise software, today officially unveiled its newest product, "Amineva Docs". This marks a major milestone in the productivity space, introducing a unified workspace where documents, spreadsheets, and slides exist in absolute harmony, fully synchronized by the context-aware Dipa AI engine.</p>
<p>Amineva Docs introduces a highly requested secure print-once sharing model where share links are automatically revoked once printed, ensuring absolute confidential document control for modern legal, financial, and executive teams.</p>
<h3>About Amineva</h3>
<p>Amineva is dedicated to designing modern, high-performance office suites that prioritize privacy, speed, and intelligence. Our platforms are trusted by thousands of professionals around the world to keep their operations moving forward.</p>`,

  "Project Report": `<h1>Detailed Project Status Report</h1>
<h2>1. Project Overview</h2>
<p>This report provides a comprehensive progress update on the implementation of the Amineva Workspace integration. The project remains on schedule and within budget, with key technical frameworks fully established and tested.</p>
<h2>2. Development Progress</h2>
<p>We have successfully deployed the bi-directional CRM and Sheets synchronization engine. Our teams have finalized the JSDOM unit test coverage, ensuring 100% compliance across all document creation, data formatting, and workbook calculations.</p>
<h2>3. Identified Risks & Gaps</h2>
<p>While integration is proceeding smoothly, minor performance overheads were detected during heavy cell-merge operations. This risk has been mitigated by implementing isolated typing state handlers to prevent full-table re-renders.</p>
<h2>4. Action Items & Next Steps</h2>
<ul>
  <li>Complete user acceptance testing (UAT) for the Dipa Legal embedded review panel.</li>
  <li>Initiate global training sessions for administrative and legal operations staff.</li>
  <li>Finalize cloud synchronization and regional database compliance reviews.</li>
</ul>`,

  "Investment Pitch": `<h1>Strategic Investment Pitch</h1>
<h2>1. The Problem</h2>
<p>Modern businesses are buried under a mountain of tool fragmentation. Teams average over six disparate tools for daily work (docs, sheets, slides, forms, CRM, etc.), resulting in massive productivity leaks, high subscription costs, and severe security risks.</p>
<h2>2. The Solution</h2>
<p>Amineva is a unified, local-first workspace that brings word processing, advanced spreadsheets, interactive slides, and customizable forms into a single high-performance platform. It is fully integrated with Dipa AI to automate legal and business reviews.</p>
<h2>3. Our Traction</h2>
<p>Since our private beta release, we have grown our active user base by 250% quarter-over-quarter, with enterprise clients in legal, manufacturing, and HR sectors reporting a 30% reduction in document drafting lifecycles.</p>
<h2>4. The Ask</h2>
<p>We are raising our seed round to accelerate the development of our offline-first synchronization engine and expand our corporate sales team to address the surging global enterprise demand.</p>`,

  "Partnership Proposal": `<h1>Strategic Partnership Proposal</h1>
<h2>1. Partnership Opportunity</h2>
<p>This proposal outlines a powerful partnership opportunity between our respective organizations to combine our industry-leading service delivery with Amineva's state-of-the-art document intelligence and productivity suite.</p>
<h2>2. Mutual Value Proposition</h2>
<p>By integrating Amineva's secure sharing, real-time collaboration, and Dipa AI legal audit engines, we will provide our shared clients with a highly resilient, enterprise-grade workspace that significantly lowers operating costs while maintaining the highest data security standards.</p>
<h2>3. Strategic Alignment & Next Steps</h2>
<p>We propose establishing a joint technical and marketing task force to develop custom solution templates and direct-integration APIs over the next 90 days, followed by a co-branded launch targeting mid-market enterprise operations.</p>`,

  "Contract Draft": `<h1>STANDARD SERVICES AGREEMENT</h1>
<p>This Standard Services Agreement (the "Agreement") is entered into and made effective as of today, by and between the parties outlined in the executing schedule.</p>
<h2>1. Scope of Services</h2>
<p>Provider shall deliver comprehensive technical consulting, software integration, and system migration services as detailed in the attached Statement of Work (SOW). All services will be performed in a highly professional and timely manner.</p>
<h2>2. Term & Termination</h2>
<p>This Agreement shall commence on the Effective Date and shall remain in force for exactly twelve (12) months, unless terminated earlier by either party with thirty (30) days written notice.</p>
<h2>3. Compensation & Payment</h2>
<p>Client agrees to pay all invoiced amounts in accordance with the payment schedule outlined in SOW, with standard payment terms set at net-30 days from the date of invoice.</p>
<h2>4. Confidentiality</h2>
<p>Each party agrees to maintain strict confidentiality regarding all proprietary business and technical information disclosed during the term of this Agreement.</p>`,

  "Meeting Minutes": `<h1>Corporate Meeting Minutes</h1>
<p><strong>Meeting Date:</strong> Today<br/>
<strong>Meeting Chair:</strong> Executive Director<br/>
<strong>Present Attendees:</strong> Operations Lead, Engineering VP, Design Director, Product Manager</p>
<h2>1. Agenda Overview</h2>
<ul>
  <li>Review of Amineva Docs launch timeline and current QA metrics.</li>
  <li>Discussion on customer feedback regarding Image Editing and Page Canvas features.</li>
  <li>Allocation of operational resources for the upcoming quarterly sprint.</li>
</ul>
<h2>2. Key Decisions Made</h2>
<ul>
  <li>Approved the release of the updated resizable Dipa sidebar panel to improve visibility.</li>
  <li>Decided to transition the page canvas context menu to support deep page content deletion.</li>
</ul>
<h2>3. Action Items</h2>
<ul>
  <li><strong>Engineering Team:</strong> Resolve the print preview rendering bug by adding proper scroll containers.</li>
  <li><strong>Design Team:</strong> Finalize mockups for the draggable split-pane drag-resize handles.</li>
</ul>`,

  "Research Report": `<h1>Academic & Market Research Report</h1>
<h2>1. Abstract</h2>
<p>This research paper examines the impact of unified, AI-enabled workspace environments on modern administrative workflows and information retention. Our findings show a significant positive correlation between single-platform integration and cognitive efficiency.</p>
<h2>2. Methodology</h2>
<p>We conducted a comprehensive double-blind study across 150 administrative departments, tracking task transition overhead, spelling and grammar accuracy, and user frustration metrics over a continuous six-month observational period.</p>
<h2>3. Findings & Quantitative Data</h2>
<p>Teams utilizing unified workspaces experienced a remarkable 42% decrease in context-switching times and achieved a 98% document compliance rate, heavily driven by embedded real-time AI and legal auditing assistants.</p>
<h2>4. Key Conclusions</h2>
<p>Consolidating enterprise workflows into a single high-fidelity, offline-resilient platform like Amineva represents a major advancement in organizational productivity, successfully mitigating the substantial hidden costs of tool fragmentation.</p>`,

  "Operational Report": `<h1>Monthly Operational Performance Report</h1>
<h2>1. Reporting Period</h2>
<p>This report covers all core performance metrics, system uptimes, and database ingest rates for the current active operational cycle.</p>
<h2>2. Key Performance Indicators (KPIs)</h2>
<ul>
  <li><strong>System Availability:</strong> Achieved an outstanding 99.99% cloud uptime.</li>
  <li><strong>Document Sync Speed:</strong> Average database save latency maintained under 120ms.</li>
  <li><strong>Form Response Intake:</strong> Processed over 150,000 unauthenticated portal entries with zero data loss.</li>
</ul>
<h2>3. Operational Issues & Resolution</h2>
<p>Minor schema synchronization delays were identified during heavy database migration. These were resolved by implementing a robust local fallback cache to ensure continuous offline data capture.</p>
<h2>4. Recommendations</h2>
<p>We recommend expanding the memory storage capacity of our localized edge functions to support increasingly complex doc-intelligence and Dipa Legal analysis requests.</p>`,
};
