import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

interface FAQItem {
  q: string;
  a: string;
}

const categories: { title: string; faqs: FAQItem[] }[] = [
  {
    title: "About Amineva Global",
    faqs: [
      { q: "What is Amineva Global?", a: "Amineva Global is a technology and innovation company building intelligent digital systems and infrastructure that power operational intelligence, predictive analytics, environmental monitoring, research, and verification across critical African sectors." },
      { q: "Is Amineva Global a software company?", a: "Amineva Global is an innovation ecosystem rather than a single software vendor. We design and operate connected platforms, intelligence systems, and digital infrastructure that scale across sectors and partners." },
      { q: "What sectors does Amineva Global operate in?", a: "Agriculture, climate resilience, transport, commerce, digital trade, financial operations, research, and operational intelligence — with continued expansion into adjacent African sectors." },
      { q: "How are the platforms connected?", a: "Each platform is a division of one ecosystem. They share identity, intelligence pipelines, communication systems, and analytics — so insight, verification, and operations flow across the network." },
      { q: "Does Amineva Global support innovation and startup collaboration?", a: "Yes. We support accelerator partnerships, sector-focused innovation programs, technology experimentation, and institutional collaborations across the continent." },
      { q: "What is the company's long-term vision?", a: "To build the digital infrastructure layer for Africa's future — an interconnected innovation ecosystem powering intelligent operations, climate resilience, and scalable transformation." },
      { q: "What makes Amineva Global different?", a: "Ecosystem architecture over isolated apps, African-focused intelligence over generic tools, and infrastructure-grade design built for institutions, partners, and scale." },
    ],
  },
  {
    title: "Odeneho AI",
    faqs: [
      { q: "What is Odeneho AI?", a: "Odeneho AI is Amineva Global's intelligent companion for research, writing, planning, documentation, storytelling, knowledge systems, and data analysis — powering insight across the ecosystem." },
      { q: "What can I use Odeneho AI for?", a: "Research and analysis, content creation, planning and scheduling, business documentation, historical and cultural knowledge, storytelling, library access, and curated narration." },
    ],
  },
  {
    title: "AgroClimate",
    faqs: [
      { q: "What is AgroClimate?", a: "AgroClimate is the climate-tech and environmental intelligence infrastructure of the ecosystem — supporting agriculture, environmental monitoring, forecasting, transport resilience, and operational risk awareness." },
      { q: "Who is AgroClimate built for?", a: "Farmers, cooperatives, agribusinesses, transport operators, and institutions that need climate-aware planning and environmental intelligence." },
    ],
  },
  {
    title: "AGStock",
    faqs: [
      { q: "What is AGStock?", a: "AGStock is the AI-backed inventory, commerce, sales, and operational management infrastructure for smart business systems within the Amineva Global ecosystem." },
      { q: "Who uses AGStock?", a: "Retailers, wholesalers, restaurants, warehouses, and any operator that needs intelligent inventory and sales infrastructure." },
    ],
  },
  {
    title: "AGIS & AminevaOps",
    faqs: [
      { q: "What is AGIS?", a: "AGIS is the strategic assessment, field inspection, verification, operational intelligence, and documentation infrastructure of the ecosystem." },
      { q: "What is AminevaOps?", a: "AminevaOps is the AI-backed financial operations, monitoring, workflow intelligence, and operational oversight infrastructure for African financial networks." },
    ],
  },
  {
    title: "Amniva",
    faqs: [
      { q: "What is Amniva?", a: "Amniva is the predictive intelligence and verification infrastructure for forecasting, trend analysis, monitoring, and strategic insight systems across the ecosystem." },
    ],
  },
  {
    title: "Security & Privacy",
    faqs: [
      { q: "How does Amineva protect my data?", a: "We use 256-bit encryption, secure authentication protocols, and follow industry-standard practices. Data is stored in compliant infrastructure with regular security audits." },
      { q: "Can I delete my account?", a: "Yes. Contact support@amineva.com to request account deletion. Personal data is permanently removed within 30 days." },
      { q: "Does Amineva share my data with third parties?", a: "We do not sell or share personal data with third parties for marketing. Trusted service providers may process data strictly for platform operations, as outlined in our Privacy Policy." },
    ],
  },
];

const FAQsPage: FC = () => {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <HelpCircle className="h-12 w-12 text-accent mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Find answers to common questions about Amineva's platforms and services.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="max-w-4xl mx-auto py-20 px-6">
        <div className="space-y-12">
          {categories.map((cat, ci) => (
            <motion.div key={cat.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={ci}>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {cat.title}
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {cat.faqs.map((faq, fi) => (
                  <AccordionItem key={fi} value={`${cat.title}-${fi}`} className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="text-left text-foreground hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-secondary text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Still have questions?</h2>
        <p className="text-muted-foreground mb-6">Our support team is ready to help you.</p>
        <Link to="/support" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition">
          Contact Support <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
};

export default FAQsPage;
