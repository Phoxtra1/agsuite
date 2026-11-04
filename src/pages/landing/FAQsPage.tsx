import { FC } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const groups = [
  {
    title: "Using Information Discovery",
    items: [
      { q: "What is Amineva Global?", a: "Amineva Global's public identity is the Information Discovery System. It organises information around real questions and decisions, helping people explore subjects, compare relevant evidence and reach useful source material." },
      { q: "What can I explore?", a: "The system is organised into six areas: Career Development and Education; Travel and Destination; IT and Innovation; Business Management; Agriculture and Climate Intelligence; and Operational Intelligence." },
      { q: "Do I need an account to explore information?", a: "Public discovery pages are designed to be explored without signing in. Separate connected products may have their own accounts, permissions and access requirements." },
      { q: "How do I find a particular subject?", a: "Use the discovery search to find an area or topic, open the topic guide, review its investigation questions and follow the relevant source references. You can also search the public scholarly publication index from the discovery page." },
    ],
  },
  {
    title: "Sources, accuracy and updates",
    items: [
      { q: "Where does information come from?", a: "References may include government departments, international organisations, official statistical services, professional standards bodies, research indexes and other publishers. Each source has a defined scope; the original source should be checked for the question being investigated." },
      { q: "Does a search result mean that information has been verified?", a: "No. A publication record, source link or search result is a lead for investigation, not automatic confirmation. Verification requires checking the original material, its authority, date, jurisdiction, methodology and supporting evidence." },
      { q: "Are travel and visa requirements guaranteed to be current?", a: "No. Entry rules depend on passport nationality, destination, travel purpose and date. Use the destination government's immigration or embassy information for final confirmation before making travel or payment decisions." },
      { q: "Are country indicators the same as local conditions?", a: "No. Country-level statistics can hide differences between cities, regions and groups. The system identifies the observation year and source where available; local decisions require relevant local evidence." },
      { q: "Does the climate explorer provide a weather forecast?", a: "No. Its coordinate lookup retrieves monthly climatology from NASA POWER. Climate normals describe longer-term patterns and must not be treated as a live forecast, field inspection or crop-suitability assessment." },
      { q: "Can AI-generated explanations be treated as official facts?", a: "No. AI can help interpret a question, organise material and explain relationships. It does not replace an official authority, original dataset, professional judgement or independent verification." },
    ],
  },
  {
    title: "Connected capabilities",
    items: [
      { q: "How are related products connected to discovery?", a: "A related product is shown only where it provides a practical next step for the subject being explored. Its own account, backend, records and permissions remain independent." },
      { q: "What is Operational Truth Infrastructure?", a: "It is an evidence-led operational approach with five connected capabilities: Reality Mapping, Cross-System Verification, Evidence Intelligence, Continuous Anomaly Detection and Outcome Verification. Actual verification of an organisation requires authorised access to its relevant source records." },
      { q: "Does the public discovery system access private business records?", a: "No. Public topic guides explain methods and point to reference material. Private operational data can only be examined through authorised connections and appropriate permissions." },
      { q: "What is the relationship with Amineva Impact?", a: "Amineva Impact's school and community learning initiatives are included within Career Development and Education. They are not a separate top-level discovery category." },
    ],
  },
  {
    title: "Accounts, privacy and support",
    items: [
      { q: "Do connected products share one database?", a: "No. The discovery experience may connect to separate systems through controlled interfaces where appropriate, but this does not mean that independent product databases are merged." },
      { q: "How can I get help?", a: "Use the Support page to contact the team about access, information quality, technical issues or other enquiries." },
      { q: "Where can I read the applicable policies?", a: "The Terms of Service and Privacy Policy are available from the site footer. They describe the applicable terms and data-handling practices." },
    ],
  },
];

const FAQsPage: FC = () => (
  <main className="w-full">
    <section className="relative overflow-hidden py-24 lg:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <HelpCircle className="mx-auto mb-6 h-12 w-12 text-accent" />
          <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl">Frequently Asked Questions</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-primary-foreground/80">How to use Information Discovery, interpret its sources and understand its connected capabilities.</p>
        </motion.div>
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="space-y-12">
        {groups.map((group, index) => (
          <motion.section key={group.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{group.title}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {group.items.map((item, itemIndex) => <AccordionItem key={item.q} value={group.title + "-" + itemIndex} className="rounded-xl border border-border bg-card px-4"><AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">{item.q}</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">{item.a}</AccordionContent></AccordionItem>)}
            </Accordion>
          </motion.section>
        ))}
      </div>
    </section>
    <section className="bg-secondary px-6 py-16 text-center">
      <h2 className="text-2xl font-bold text-foreground">Ready to explore?</h2>
      <p className="mb-6 mt-2 text-muted-foreground">Start with a subject or send the team an enquiry.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/info-discovery" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90">Open Info Discovery <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/support" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-semibold text-foreground hover:bg-muted">Contact Support</Link>
      </div>
    </section>
  </main>
);

export default FAQsPage;
