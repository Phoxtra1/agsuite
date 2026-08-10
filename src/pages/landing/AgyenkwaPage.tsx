import { FC } from "react";
import { motion } from "framer-motion";
import {
  Cloud, Leaf, Bug, Cpu, BookOpen, Package,
  ArrowRight, Sun, Droplets, Wind, Thermometer, Sprout,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const AgyenkwaPage: FC = () => {
  const features = [
    { icon: Cloud, title: "Real-Time Weather Forecast", desc: "Hyper-local weather data updated every hour with 7-day forecasts for your exact farm location." },
    { icon: Leaf, title: "Agro Production Alerts", desc: "Smart alerts for livestock, crops, and aquaculture based on your location and current conditions." },
    { icon: Bug, title: "Environmental Predictions", desc: "Pest forecasts, soil moisture analysis, and environmental risk warnings for proactive farming." },
    { icon: Cpu, title: "Drone Advisory", desc: "Guidance for large-scale farmers on drone deployment for crop monitoring, spraying, and mapping." },
    { icon: BookOpen, title: "Agro Learning", desc: "Educational resources, farming best practices, and community-driven knowledge sharing." },
    { icon: Package, title: "Stock Management", desc: "Track farm inputs — seeds, fertilizers, feed — with inventory management built for agriculture." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        {/* Weather visual elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[Sun, Cloud, Droplets, Wind, Thermometer, Sprout].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ top: `${15 + i * 12}%`, left: `${5 + i * 15}%` }}
              animate={{ y: [0, -10, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
            >
              <Icon className="h-12 w-12 text-accent" />
            </motion.div>
          ))}
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <Leaf className="h-4 w-4" /> Smart Farming Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Farm Smarter with<br />
              <span className="text-accent">Climate Intelligence</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto mb-8">
              Agyenkwa provides real-time weather forecasts, agro production alerts, environmental predictions, drone advisory, AI-powered farming assistance, and learning resources — built for community farming production.
            </p>
            <a
              href="https://agro.amineva.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Climate Meets Agriculture</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Set Your Location", desc: "Enter your farm coordinates or select your region for hyper-local weather data.", icon: Cloud },
            { step: "02", title: "Receive Smart Alerts", desc: "Get real-time notifications about weather changes, pest risks, and optimal farming windows.", icon: Leaf },
            { step: "03", title: "Act with AI Guidance", desc: "Use AI assistant for personalized recommendations on planting, harvesting, and resource management.", icon: Cpu },
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

      {/* Features */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Everything for Modern Farming</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card hover:border-accent/50 transition">
                <f.icon className="h-8 w-8 text-accent mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant */}
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">AI-Powered</span>
            <h2 className="text-3xl font-bold text-foreground mt-2 mb-4">Your Farming AI Assistant</h2>
            <p className="text-muted-foreground mb-6">
              Ask questions about crop diseases, optimal planting times, soil management, and livestock care. Our AI assistant provides in-depth guidance tailored to your location and farming conditions.
            </p>
            <ul className="space-y-3">
              {["Crop disease identification", "Optimal planting calendars", "Soil health recommendations", "Livestock care guidance", "Market price insights"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground">
                  <Sprout className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="p-8 rounded-2xl border border-border bg-card">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Cpu className="h-4 w-4 text-accent" />
                </div>
                <div className="p-3 rounded-lg bg-secondary text-sm text-foreground">
                  Based on your location in Ashanti Region, the optimal window for maize planting begins in March. Current soil moisture levels are ideal.
                </div>
              </div>
              <div className="flex items-start gap-3 justify-end">
                <div className="p-3 rounded-lg bg-accent/10 text-sm text-foreground">
                  What fertilizer should I use for the first application?
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Cpu className="h-4 w-4 text-accent" />
                </div>
                <div className="p-3 rounded-lg bg-secondary text-sm text-foreground">
                  For maize in your region, I recommend NPK 15-15-15 at 2 bags/acre during planting, followed by Urea top-dressing at 4 weeks.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Start Farming Smarter Today</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join thousands of farmers using Agyenkwa for weather intelligence and AI-powered farming guidance.
          </p>
          <a
            href="https://agro.amineva.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
          >
            Get Started Free <ArrowRight className="h-5 w-5" />
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default AgyenkwaPage;
