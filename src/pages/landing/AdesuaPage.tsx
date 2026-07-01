import { FC } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, BookOpen, Compass, School, Award, Cpu,
  ArrowRight, Lightbulb, Library, Sparkles,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const AdesuaPage: FC = () => {
  const modules = [
    { icon: Cpu, title: "ICT Masterclass", desc: "Practical ICT skills — from basic computer knowledge through advanced secondary-school-level ICT concepts." },
    { icon: BookOpen, title: "Digital Learning Resources", desc: "Structured educational content organized for progressive learning across subjects and levels." },
    { icon: Library, title: "External Book Learning", desc: "A growing library where additional educational books and reading materials can be added for learners." },
    { icon: Compass, title: "Career Pathway", desc: "Explore career interests, understand possible education routes, discover schools, and learn about future opportunities." },
    { icon: Award, title: "Scholarship Opportunities", desc: "Discover available scholarship and support opportunities to help fund and shape your learning journey." },
    { icon: School, title: "School Discovery", desc: "Find schools and programmes aligned with your interests, goals, and chosen pathways." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <GraduationCap className="h-4 w-4" /> Learning & Career Pathway Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Learn. Discover.<br />
              <span className="text-accent">Shape Your Future.</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Adesua is a digital learning and career pathway platform designed to help learners discover opportunities, build knowledge, and prepare for their future.
            </p>
            <a
              href="https://www.as.amineva.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
            >
              Enter Adesua <ArrowRight className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="max-w-5xl mx-auto py-20 px-6 text-center">
        <Lightbulb className="h-10 w-10 text-accent mx-auto mb-4" />
        <span className="text-sm font-semibold text-accent uppercase tracking-wider">Overview</span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">A Platform Built Around Learners</h2>
        <p className="text-muted-foreground leading-relaxed text-lg">
          Adesua combines learning resources, career guidance, school discovery, and scholarship opportunities into one platform — supporting learners in understanding possible educational and career directions.
        </p>
      </section>

      {/* Modules */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Inside Adesua</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">What Learners Can Explore</h2>
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

      {/* Learner Experience */}
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="text-center mb-10">
          <Sparkles className="h-10 w-10 text-accent mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Simple Access for Every Learner</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Learners register with their name and receive a personal platform ID for sign-in and account access, with secure PIN recovery for continued access.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Begin Your Learning Journey</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Discover ICT masterclasses, career pathways, schools, and scholarships — all in one place.
          </p>
          <a
            href="https://www.as.amineva.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
          >
            Enter Adesua <ArrowRight className="h-5 w-5" />
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default AdesuaPage;
