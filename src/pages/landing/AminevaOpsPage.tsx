import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Smartphone, Building2, Shield, TrendingUp, Globe, CreditCard,
  ArrowRight, CheckCircle, Landmark, Users, BarChart3, Zap,
  Wallet, PiggyBank, BadgeDollarSign, FileCheck,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const AminevaOpsPage: FC = () => {
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
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `pulse 3s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 tracking-tight">
              Digital Infrastructure for{" "}
              <span className="text-accent">Financial Networks</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto leading-relaxed">
              AminevaOps powers financial networks across Africa — from mobile money vendors and microcredit agencies to credit unions, microfinance institutions, forex bureaus, and insurance companies.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is AminevaOps */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">What is AminevaOps</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
              The Operating System for Financial Services
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              AminevaOps is a comprehensive digital infrastructure designed to modernize and connect financial service providers across Africa. It provides the tools, workflows, and integrations that financial networks need to operate efficiently, comply with regulations, and serve their communities.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you run a mobile money agency, manage a credit union, operate a microfinance institution, or run a forex bureau — AminevaOps gives you the digital backbone to scale operations while maintaining trust and transparency.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="grid grid-cols-2 gap-4">
            {[
              { icon: Globe, label: "Pan-African", value: "Multi-Market" },
              { icon: Shield, label: "Compliance", value: "Built-In" },
              { icon: TrendingUp, label: "Growth", value: "Scalable" },
              { icon: Zap, label: "Real-Time", value: "Instant" },
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

      {/* Who It's For */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Who It's For</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Built for Financial Networks</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, title: "Mobile Money Vendors", desc: "Digital tools for agent management, float tracking, transaction reconciliation, and commission reporting across your mobile money network." },
              { icon: CreditCard, title: "Microcredit Agencies", desc: "Loan origination, repayment tracking, credit scoring, and portfolio management tailored for micro-lending operations." },
              { icon: Landmark, title: "Credit Unions", desc: "Member management, savings accounts, loan processing, and regulatory reporting for cooperative financial institutions." },
              { icon: PiggyBank, title: "Microfinance Institutions", desc: "End-to-end microfinance operations including group lending, savings products, disbursement workflows, and impact tracking." },
              { icon: BadgeDollarSign, title: "Forex Bureaus", desc: "Real-time exchange rate management, transaction logging, compliance reporting, and multi-currency settlement tools." },
              { icon: FileCheck, title: "Insurance Companies", desc: "Policy management, claims processing, premium collection, and actuarial reporting for micro and traditional insurance providers." },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card">
                <item.icon className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">What AminevaOps Delivers</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Wallet, title: "Transaction Processing", desc: "Handle high-volume transactions with real-time settlement, reconciliation, and reporting." },
            { icon: Users, title: "Agent & Member Management", desc: "Onboard, monitor, and manage agents, members, and stakeholders across your network." },
            { icon: Shield, title: "Regulatory Compliance", desc: "Automated KYC/AML checks, audit trails, and regulatory reports tailored to African markets." },
            { icon: BarChart3, title: "Analytics & Intelligence", desc: "Real-time dashboards, risk scoring, and predictive analytics to drive smarter decisions." },
            { icon: Building2, title: "Multi-Branch Operations", desc: "Centralized management across branches, regions, and service points with role-based access." },
            { icon: Globe, title: "Cross-Network Integration", desc: "Connect with banks, payment gateways, mobile networks, and other financial infrastructure." },
            { icon: TrendingUp, title: "Portfolio Monitoring", desc: "Track loan portfolios, savings growth, insurance premiums, and forex positions in real time." },
            { icon: Zap, title: "Automated Workflows", desc: "Rule-based automation for approvals, disbursements, notifications, and escalations." },
          ].map((feature, i) => (
            <motion.div key={feature.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card hover:border-accent/50 hover:shadow-lg transition-all">
              <feature.icon className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Process</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Connect Your Network", desc: "Integrate your branches, agents, and service points into one unified platform with role-based access." },
              { step: "02", title: "Digitize Operations", desc: "Replace manual processes with automated workflows for transactions, approvals, compliance, and reporting." },
              { step: "03", title: "Scale with Confidence", desc: "Grow your network with real-time analytics, risk management, and infrastructure that scales with demand." },
            ].map((step, i) => (
              <motion.div key={step.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-accent">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AminevaOps */}
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Advantages</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Why AminevaOps</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: "Africa-First Design", desc: "Built from the ground up for African financial markets, regulations, and infrastructure realities." },
            { title: "Interoperable by Default", desc: "Seamless integration with mobile money platforms, banking APIs, and regional payment systems." },
            { title: "Enterprise-Grade Security", desc: "End-to-end encryption, multi-factor authentication, and comprehensive audit logging." },
            { title: "Offline-Ready Operations", desc: "Core functionality works even with intermittent connectivity — syncing automatically when back online." },
          ].map((item, i) => (
            <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
              <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to Modernize Your Financial Network?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join the growing ecosystem of African financial institutions powered by AminevaOps.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default AminevaOpsPage;
