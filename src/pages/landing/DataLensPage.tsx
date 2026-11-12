import { FC } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BriefcaseBusiness,
  FileText,
  Plane,
  ShieldCheck,
  ArrowRight,
  Search,
  ClipboardList,
  BarChart3,
  FileCheck2,
  CheckCircle2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
};

const serviceAreas = [
  {
    icon: GraduationCap,
    title: "Career & Education",
    description: "Research and analysis for students, parents, graduates and working adults exploring education and career directions.",
    services: [
      "Career Reports",
      "Educational Pathway",
      "Career Change",
      "Career Opportunities",
      "One-on-One Session",
      "Other Career Requests",
    ],
  },
  {
    icon: BriefcaseBusiness,
    title: "Business Information",
    description: "Information to understand business opportunities, competition, products, expansion and entry into new markets.",
    services: [
      "Business Opportunities",
      "Competitor Analysis",
      "Product & Brand Analysis",
      "Business Expansion",
      "Market Entry Reports",
      "Other Requests",
    ],
  },
  {
    icon: FileText,
    title: "Contracts & Commitments",
    description: "Factual information to help people understand important terms, responsibilities and considerations before committing.",
    services: [
      "Work-and-Pay Agreements",
      "Rental & Lease Agreements",
      "Business Partnerships",
      "Purchase & Sales Transactions",
      "Contract Terms & Obligations",
      "Other Requests",
    ],
  },
  {
    icon: Plane,
    title: "Travel & Relocation",
    description: "Destination research for people planning to travel, study, work or relocate to another country.",
    services: [
      "Country Reports",
      "Travel Preparation",
      "Study Abroad",
      "Overseas Employment",
      "Relocation",
      "Country Comparisons",
      "Other Travel & Relocation Requests",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Info and Reports Verification",
    description: "Independent checking for people and organisations who already have information, documents or reports they need to verify.",
    services: [
      "Information Verification",
      "Document Verification",
      "Report Verification",
      "Business Information Verification",
      "Claims & Statistics Verification",
      "Offers & Opportunities Verification",
      "Other Verification Requests",
    ],
  },
];

const processSteps = [
  {
    icon: ClipboardList,
    title: "Submit your question",
    description: "Explain what you need to understand and provide any relevant background or documents.",
  },
  {
    icon: Search,
    title: "Scope and quotation",
    description: "The request is reviewed and the research scope, source availability, timeline and fee are established before work begins.",
  },
  {
    icon: BarChart3,
    title: "Research and analysis",
    description: "Relevant data is gathered, sources are checked, information is processed and findings are analysed.",
  },
  {
    icon: FileCheck2,
    title: "Professional report",
    description: "Receive a structured report that presents findings, analysis, supporting sources and relevant limitations.",
  },
];

const DataLensPage: FC = () => {
  return (
    <div className="w-full">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-24 text-primary-foreground lg:py-32">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-4 py-1.5 text-sm font-semibold text-accent">
              <Search className="h-4 w-4" />
              DataLens by Amineva Global
            </div>
            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Information Before
              <span className="block text-accent">Important Decisions</span>
            </h1>
            <p className="mx-auto mb-7 max-w-3xl text-lg leading-8 text-primary-foreground/85">
              Research. Verification. Analysis. Reports.
            </p>
            <p className="mx-auto mb-9 max-w-3xl text-base leading-8 text-primary-foreground/75 md:text-lg">
              DataLens gathers relevant data, checks sources, processes information and analyses findings to prepare clear, evidence-based reports for individuals and organisations.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://datalens.amineva.com/request"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-accent/90"
              >
                Request an Information Report <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="https://datalens.amineva.com/booking"
                className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/15"
              >
                Book an Information Session
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">What you can request</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Information for the questions that matter
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Each request is considered on its own scope. Explore the five areas to see the information and reports DataLens can prepare.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
          {serviceAreas.map((area, index) => (
            <motion.article
              key={area.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              variants={fadeUp}
              custom={index}
              className={`flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg ${index < 3 ? "lg:col-span-2" : "lg:col-span-3"}`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <area.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{area.title}</h3>
              <p className="mt-2 min-h-[72px] text-sm leading-6 text-muted-foreground">{area.description}</p>
              <div className="mt-5 border-t border-border/70 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Available requests</p>
                <ul className="space-y-2">
                  {area.services.map((service) => (
                    <li key={service} className="flex items-start gap-2 text-sm text-foreground/90">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 px-5 py-20 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Our approach</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              From raw data to useful information
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Reports are built through a structured process. We distinguish sourced facts from analysis and identify gaps or limitations that matter to the question.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={fadeUp}
                custom={index}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 text-center md:px-8 lg:py-24">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Engage DataLens</span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Start with the information you need
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Research assignments are assessed individually. DataLens provides a quotation based on the question, scope, complexity, sources and expected work before the assignment begins. One-on-one information sessions are booked separately.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="https://datalens.amineva.com/request"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Submit a Request <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="https://datalens.amineva.com/booking"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-semibold text-foreground transition hover:bg-muted"
          >
            Book a Session
          </a>
        </div>
        <p className="mt-7 text-xs leading-5 text-muted-foreground">
          DataLens provides researched information, verification, analysis and reports. It does not replace qualified legal, financial or other regulated professional services.
        </p>
      </section>
    </div>
  );
};

export default DataLensPage;
