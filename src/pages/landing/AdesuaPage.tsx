import { FC } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, BookOpen, Compass, School, Award, Cpu,
  ArrowRight, Lightbulb, Library, Sparkles, Target, Briefcase,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const AdesuaPage: FC = () => {
  const modules = [
    { icon: Compass, title: "Career Pathway Engine", desc: "Explore market-aligned career pathways, skill maps, and actionable roadmaps for professional growth." },
    { icon: Cpu, title: "Professional ICT Masterclasses", desc: "High-impact technical training — from foundational computer science to industry-ready software & cloud engineering." },
    { icon: Library, title: "Career Development Literature", desc: "Curated professional books, research papers, and technical publications to deepen domain expertise." },
    { icon: School, title: "Institutional Intelligence", desc: "Discover top-tier universities, technical institutes, and specialized academies aligned with your career goals." },
    { icon: Award, title: "Global Scholarship Portal", desc: "Discover vetted funding, grants, and scholarship opportunities to support your advanced education and certifications." },
    { icon: Target, title: "Milestones & Pathways", desc: "Track skill acquisition, benchmark professional capabilities, and map your trajectory toward career success." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <Briefcase className="h-4 w-4" /> Career Development Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Advance Your Career.<br />
              <span className="text-accent">Unlock Professional Opportunities.</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto mb-8">
              Adesua is an enterprise career development platform designed to empower professionals and students with structured career pathways, skill advancement, institutional insights, and global scholarship intelligence.
            </p>
            <a
              href="https://as.amineva.com"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
            >
              Explore Career Pathways <ArrowRight className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="max-w-5xl mx-auto py-20 px-6 text-center">
        <Lightbulb className="h-10 w-10 text-accent mx-auto mb-4" />
        <span className="text-sm font-semibold text-accent uppercase tracking-wider">Overview</span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">Empowering Professional Mobility & Growth</h2>
        <p className="text-muted-foreground leading-relaxed text-lg">
          Adesua brings career mapping, technical masterclasses, institutional discovery, scholarship opportunities, and curated professional literature together — enabling professionals and ambitious learners to accelerate their career trajectories.
        </p>
      </section>

      {/* Modules */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Inside Adesua</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Core Career Development Modules</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m, i) => (
              <motion.div key={m.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card hover:border-accent/50 transition">
                <m.icon className="h-8 w-8 text-accent mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Experience */}
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="text-center mb-10">
          <Sparkles className="h-10 w-10 text-accent mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Seamless Onboarding for Career Growth</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Professionals register securely to receive a unique Career Profile ID, unlocking personalized learning progress, book bookmarks, pathway achievements, and scholarship tracking.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Accelerate Your Career Trajectory Today</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Explore market-relevant career pathways, advanced technical masterclasses, institution discovery, and global scholarship funding.
          </p>
          <a
            href="https://as.amineva.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
          >
            Launch Adesua Platform <ArrowRight className="h-5 w-5" />
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default AdesuaPage;

