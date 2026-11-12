import { FC } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BriefcaseBusiness,
  FileText,
  Plane,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  ClipboardCheck,
} from "lucide-react";

const serviceAreas = [
  {
    icon: GraduationCap,
    title: "Career & Education",
    description: "Get clear information and professional guidance on career opportunities and education pathways, so you can understand your options and make informed next-step decisions.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Business Information",
    description: "Understand business opportunities, market entry, competitors, products and expansion through relevant information and practical advisory support.",
  },
  {
    icon: FileText,
    title: "Contracts & Communication",
    description: "Understand responsibilities, important terms and practical considerations before entering agreements or business transactions.",
  },
  {
    icon: Plane,
    title: "Travel & Relocation",
    description: "Get destination-specific information when planning to travel, study, work or relocate internationally.",
  },
  {
    icon: ShieldCheck,
    title: "Info and Reports Verification",
    description: "Have information, documents, reports, claims and business details independently checked through source checks, cross-referencing and evidence-based assessment.",
  },
];

const InfoServicesPage: FC = () => (
  <main className="w-full">
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-24 text-primary-foreground lg:py-32">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-4 py-1.5 text-sm font-semibold text-accent">
            <ClipboardCheck className="h-4 w-4" /> Amineva Global Info Services
          </div>
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Information for
            <span className="block text-accent">Better Decisions</span>
          </h1>
          <p className="mx-auto mb-7 max-w-3xl text-lg leading-8 text-primary-foreground/85">
            Important decisions deserve clear, dependable information. Whether you are considering an opportunity, trying to understand an agreement, planning an international move or checking details you have received, we help you understand what matters before taking the next step.
          </p>
          <p className="mx-auto max-w-3xl text-base leading-8 text-primary-foreground/75 md:text-lg">
            Receive information and professional advisory support directly, or request a carefully prepared written document or report when that better suits your needs.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href="https://datalens.amineva.com/request" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-accent/90">
              Make an Enquiry <ArrowRight className="h-5 w-5" />
            </a>
            <a href="https://datalens.amineva.com/booking" className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/15">
              <MessageCircle className="h-4 w-4" /> Book an Information Session
            </a>
          </div>
        </motion.div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">What we can help with</span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Our Info Services</h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Five practical service areas designed around the information and guidance people need for important decisions.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
        {serviceAreas.map((area, index) => (
          <motion.article
            key={area.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ delay: index * 0.06, duration: 0.4 }}
            className={`rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg ${index < 3 ? "lg:col-span-2" : "lg:col-span-3"}`}
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <area.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">{area.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{area.description}</p>
          </motion.article>
        ))}
      </div>
    </section>

    <section className="border-y border-border bg-secondary/40 px-5 py-20 md:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">How we support you</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">The format that works for your needs</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Not every request needs the same kind of response. We shape the support around what you are trying to understand and what will be most useful to you.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-7">
            <MessageCircle className="h-7 w-7 text-accent" />
            <h3 className="mt-4 text-xl font-bold text-foreground">Information and professional advisory</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Discuss your questions with us and receive clear information, explanations and practical professional guidance to help you consider your options.</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-7">
            <FileText className="h-7 w-7 text-accent" />
            <h3 className="mt-4 text-xl font-bold text-foreground">Written documents and reports</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Where a written output is more suitable, we can prepare a document or report that sets out the relevant information in an organised and useful format.</p>
          </article>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-5xl px-5 py-20 text-center md:px-8 lg:py-24">
      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Get started</span>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Tell us what you need to understand.</h2>
      <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted-foreground">We will help you identify the information or support you need and the most suitable way to provide it.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="https://datalens.amineva.com/request" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary/90">Submit an Enquiry <ArrowRight className="h-5 w-5" /></a>
        <a href="https://datalens.amineva.com/booking" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-semibold text-foreground transition hover:bg-muted">Book a Session</a>
      </div>
    </section>
  </main>
);

export default InfoServicesPage;
