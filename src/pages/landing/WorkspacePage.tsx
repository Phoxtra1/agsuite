import { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Sheet, Presentation, ClipboardList, FolderOpen, ArrowRight, Tag, Share2, Download } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const WorkspacePage: FC = () => {
  const modules = [
    { icon: FileText, name: "AG Docs", note: "Available now", live: true },
    { icon: Sheet, name: "AG Sheets", note: "Coming soon" },
    { icon: Presentation, name: "AG Slides", note: "Coming soon" },
    { icon: ClipboardList, name: "AG Forms", note: "Coming soon" },
    { icon: FolderOpen, name: "AG Drive", note: "Coming soon" },
  ];
  const pillars = [
    { icon: Tag, title: "Structured intelligence", desc: "Tag sections as insight, data, summary, evidence, or reference — every document becomes structured intelligence." },
    { icon: Download, title: "Multi-format exports", desc: "Ship the same document as PDF, DOC, JSON, or CSV — ready for any system." },
    { icon: Share2, title: "Shareable links", desc: "View-only or editable links for research, field work, and external collaboration." },
  ];

  return (
    <div className="w-full">
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <FileText className="h-4 w-4" /> Workspace · Productivity & Data Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              A workspace that <span className="text-accent">thinks in data.</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto mb-8">
              Workspace is the unified hub for documents, data, and structured intelligence — starting with AG Docs and expanding into Sheets, Slides, Forms, and Drive.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg">
              Open Workspace <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto py-20 px-6">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Modules</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">A growing toolkit</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {modules.map((m, i) => (
            <motion.div key={m.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className={`p-5 rounded-2xl border text-center ${m.live ? "border-accent/50 bg-card" : "border-dashed border-border bg-muted/30"}`}>
              <m.icon className="h-8 w-8 mx-auto text-accent mb-3" />
              <h3 className="font-semibold text-foreground">{m.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{m.note}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Why Workspace</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Built for intelligence, not just text</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <motion.div key={p.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-2xl border border-border bg-card">
                <p.icon className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Start with AG Docs.</h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">Create your first structured document in seconds.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg">
          Get Started <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </div>
  );
};

export default WorkspacePage;
