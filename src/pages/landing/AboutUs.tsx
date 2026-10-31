import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Globe, Cpu, CloudSun, Rocket,
  Network, ArrowRight, Sparkles, BarChart3, ShieldCheck,
  Leaf, Building2, Brain, LineChart, Compass,
  Server, Wrench, Database, Cog, Code2, Users, CheckCircle2,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const pastInfrastructureBuilds = [
  { icon: Server, name: "Database cloud (Selfhost)", desc: "Resilient self-hosted database infrastructure engineered for high performance, localized data sovereignty, and reliable failover." },
  { icon: Code2, name: "Web Apps", desc: "Mission-critical, responsive web applications built with modern frontend architectures and real-time data sync." },
  { icon: Brain, name: "AI Model", desc: "Specialized machine learning and natural language processing pipelines embedded directly into operational workflows." },
  { icon: Wrench, name: "IT Support", desc: "Comprehensive technical support, systems maintenance, hardware-software diagnosis, and rapid incident response." },
  { icon: Globe, name: "Websites", desc: "High-performance institutional and commercial web portals optimized for speed, security, and global accessibility." },
  { icon: Cog, name: "System Configuration", desc: "Enterprise server orchestration, secure network design, domain DNS architecture, and deployment automation." },
];

const itServicesList = [
  {
    icon: Globe,
    title: "Website & Application Maintenance",
    desc: "Routine updates, performance optimization, proactive monitoring, uptime assurance, and issue resolution for web assets.",
  },
  {
    icon: Code2,
    title: "Software & App Development",
    desc: "End-to-end custom software design, mobile applications, web platforms, and tailored business software systems.",
  },
  {
    icon: Server,
    title: "Cloud Infrastructure & Deployment",
    desc: "Scalable cloud architecture, automated CI/CD deployments, self-hosted container environments, and security hardening.",
  },
  {
    icon: Wrench,
    title: "IT Support & Technical Troubleshooting",
    desc: "Dedicated technical diagnosis, user workstation support, business email configuration, and network infrastructure maintenance.",
  },
  {
    icon: Database,
    title: "Database & Data Management",
    desc: "Database modeling, high-availability replication, secure data backups, query optimization, and structured pipeline administration.",
  },
  {
    icon: Cog,
    title: "Business Process Automation & System Integration",
    desc: "Seamless API integrations, workflow automation, legacy system bridging, and unified cross-platform communications.",
  },
];

const sectorFocus = [
  { icon: Leaf, title: "Agriculture", desc: "Smart farming, agro alerts, and climate-aware production systems." },
  { icon: CloudSun, title: "Climate Resilience", desc: "Environmental monitoring and predictive risk intelligence." },
  { icon: Network, title: "Transport", desc: "Operational visibility, fleet telematics, and route resilience." },
  { icon: Building2, title: "Commerce & Trade", desc: "Inventory, sales pipelines, and digital trade infrastructure." },
  { icon: BarChart3, title: "Operational Intelligence", desc: "Verification, compliance oversight, and predictive insight." },
  { icon: Brain, title: "AI & Knowledge", desc: "Research synthesis, documentation, and intelligent assistance." },
];

const platformEcosystem = [
  { icon: Sparkles, title: "Dipa AI", role: "Intelligent companion for research, writing, planning, knowledge systems, and storytelling." },
  { icon: CloudSun, title: "AgroClimate", role: "Climate-tech and environmental intelligence infrastructure for agriculture, forecasting, and operational risk." },
  { icon: BarChart3, title: "Inventra", role: "AI-backed inventory, commerce, and operational management infrastructure for modern business systems." },
  { icon: ShieldCheck, title: "DataLens", role: "Enterprise IT and data services provider offering Website & Application Maintenance, Software & App Development, Cloud Infrastructure & Deployment, IT Support & Technical Troubleshooting, Database & Data Management, and Business Process Automation & System Integration." },
  { icon: LineChart, title: "Sikasɛm", role: "AI-backed financial operations, monitoring, and oversight infrastructure." },
  { icon: Globe, title: "ABI", role: "Amineva Business Intelligence: unified BI infrastructure for dashboards, KPIs, market analytics, and data-driven decision support." },
  { icon: Compass, title: "Adesua", role: "Career development platform: career pathways, professional skill advancement, institutional discovery, and educational opportunities." },
];

