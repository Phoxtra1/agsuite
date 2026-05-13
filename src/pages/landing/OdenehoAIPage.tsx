import { FC } from "react";
import { motion } from "framer-motion";
import {
  Brain, Search, BarChart3, PenTool, CalendarClock, FileText,
  Landmark, BookOpen, Library, Feather, Film, Radio,
  Sparkles, Globe, Shield, Zap, ArrowRight, Network, Mic,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const OdenehoAI: FC = () => {
  const capabilities = [
    { icon: Search, title: "Research & Analysis", desc: "Deep, source-grounded research across domains with citation-ready synthesis and comparative analysis." },
    { icon: BarChart3, title: "Data Insights", desc: "Turn raw datasets into clear narratives — patterns, correlations, and forecasts you can act on." },
    { icon: PenTool, title: "Content Creation", desc: "Articles, briefs, scripts, and long-form writing crafted with structure, tone, and clarity." },
    { icon: CalendarClock, title: "Planning & Scheduling", desc: "Structured roadmaps, agendas, and timelines that adapt to your goals and constraints." },
    { icon: FileText, title: "Business Documentation", desc: "Proposals, SOPs, reports, and strategy documents written with executive precision." },
    { icon: Landmark, title: "Historical & Cultural Knowledge", desc: "Africa-centered context, traditions, and global heritage — preserved, explained, and connected." },
    { icon: BookOpen, title: "Storytelling & Narratives", desc: "Story arcs, oral traditions, and modern narratives shaped with cultural depth and craft." },
    { icon: Library, title: "Library", desc: "A living archive of references, dossiers, and curated knowledge collections at your fingertips." },
    { icon: BookOpen, title: "Books", desc: "Summaries, study companions, and guided reading across literature, science, and philosophy." },
    { icon: Feather, title: "Poetry & Creative Arts", desc: "Verse, lyrical writing, and creative expression rooted in rhythm, meaning, and tradition." },
    { icon: Film, title: "Curated Video Narration", desc: "Voice-led narration over selected footage — documentaries, explainers, and visual essays." },
    { icon: Mic, title: "Live Storytelling & Discussions", desc: "Real-time conversations, panels, and oral storytelling sessions hosted with intelligent moderation." },
    { icon: Newspaper, title: "News & Reporting Insights", desc: "Contextual reporting that goes beyond headlines — analysis, perspective, and verified depth." },
  ];

  const pillars = [
    { icon: Brain, title: "Intelligent", desc: "Reasoning that adapts to nuance, context, and intent." },
    { icon: Search, title: "Research-Driven", desc: "Grounded in evidence, sources, and verifiable insight." },
    { icon: Sparkles, title: "Creative", desc: "Original expression across writing, narration, and art." },
    { icon: Zap, title: "Futuristic", desc: "Built on next-generation AI and multimodal intelligence." },
    { icon: Network, title: "Ecosystem-Connected", desc: "Linked to the wider Amineva intelligence network." },
    { icon: Globe, title: "African Knowledge-Centered", desc: "Anchored in African heritage, language, and worldview." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <Brain className="h-4 w-4" /> Intelligent AI Companion
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Meet Odeneho AI.<br />
              <span className="text-accent">Knowledge, Reimagined.</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              An intelligent AI companion for research, writing, planning, documentation, storytelling, knowledge systems, and data analysis — rooted in African knowledge and built for the world.
            </p>
            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
            >
              Explore Odeneho <ArrowRight className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">The Odeneho Mind</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Six Pillars of Intelligence</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <motion.div key={p.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-2xl border border-border bg-card hover:border-accent/50 transition">
              <p.icon className="h-9 w-9 text-accent mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">What Odeneho AI Does</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-3">
              From deep research to creative narration — one companion across the full spectrum of knowledge work.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((c, i) => (
              <motion.div key={c.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card hover:border-accent/50 transition">
                <c.icon className="h-8 w-8 text-accent mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Ask. Explore. Create.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Ask Anything", desc: "Pose a question, brief, or creative prompt — in any voice or language Odeneho understands.", icon: Search },
            { step: "02", title: "Explore Deeply", desc: "Odeneho researches, synthesizes, and connects ideas across data, history, and culture.", icon: Brain },
            { step: "03", title: "Create & Share", desc: "Receive structured, narrated, or written outputs ready for publication, planning, or performance.", icon: Sparkles },
          ].map((s, i) => (
            <motion.div key={s.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="relative p-8 rounded-2xl border border-border bg-card">
              <div className="text-6xl font-black text-accent/10 absolute top-4 right-6">{s.step}</div>
              <s.icon className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Odeneho */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Why Odeneho AI?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Globe, title: "Rooted in Africa, Open to the World", desc: "Cultural intelligence built into every response — without losing global breadth." },
              { icon: Shield, title: "Trustworthy by Design", desc: "Source-aware research, transparent reasoning, and respectful handling of heritage knowledge." },
              { icon: Network, title: "Connected Ecosystem", desc: "Seamlessly integrates with the wider Amineva platforms, libraries, and workflows." },
              { icon: Radio, title: "Voice & Story Native", desc: "Built for narration, oral tradition, and live discussion — not just text." },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
                <item.icon className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Begin Your Journey with Odeneho</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join thinkers, creators, and researchers using Odeneho AI to explore knowledge, craft stories, and shape the future.
          </p>
          <a
            href="#capabilities"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default OdenehoAI;
