import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Eye, Lightbulb, Globe, Cpu, CloudSun, Microscope, Rocket,
  Network, ArrowRight, Layers, Sparkles, BarChart3, ShieldCheck,
  Leaf, Building2, Brain, LineChart,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const sectorFocus = [
  { icon: Leaf, title: "Agriculture", desc: "Smart farming, agro alerts, climate-aware production." },
  { icon: CloudSun, title: "Climate Resilience", desc: "Environmental monitoring and risk intelligence." },
  { icon: Network, title: "Transport", desc: "Operational visibility and route resilience." },
  { icon: Building2, title: "Commerce & Trade", desc: "Inventory, sales, and digital trade infrastructure." },
  { icon: BarChart3, title: "Operational Intelligence", desc: "Verification, oversight, predictive insight." },
  { icon: Brain, title: "AI & Knowledge", desc: "Research, documentation, and intelligent assistance." },
];

const platformEcosystem = [
  { icon: Sparkles, title: "Dipa AI", role: "Intelligent companion for research, writing, planning, knowledge systems, and storytelling." },
  { icon: CloudSun, title: "Agyenkwa", role: "Climate-tech and environmental intelligence infrastructure for agriculture, forecasting, and operational risk." },
  { icon: BarChart3, title: "Inventra", role: "AI-backed inventory, commerce, and operational management infrastructure for smart business systems." },
  { icon: ShieldCheck, title: "DataLens", role: "Strategic assessment, field inspection, verification, and documentation infrastructure." },
  { icon: LineChart, title: "Sikasɛm", role: "AI-backed financial operations, monitoring, and oversight infrastructure." },
  { icon: Eye, title: "ABI", role: "Amineva Business Intelligence — unified BI infrastructure for dashboards, KPIs, market analytics, and data-driven decision support." },
  { icon: Lightbulb, title: "Adesua", role: "Digital learning and career pathway platform — ICT masterclass, learning resources, career guidance, school discovery, and scholarship opportunities." },
];

const coreValues = [
  "Innovation", "Intelligence", "Scalability", "African Transformation",
  "Operational Efficiency", "Climate Resilience", "Research & Knowledge",
  "Transparency", "Predictive Thinking", "Collaborative Innovation",
];

const faqs = [
  { q: "What is Amineva Global?", a: "Amineva Global is a technology and innovation company building intelligent digital systems and infrastructure that support operational intelligence, predictive analytics, environmental monitoring, research, and verification across critical African sectors." },
  { q: "Is Amineva Global a software company?", a: "Amineva Global is an innovation ecosystem rather than a single software vendor. We design and operate connected platforms, intelligence systems, and digital infrastructure that scale across sectors and partners." },
  { q: "What sectors does Amineva Global operate in?", a: "Agriculture, climate resilience, transport, commerce, digital trade, financial operations, research, and operational intelligence — with continued expansion into adjacent African sectors." },
  { q: "How are the platforms connected?", a: "Each platform is a division of one ecosystem. They share identity, intelligence pipelines, communication systems, and analytics — so insight, verification, and operations flow across the network." },
  { q: "Does Amineva Global support startups and innovation collaboration?", a: "Yes. Amineva Global supports accelerator partnerships, sector-focused innovation initiatives, technology experimentation, and institutional collaborations across the continent." },
  { q: "What is the long-term vision?", a: "To build the digital infrastructure layer for Africa's future — an interconnected innovation ecosystem powering intelligent operations, climate resilience, and scalable transformation." },
  { q: "What makes Amineva Global different?", a: "Ecosystem architecture over isolated apps, African-focused intelligence over generic tools, and infrastructure-grade design built for institutions, partners, and scale." },
];

