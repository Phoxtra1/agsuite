import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart3, LineChart, PieChart, Database, Users, MessageCircle,
  ArrowRight, Lightbulb, Globe, Zap, Gauge,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const AmnivaPage: FC = () => {
  const features = [
    { icon: Gauge, title: "Dashboards & KPIs", desc: "Real-time executive dashboards, KPI tracking, and operational scorecards across every business unit." },
    { icon: BarChart3, title: "Reporting & Analytics", desc: "Self-service reporting, drill-down analytics, and automated insight delivery for decision-makers." },
    { icon: LineChart, title: "Market & Performance Intelligence", desc: "Track market performance, sales trends, and business health with verified data pipelines." },
    { icon: MessageCircle, title: "Business Community", desc: "A forum where business leaders share intelligence, benchmarks, and the future of data-driven business." },
  ];

  const steps = [
    { step: "1", title: "Visit Homepage", desc: "Go to the Amineva Suite homepage where product categories are listed." },
    { step: "2", title: "Click 'Business Intelligence'", desc: "From the category dropdown, select 'Business Intelligence' to find ABI." },
    { step: "3", title: "Select ABI", desc: "Click on ABI to access the sign-in / register panel." },
    { step: "4", title: "Create Account or Login", desc: "Register with your email or sign in with existing credentials." },
    { step: "5", title: "Access Dashboard", desc: "You'll be redirected to your ABI workspace upon authentication." },
    { step: "6", title: "Explore & Build", desc: "Connect data sources, build dashboards, join the community, or submit a service request." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <BarChart3 className="h-4 w-4" /> Business Intelligence Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Measure. Analyze.<br />
              <span className="text-accent">Decide with Data.</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto mb-8">
              ABI (Amineva Business Intelligence) is the unified BI infrastructure of the ecosystem — dashboards, KPIs, reporting, and analytics that turn business data into confident decisions.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Platform Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">What ABI Offers</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-8 rounded-2xl border border-border bg-card hover:border-accent/50 transition">
              <f.icon className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual Explainer */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">From Data to Decisions</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Database, title: "Connect", desc: "Bring in data from your operations, sales, finance, and ecosystem platforms." },
              { icon: Zap, title: "Model", desc: "BI engines clean, model, and prepare data into reliable analytical views." },
              { icon: PieChart, title: "Visualize", desc: "Dashboards, KPIs, and reports surface insight where decisions are made." },
            ].map((s, i) => (
              <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="relative p-8 rounded-2xl border border-border bg-card text-center">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-5 text-accent text-2xl">→</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Step by Step */}
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Step-by-Step</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">How to Access ABI</h2>
        </div>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div key={s.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex items-start gap-5 p-5 rounded-xl border border-border bg-card">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center text-lg">
                {s.step}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Community */}
      <section className="bg-secondary py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Users className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-4">Join the ABI Community</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Connect with business leaders, share benchmarks, and discuss the future of data-driven business in our intelligence community.
          </p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to Lead with Intelligence?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Unlock dashboards, KPIs, and analytics built for modern business decisions with ABI.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default AmnivaPage;
