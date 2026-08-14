import { FC } from "react";
import { motion } from "framer-motion";
import {
  Package, ShoppingCart, BarChart3, Users, Warehouse, Store,
  ArrowRight, CheckCircle, Smartphone, Globe, Shield, Zap,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const InventraPage: FC = () => {
  const features = [
    { icon: Package, title: "Inventory Tracking", desc: "Real-time stock levels, low-stock alerts, and automated reorder points for every product." },
    { icon: ShoppingCart, title: "Point of Sale", desc: "Fast, intuitive POS system with barcode scanning, receipts, and multi-payment support." },
    { icon: BarChart3, title: "Sales Analytics", desc: "Daily sales summaries, revenue tracking, product performance insights, and trend analysis." },
    { icon: Users, title: "Employee Management", desc: "Staff accounts with PIN authentication, role-based access, and activity logs." },
    { icon: Warehouse, title: "Multi-Location", desc: "Manage inventory across warehouses, retail stores, and distribution centres from one dashboard." },
    { icon: Store, title: "Business Types", desc: "Tailored for retail shops, wholesalers, restaurants, bars, and any inventory-driven entity." },
  ];

  const audiences = [
    { icon: Store, title: "Retail Shops", desc: "Manage daily sales, track bestsellers, and automate restocking for your storefront." },
    { icon: Warehouse, title: "Wholesalers", desc: "Bulk inventory management with supplier tracking and distribution workflows." },
    { icon: Package, title: "Warehouses", desc: "Full warehouse operations with location tracking, batch management, and dispatch logging." },
    { icon: Users, title: "Restaurants & Bars", desc: "Menu-linked inventory, ingredient tracking, and waste management for food service businesses." },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
              <Package className="h-4 w-4" /> Inventory & Sales Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Manage Your Stock.<br />
              <span className="text-accent">Grow Your Business.</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Inventra is an inventory and sales management platform built for retailer shops, wholesalers, warehouses, restaurants, bars, and any inventory-driven entity.
            </p>
            <a
              href="https://stock.amineva.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition text-lg"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Visual Explainer */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Simple. Powerful. Complete.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Add Products", desc: "Import or manually add your inventory. Set prices, categories, and stock quantities.", icon: Package },
            { step: "02", title: "Sell & Track", desc: "Process sales through POS. Every transaction updates stock automatically.", icon: ShoppingCart },
            { step: "03", title: "Analyze & Grow", desc: "View daily reports, identify trends, and make data-driven restocking decisions.", icon: BarChart3 },
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
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Everything You Need</h2>
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

      {/* Who It's For */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Built For</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">Who Uses inventra?</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((a, i) => (
            <motion.div key={a.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border bg-card text-center">
              <a.icon className="h-10 w-10 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why inventra */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Why Choose inventra?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Smartphone, title: "Works Everywhere", desc: "Access your inventory from any device — desktop, tablet, or mobile." },
              { icon: Globe, title: "Multi-Currency", desc: "Supports GHS, NGN, KES, ZAR, CFA, EUR, GBP, USD and more." },
              { icon: Shield, title: "Secure by Default", desc: "PIN-based employee access, role permissions, and encrypted data." },
              { icon: Zap, title: "Real-Time Sync", desc: "Instant updates across all locations and devices." },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
                <item.icon className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Start Managing Your Inventory Today</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join businesses across Africa and beyond who trust inventra to run their operations.
          </p>
          <a
            href="https://stock.amineva.com"
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

export default InventraPage;
