import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Target, Eye, Lightbulb, Users, Globe, ShieldCheck, BarChart3, Cpu,
  ArrowRight, CheckCircle,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const About: FC = () => {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent"
              style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animation: `pulse 3s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 tracking-tight">
              Digital Infrastructure for{" "}
              <span className="text-accent">Confident Decisions</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto leading-relaxed">
              Amineva is a tech-driven information provider that creates and manages digital systems enabling businesses and individuals to manage operations, receive insight, predict outcomes, verify decisions, and deliver services efficiently.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Who We Are</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
              The Backbone of Modern Operations
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Through its platforms, Amineva supports enterprises, institutions, professionals, and service providers with scalable tools designed to improve decision-making, operational efficiency, and service delivery across sectors.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We operate at the intersection of technology and intelligence — building systems that don't just automate tasks, but empower organizations to act with clarity and confidence.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="grid grid-cols-2 gap-4">
            {[
              { icon: Globe, label: "Global Reach", value: "Multi-region" },
              { icon: ShieldCheck, label: "Security", value: "256-bit" },
              { icon: BarChart3, label: "Uptime", value: "99.9%" },
              { icon: Cpu, label: "AI-Powered", value: "Intelligent" },
            ].map((stat) => (
              <div key={stat.label} className="p-6 rounded-xl border border-border bg-card text-center">
                <stat.icon className="h-8 w-8 text-accent mx-auto mb-3" />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="p-8 rounded-2xl bg-card border border-border">
            <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
              <Target className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To design and operate intelligent digital systems that empower organizations and professionals to manage operations, harness intelligence, verify decisions, predict outcomes, and deliver services with trust and precision.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="p-8 rounded-2xl bg-card border border-border">
            <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
              <Eye className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To become the leading digital infrastructure provider for decision-makers worldwide — where every critical business action is supported by verified intelligence, transparent data, and scalable technology.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What We Build */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">What We Build</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Our Ecosystem</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { title: "AGStock", desc: "Inventory & sales management for retailers, wholesalers, and restaurants.", link: "/explainer/agstock" },
            { title: "AGIS", desc: "Data collection, field inspections, surveys, and strategic assessments.", link: "/explainer/agis" },
            { title: "Amniva", desc: "Market forecasting, trend analysis, verification, and social community.", link: "/explainer/amniva" },
            { title: "AgroClimate", desc: "Real-time weather, agro alerts, drone advisory, and AI farming tools.", link: "/explainer/agroclimate" },
            { title: "AminevaOps", desc: "Digital infrastructure for financial networks — mobile money, microcredit, credit unions, microfinance, forex, and insurance.", link: "/explainer/aminevaops" },
          ].map((product, i) => (
            <motion.div key={product.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <Link to={product.link} className="block p-6 rounded-xl border border-border bg-card hover:border-accent/50 hover:shadow-lg transition-all h-full group">
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-accent transition">{product.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{product.desc}</p>
                <span className="text-accent text-sm font-medium flex items-center gap-1">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who We Serve */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Who We Serve</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Built for Every Scale</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Enterprises", desc: "Large-scale organizations seeking operational efficiency and insight." },
              { title: "Institutions", desc: "Public and private institutions requiring robust data and decision support." },
              { title: "Professionals", desc: "Individual experts leveraging intelligent systems to enhance services." },
              { title: "Service Providers", desc: "Organizations delivering value through scalable digital platforms." },
            ].map((aud, i) => (
              <motion.div key={aud.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card text-center">
                <Users className="h-8 w-8 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{aud.title}</h3>
                <p className="text-sm text-muted-foreground">{aud.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Our Standards</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Principles & Standards</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { title: "Security by Design", desc: "Every system is built with security embedded at its core." },
            { title: "Reliability & Uptime", desc: "Commitment to continuous, uninterrupted service." },
            { title: "Scalable Architecture", desc: "Platforms grow seamlessly with your needs." },
            { title: "Responsible Intelligence", desc: "Systems act with transparency and ethical consideration." },
          ].map((principle, i) => (
            <motion.div key={principle.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
              <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">{principle.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{principle.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Explore our products and discover how Amineva can transform your operations.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition">
            Explore Products <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default About;