const coreValues = [
  "Innovation", "Intelligence", "Scalability", "Global Excellence",
  "Operational Efficiency", "Climate Resilience", "Research & Knowledge",
  "Transparency", "Predictive Thinking", "Human Development",
];

const faqs = [
  { q: "What is Amineva Global?", a: "Amineva Global is an integrated technology and innovation company operating across two foundational pillars: Tech Innovation and Human Development. We engineer high-performance digital systems, provide enterprise IT services, and lead impactful community and educational initiatives worldwide." },
  { q: "What is the relationship between Amineva Global and Amineva Impact?", a: "Amineva Impact represents Amineva Global's dedicated human development arm. It organizes structured educational, career exploration, and youth development programs while maintaining our institution's high standards of operational excellence." },
  { q: "What IT services does Amineva Global provide?", a: "We provide comprehensive IT services including Website & Application Maintenance, Software & App Development, Cloud Infrastructure & Deployment, IT Support & Technical Troubleshooting, Database & Data Management, and Business Process Automation & System Integration." },
  { q: "What sectors does Amineva Global operate in?", a: "We operate across agriculture, climate resilience, transport, commerce, digital trade, financial operations, education, and operational intelligence with continuous global expansion." },
  { q: "How are the platforms connected?", a: "Each platform is a division of one unified ecosystem. They share identity, intelligence pipelines, and reliable communication layers so data and operational insights flow seamlessly." },
  { q: "What is the long-term vision?", a: "To establish a world-class digital backbone combining cutting-edge technology infrastructure with dedicated human capital development, powering sustainable transformation for institutions and communities." },
  { q: "What makes Amineva Global different?", a: "Ecosystem architecture over isolated applications, specialized domain intelligence over generic tools, and infrastructure-grade design engineered for global institutions, partners, and scale." },
];

