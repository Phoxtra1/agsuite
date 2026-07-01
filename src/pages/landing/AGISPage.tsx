import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search, FileText, MapPin, Shield, BarChart3, Camera,
  ArrowRight, CheckCircle, ClipboardList, Users, Eye,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const NkɔsoɔPage: FC = () => {
  const services = [
    { icon: Search, title: "Data & Insights", desc: "Data collection, surveys, market research, and consumer intelligence for informed decision-making." },
    { icon: MapPin, title: "Field Project Inspection", desc: "On-ground field visits, ongoing project confirmation supported by visuals and images. We serve as independent monitors in the absence of project owners." },
    { icon: Shield, title: "Strategic Assessment", desc: "Feasibility studies, due diligence, and risk mapping for investors, businesses, and property buyers." },
    { icon: FileText, title: "Documentation", desc: "Professional preparation of company profiles, proposals, pitch decks, business plans, and more." },
  ];

  const steps = [
    { step: "1", title: "Visit Homepage", desc: "Go to the Amineva Suite homepage and look for the product categories listed." },
    { step: "2", title: "Click 'Data Intelligence'", desc: "From the category dropdown, click on 'Data Intelligence' to see Nkɔsoɔ listed." },
    { step: "3", title: "Select Nkɔsoɔ", desc: "Click on Nkɔsoɔ to open the sign-in / register panel." },
    { step: "4", title: "Create Account or Login", desc: "Register with your email or sign in to your existing account." },
    { step: "5", title: "Access Client Dashboard", desc: "Once authenticated, you'll be redirected to your client dashboard." },
    { step: "6", title: "Send Service Request", desc: "From the dashboard, submit your service request — data collection, field inspection, assessment, or documentation." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <Eye className="h-4 w-4" /> Amineva Global Intelligence Service
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Intelligence You Can<br />
              <span className="text-accent">Trust & Act On</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto mb-8">
              Nkɔsoɔ renders data & insights, field project inspections, strategic assessments, and professional documentation — empowering investors, businesses, and decision-makers with verified intelligence.
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

      {/* Services */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Our Services</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">What Nkɔsoɔ Offers</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((s, i) => (
            <motion.div key={s.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-8 rounded-2xl border border-border bg-card hover:border-accent/50 transition">
              <s.icon className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual Explainer - How It Works */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Step-by-Step</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">How to Access Nkɔsoɔ</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Follow these steps to create your account and start sending service requests.</p>
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
        </div>
      </section>

      {/* Who Benefits */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Who Benefits from Nkɔsoɔ?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: "Investors", desc: "Get due diligence reports, risk mapping, and feasibility studies before committing capital." },
            { icon: ClipboardList, title: "Businesses", desc: "Market research, consumer surveys, and competitive analysis to guide strategy." },
            { icon: Camera, title: "Project Owners", desc: "Independent monitoring and visual confirmation for projects you can't personally oversee." },
          ].map((b, i) => (
            <motion.div key={b.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card text-center">
              <b.icon className="h-10 w-10 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Need Verified Intelligence?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Submit a service request and let our field teams deliver trusted insights for your next decision.
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

export default NkɔsoɔPage;