const About: FC = () => {
  return (
    <div className="w-full">
      {/* Hero — Vision */}
      <section id="vision" className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-accent"
              style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animation: `pulse 3s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">About Amineva Global</span>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 tracking-tight leading-tight">
              Building intelligent digital{" "}
              <span className="text-accent">infrastructure for Africa's future.</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 max-w-3xl mx-auto leading-relaxed">
              Amineva Global is a technology and innovation company developing connected digital systems that power operational intelligence, environmental monitoring, predictive analytics, research, and service efficiency across the continent.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Innovation Ecosystem */}
      <section id="innovation-ecosystem" className="max-w-7xl mx-auto py-20 px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Innovation Ecosystem</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
              An integrated technology ecosystem — not an isolated app
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Amineva Global operates as an interconnected innovation ecosystem. Each platform is a division of a larger intelligence and infrastructure architecture — connected through shared identity, data pipelines, and operational systems.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This ecosystem-first design allows new platforms, partner programs, and sector initiatives to plug in without fragmenting the user experience or duplicating infrastructure.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="grid grid-cols-2 gap-4">
            {[
              { icon: Network, label: "Connected Systems", value: "Ecosystem" },
              { icon: Cpu, label: "Intelligence Layer", value: "AI-Backed" },
              { icon: Globe, label: "Continental Reach", value: "Africa-Focused" },
              { icon: Layers, label: "Architecture", value: "Scalable" },
            ].map((stat) => (
              <div key={stat.label} className="p-6 rounded-xl border border-border bg-card text-center">
                <stat.icon className="h-8 w-8 text-accent mx-auto mb-3" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What We Build */}
      <section id="what-we-build" className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">What We Build</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Intelligent Digital Infrastructure</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
              Operational intelligence systems, predictive analytics engines, environmental monitoring infrastructure, verification platforms, and AI-backed business systems — engineered to scale across sectors.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Cpu, title: "Operational Intelligence", desc: "Real-time visibility, oversight, and workflow intelligence across operations." },
              { icon: Brain, title: "AI-Backed Systems", desc: "Embedded intelligence for analysis, forecasting, and decision support." },
              { icon: CloudSun, title: "Environmental Monitoring", desc: "Climate, weather, and environmental risk infrastructure for resilience." },
              { icon: ShieldCheck, title: "Verification & Trust", desc: "Field assessment, documentation, and verification infrastructure." },
              { icon: LineChart, title: "Predictive Analytics", desc: "Forecasting, trend analysis, and strategic insight engines." },
              { icon: Building2, title: "Business Infrastructure", desc: "Inventory, financial operations, and digital trade systems." },
            ].map((b, i) => (
              <motion.div key={b.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="p-6 rounded-xl border border-border bg-card">
                <b.icon className="h-7 w-7 text-accent mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sector Focus */}
      <section id="sector-focus" className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Sector Focus</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Where We Operate</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {sectorFocus.map((s, i) => (
            <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="p-6 rounded-xl border border-border bg-card hover:border-accent/50 transition">
              <s.icon className="h-7 w-7 text-accent mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platform Ecosystem */}
      <section id="platform-ecosystem" className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Platform Ecosystem</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Connected Infrastructure Divisions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
              Each platform is a specialized division of the Amineva Global ecosystem — sharing identity, intelligence, and infrastructure.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformEcosystem.map((p, i) => (
              <motion.div key={p.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="p-6 rounded-xl border border-border bg-card">
                <p.icon className="h-7 w-7 text-accent mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Research & Intelligence */}
      <section id="research" className="max-w-7xl mx-auto py-20 px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Microscope className="h-10 w-10 text-accent mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Research & Intelligence</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our research and intelligence layer combines firsthand field data, secondary institutional sources, and AI-driven analysis to produce verified knowledge for decision-makers.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              From sector reports and predictive models to documentation systems and historical knowledge — intelligence flows across the ecosystem.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="grid grid-cols-2 gap-4">
            {["Firsthand Field Data", "Institutional Sources", "Predictive Models", "Verified Documentation"].map((t) => (
              <div key={t} className="p-5 rounded-xl border border-border bg-card text-sm font-medium text-foreground">{t}</div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Climate & Operational Systems */}
      <section id="climate-systems" className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <CloudSun className="h-10 w-10 text-accent mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Climate & Operational Systems</h2>
            <p className="text-muted-foreground leading-relaxed">
              Climate intelligence, environmental forecasting, and operational resilience infrastructure — supporting agriculture, transport, and field operations across changing conditions.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="space-y-3">
            {[
              "Real-time weather and environmental forecasting",
              "Agro production alerts and risk indicators",
              "Operational resilience and field intelligence",
              "Climate-aware planning for institutions and partners",
            ].map((t) => (
              <div key={t} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <span className="h-2 w-2 mt-2 rounded-full bg-accent flex-shrink-0" />
                <p className="text-sm text-foreground">{t}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Startup & Innovation Collaboration */}
      <section id="startup-collab" className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <Rocket className="h-10 w-10 text-accent mx-auto mb-4" />
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Startup & Innovation Collaboration</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Building With Partners Across Africa</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
            Amineva Global supports accelerators, startup partnerships, sector-focused innovation programs, and institutional collaborations — extending the ecosystem through shared infrastructure.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { title: "Accelerator Partnerships", desc: "Joint programs with accelerators and innovation hubs." },
            { title: "Sector Innovation", desc: "Targeted initiatives in agri-tech, climate-tech, and AI." },
            { title: "Institutional Collaboration", desc: "Co-development with institutions and public partners." },
          ].map((c, i) => (
            <motion.div key={c.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="p-6 rounded-xl border border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Core Values */}
      <section id="core-values" className="bg-secondary py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Lightbulb className="h-10 w-10 text-accent mx-auto mb-4" />
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Core Values</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-10">What Guides the Ecosystem</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {coreValues.map((v) => (
              <span key={v} className="px-4 py-2 rounded-full border border-accent/30 bg-card text-sm font-medium text-foreground">
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Future Infrastructure Vision */}
      <section id="future-vision" className="max-w-5xl mx-auto py-20 px-6 text-center">
        <Eye className="h-10 w-10 text-accent mx-auto mb-4" />
        <span className="text-sm font-semibold text-accent uppercase tracking-wider">Future Infrastructure Vision</span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">The Digital Backbone for Africa's Next Decade</h2>
        <p className="text-muted-foreground leading-relaxed text-lg">
          Amineva Global is building the long-term digital infrastructure layer that supports intelligent operations, climate resilience, financial systems, research, and innovation collaboration across the continent — designed to scale with new platforms, partners, and sectors.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-secondary py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Common Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`} className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Partner with the Ecosystem</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Explore the platforms, collaborate on innovation, or build with us across Africa.
          </p>
          <Link to="/support" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition">
            Get in Touch <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default About;
