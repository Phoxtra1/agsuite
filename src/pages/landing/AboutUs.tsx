import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Compass, Search, Network, ShieldCheck, Database, Globe2,
  ArrowRight, FileCheck2, Scale, RefreshCw, Eye,
} from "lucide-react";

const principles = [
  { icon: Search, title: "Start with the question", description: "Understand what a person or organisation is trying to establish before collecting information." },
  { icon: Network, title: "Connect related evidence", description: "Bring relevant records, sources and context together without confusing separate systems or jurisdictions." },
  { icon: ShieldCheck, title: "Keep provenance visible", description: "Show where information came from, who published it, when it was updated and what it can reliably support." },
  { icon: Scale, title: "Distinguish fact from interpretation", description: "Separate official records, research, reported experience, estimates, forecasts and generated explanations." },
  { icon: RefreshCw, title: "Review changing information", description: "Treat time-sensitive information as something that needs dated checks and renewed confirmation—not a permanent fact." },
  { icon: Eye, title: "Make uncertainty visible", description: "Identify missing evidence, disagreement, limitations and matters that still require confirmation." },
];

const AboutUs: FC = () => (
  <main className="w-full">
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/85 px-6 py-24 text-primary-foreground lg:py-32">
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground"><Compass className="h-4 w-4" /> About Amineva Global</span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">Information Discovery System</h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-primary-foreground/85 md:text-xl">Amineva Global is focused on making useful information easier to discover, understand, compare and apply. We organise information around real questions and decisions, while keeping its source, context and limitations visible.</p>
          <Link to="/info-discovery" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90">Explore Info Discovery <ArrowRight className="h-4 w-4" /></Link>
        </motion.div>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-12 lg:items-start">
      <div className="lg:col-span-5">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Our purpose</span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Information should help people understand what matters.</h2>
      </div>
      <div className="space-y-5 text-sm leading-7 text-muted-foreground md:text-base lg:col-span-7">
        <p>Information is often scattered across government publications, research, datasets, professional references, institutions and individual systems. It can be difficult to know which source is authoritative, whether information is current, or whether two records are describing the same thing.</p>
        <p>Our work is to organise discovery around the question being asked. Instead of treating every subject as a list of unrelated articles, the system connects topics to useful context, evidence, reference sources and practical next steps.</p>
        <p>Some subjects lead to practical tools or services. Where an Amineva product genuinely supports the next step, it is introduced in context. Where no suitable product exists, the discovery path remains useful on its own and can direct people to appropriate original publishers, public authorities or external platforms.</p>
      </div>
    </section>

    <section className="border-y border-border bg-secondary/40 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">How we approach information</span>
          <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">Discovery with context and evidence</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">A useful result needs more than a plausible answer. It needs traceable sources, appropriate context and a clear account of what remains uncertain.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {principles.map((item, index) => (
            <motion.article key={item.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2">
      <article className="rounded-2xl border border-border bg-card p-7">
        <Database className="h-7 w-7 text-accent" />
        <h2 className="mt-4 text-xl font-bold text-foreground">Independent systems, connected where appropriate</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">Different products and organisations may maintain their own databases, permissions and records. Information can be connected through controlled interfaces when there is a legitimate purpose and permission to do so. A unified discovery experience does not require every source system to be merged into one database.</p>
      </article>
      <article className="rounded-2xl border border-border bg-card p-7">
        <FileCheck2 className="h-7 w-7 text-accent" />
        <h2 className="mt-4 text-xl font-bold text-foreground">Evidence before certainty</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">Automated tools can help organise material, surface relationships and explain complex subjects. They do not replace the original source, independent review or the authority responsible for a rule, decision or record. Where evidence is missing or stale, that limitation should remain visible.</p>
      </article>
    </section>

    <section className="bg-gradient-to-r from-primary to-primary/90 px-6 py-20 text-center">
      <Globe2 className="mx-auto h-8 w-8 text-accent" />
      <h2 className="mt-4 text-3xl font-bold text-primary-foreground md:text-4xl">Explore information with greater clarity.</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/80">Start with a question, explore the subject structure and follow the evidence to the sources that matter.</p>
      <Link to="/info-discovery" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Open Info Discovery <ArrowRight className="h-4 w-4" /></Link>
    </section>
  </main>
);

export default AboutUs;