const About: FC = () => {
  return (
    <div className="w-full">
      {/* 1. Hero & Amineva Global Entity Description: Tech Innovation & Human Development */}
      <section id="vision" className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent"
              style={{
                top: `${((i * 17) % 100)}%`,
                left: `${((i * 23) % 100)}%`,
                animation: `pulse 3s ease-in-out ${((i % 5) * 0.4)}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              About Amineva Global
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
              A Global Institution Driving <br className="hidden sm:inline" />
              <span className="text-accent">Tech Innovation & Human Development</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed mb-12">
              Amineva Global is an enterprise technology entity defined by two interconnected pillars: pioneering digital systems and cloud infrastructure on one hand, and structured human and community advancement on the other.
            </p>
          </motion.div>

          {/* Two Pillars Grid with Animations */}
          <div className="grid md:grid-cols-2 gap-8 text-left mt-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="p-8 rounded-3xl bg-card/10 backdrop-blur border border-white/10 hover:border-accent/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-accent uppercase tracking-widest block mb-2">Pillar One</span>
              <h3 className="text-2xl font-bold text-white mb-3">Tech Innovation</h3>
              <p className="text-sm md:text-base text-primary-foreground/80 leading-relaxed">
                Engineering intelligent digital infrastructure, self-hosted cloud backends, AI models, and enterprise software solutions. We build connected platforms and provide specialized IT services that empower businesses and institutions with reliable, high-uptime digital systems.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="p-8 rounded-3xl bg-card/10 backdrop-blur border border-white/10 hover:border-accent/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-6">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-accent uppercase tracking-widest block mb-2">Pillar Two</span>
              <h3 className="text-2xl font-bold text-white mb-3">Human Development</h3>
              <p className="text-sm md:text-base text-primary-foreground/80 leading-relaxed">
                Investing directly in people, learners, and community potential. Through Amineva Impact, we foster early-stage career awareness, practical skills discovery, educational support, and institutional capacity building that guide young minds toward thriving, sustainable futures.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Amineva Impact Details (Follows Immediately After Entity Description) */}
      <section id="amineva-impact" className="py-20 px-6 bg-secondary/50 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="lg:col-span-7 space-y-5"
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">
                Human Development Pillar
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                Amineva Impact
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Amineva Impact represents Amineva Global’s direct commitment to educational advancement and community capacity building. Our initiatives bring structured career guidance, mentorship, and practical skills directly into schools, helping learners discover their natural abilities and build solid foundations for the future.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="text-2xl font-bold text-accent mb-1">3 Schools</div>
                  <div className="text-xs text-muted-foreground">Engaged in intensive career discovery programs</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="text-2xl font-bold text-accent mb-1">Over 600</div>
                  <div className="text-xs text-muted-foreground">Students empowered with career direction</div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/impact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition shadow-sm"
                >
                  Explore Amineva Impact Engagements <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="lg:col-span-5 p-8 rounded-3xl border border-border bg-card shadow-sm space-y-5"
            >
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" /> Key Focus & Outcomes
              </h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span><strong>Early Career Foundation:</strong> Helping basic school learners recognize the value and diversity of future professions.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span><strong>Discovery of Practical Abilities:</strong> Unlocking hands-on talents, technical curiosity, and problem-solving skills.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span><strong>Pathways for Better Futures:</strong> Guiding students with actionable clarity, personal research tools, and mentorship.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. IT Services */}
      <section id="it-services" className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">Enterprise Solutions</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-2">IT Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-sm md:text-base">
            Professional engineering and technical services delivered with precision, reliability, and enterprise-grade support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itServicesList.map((service, idx) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={idx}
                className="p-7 rounded-2xl border border-border bg-card hover:border-accent/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. What We Build — Intelligent Digital Infrastructure (Listing What We Have Built Before) */}
      <section id="what-we-build" className="bg-secondary/40 py-20 px-6 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">Our Proven Track Record</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-2">Intelligent Digital Infrastructure</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-sm md:text-base">
              A record of battle-tested digital infrastructure and production software systems built and operated by our team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastInfrastructureBuilds.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={idx}
                  className="p-7 rounded-2xl border border-border bg-card shadow-sm hover:border-accent/40 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Sector Focus */}
      <section id="sector-focus" className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">Sector Focus</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Where We Operate</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mt-3 text-sm">
            Cross-industry technology deployment driving operational clarity across primary global markets.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {sectorFocus.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="p-6 rounded-2xl border border-border bg-card hover:border-accent/50 transition"
            >
              <s.icon className="h-7 w-7 text-accent mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. Platform Ecosystem */}
      <section id="platform-ecosystem" className="bg-secondary/40 py-20 px-6 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">Platform Ecosystem</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Connected Infrastructure Divisions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-sm">
              Each platform operates as a specialized division of the Amineva Global ecosystem, sharing identity, intelligence, and cloud infrastructure.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformEcosystem.map((p, i) => (
              <motion.div
                key={p.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-accent/40 transition"
              >
                <p.icon className="h-7 w-7 text-accent mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Startup & Partner Collaboration */}
      <section id="startup-collab" className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <Rocket className="h-10 w-10 text-accent mx-auto mb-4" />
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">Partnership & Collaboration</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Building With Global Partners</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-sm">
            Amineva Global collaborates with institutions, accelerators, development organizations, and technical partners worldwide to build resilient technology systems.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { title: "Accelerator Partnerships", desc: "Collaborative ventures with tech hubs, incubation labs, and growth accelerators." },
            { title: "Sector Innovation", desc: "Targeted co-development initiatives across cloud infrastructure, artificial intelligence, and climate resilience." },
            { title: "Institutional Collaboration", desc: "Technical co-development and system integration with enterprise and public institutions." },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="p-6 rounded-2xl border border-border bg-card"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 8. Core Values */}
      <section id="core-values" className="bg-secondary/40 py-20 px-6 border-y border-border">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">Principles</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-10">What Guides Amineva Global</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {coreValues.map((v) => (
              <span key={v} className="px-5 py-2.5 rounded-full border border-accent/30 bg-card text-sm font-medium text-foreground shadow-sm">
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="max-w-4xl mx-auto py-20 px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 bg-card">
              <AccordionTrigger className="text-left text-foreground font-semibold hover:no-underline py-4">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 10. CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary via-primary/95 to-primary text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Partner with Amineva Global</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Connect with our engineering teams to explore cloud systems, custom software development, or joint human development initiatives.
          </p>
          <Link
            to="/support"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition shadow-lg"
          >
            Get in Touch <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default About;
