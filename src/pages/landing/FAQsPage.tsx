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
    title: "General",
    faqs: [
      { q: "What is Amineva Global?", a: "Amineva Global is a tech-driven information provider that creates and manages digital systems enabling businesses and individuals to manage operations, receive insight, predict outcomes, verify decisions, and deliver services efficiently." },
      { q: "Who can use Amineva's platforms?", a: "Our platforms serve enterprises, institutions, professionals, and service providers across various sectors. Each product is designed for specific use cases — from retail inventory management to market forecasting." },
      { q: "Is Amineva available in my country?", a: "Amineva currently operates across Africa, Europe, and expanding globally. AGStock supports multiple currencies including GHS, NGN, KES, ZAR, CFA, EUR, GBP, and USD." },
      { q: "How do I create an account?", a: "Visit the Amineva Suite homepage, select the product category you're interested in, choose the product, and follow the sign-up process. You can register with your email address." },
    ],
  },
  {
    title: "AGStock",
    faqs: [
      { q: "What is AGStock?", a: "AGStock is an inventory and sales management platform designed for retail shops, wholesalers, warehouses, restaurants, bars, and any entity requiring inventory management." },
      { q: "Can I use AGStock for multiple locations?", a: "Yes. AGStock supports multi-location inventory management, allowing you to track stock across warehouses, stores, and distribution centres from a single dashboard." },
      { q: "Does AGStock work offline?", a: "AGStock is a web-based platform that requires an internet connection. However, we're working on offline capabilities for areas with limited connectivity." },
      { q: "How does employee management work?", a: "You can create staff accounts with PIN-based authentication, assign role-based permissions, and track employee activity logs for accountability." },
    ],
  },
  {
    title: "AGIS",
    faqs: [
      { q: "What services does AGIS provide?", a: "AGIS offers four core services: Data & Insights (surveys, market research), Field Project Inspection (on-ground verification), Strategic Assessment (feasibility studies, due diligence), and Documentation (company profiles, proposals, pitch decks)." },
      { q: "How do I request a service?", a: "Log in to your AGIS client dashboard, click 'New Service Request', select the service type, provide the details, and submit. Our team will review and respond within 48 hours." },
      { q: "Can AGIS provide field inspections internationally?", a: "Currently, AGIS operates primarily in Africa with expanding coverage. Contact our support team for availability in your specific region." },
    ],
  },
  {
    title: "Amniva",
    faqs: [
      { q: "What is Amniva?", a: "Amniva is a platform for market forecasting, trending, verification, predictions, and insights. It also features a social community where business leaders discuss the future of business tech and markets." },
      { q: "How accurate are Amniva's predictions?", a: "Amniva uses AI-driven models trained on multiple data sources. While no prediction system is 100% accurate, our models are continuously refined with real-world feedback and institutional data." },
      { q: "Can I contribute to the Amniva community?", a: "Yes! Once registered, you can participate in community discussions, share market insights, and engage with other business leaders on the platform." },
    ],
  },
  {
    title: "AgroClimate",
    faqs: [
      { q: "What is AgroClimate?", a: "AgroClimate is a smart farming platform providing real-time weather forecasts, agro production alerts for livestock, crops, and aquaculture, environmental predictions, drone advisory, AI farming assistant, and learning resources." },
      { q: "Is AgroClimate free to use?", a: "AgroClimate offers a free tier with basic weather and alert features. Premium features including drone advisory and AI assistant are available on paid plans." },
      { q: "How does the AI assistant work?", a: "The AI assistant answers farming questions about crop management, livestock care, pest identification, planting calendars, and soil health — all personalized to your location and conditions." },
    ],
  },
  {
    title: "Security & Privacy",
    faqs: [
      { q: "How does Amineva protect my data?", a: "We use 256-bit encryption, secure authentication protocols, and follow industry-standard security practices. All data is stored in compliant data centres with regular security audits." },
      { q: "Can I delete my account?", a: "Yes. You can request account deletion by contacting support@amineva.com. All personal data will be permanently removed within 30 days of the request." },
      { q: "Does Amineva share my data with third parties?", a: "We do not sell or share your personal data with third parties for marketing purposes. Data may be processed by trusted service providers strictly for platform operations, as outlined in our Privacy Policy." },
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
