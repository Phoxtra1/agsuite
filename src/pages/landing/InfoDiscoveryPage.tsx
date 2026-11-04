import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Search, GraduationCap, Plane, Laptop,
  BriefcaseBusiness, Sprout, ShieldCheck, BookOpen, Compass,
  Globe2, SlidersHorizontal, ExternalLink, Clock3, FileCheck2,
  MapPinned, Lightbulb, Network, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type DiscoveryCategory = {
  slug: string;
  title: string;
  summary: string;
  purpose: string;
  icon: React.ElementType;
  topics: string[];
  structure: { heading: string; description: string; items: string[] }[];
  product?: { label: string; href: string; description: string };
};

const categories: DiscoveryCategory[] = [
  {
    slug: "career-development-education",
    title: "Career Development and Education",
    summary: "Explore interests, abilities, practical skills and the education pathways that connect learning to meaningful work.",
    purpose: "Career choices are stronger when people understand their interests, abilities and the realities of different professions. This section brings career exploration, practical learning and education pathways together so learners can make informed decisions rather than relying only on salary assumptions, social pressure or limited exposure.",
    icon: GraduationCap,
    topics: ["Career exploration", "Skills development", "Practical learning", "Education pathways", "Professional preparation", "Formula System", "Learning resources", "Amineva Impact"],
    structure: [
      { heading: "Career exploration", description: "Understand professions before choosing a direction.", items: ["Career fields and roles", "Interests, strengths and abilities", "Work environments and responsibilities", "Career decision-making"] },
      { heading: "Practical learning", description: "Move from knowing a concept to applying it.", items: ["Hands-on exercises and projects", "Problem-solving and creativity", "Technical and digital skills", "Learning by doing"] },
      { heading: "Education pathways", description: "Understand how subjects, qualifications and skills connect to further study and work.", items: ["Subject and course choices", "Qualifications and entry pathways", "Vocational and professional routes", "Further education options"] },
      { heading: "Formula System", description: "Understand why formulas and principles work, and how to use them to solve real problems.", items: ["Mathematical principles", "Science in everyday situations", "Technology and applied reasoning", "Guided practical exercises"] },
      { heading: "Amineva Impact", description: "Explore the educational and community initiatives, school engagements and learning activities of Amineva Global.", items: ["Career Development and Exploration initiative", "School engagement and activities", "Learner exposure and practical guidance", "Initiative progress and collaboration"] }
    ],
    product: { label: "Explore Adesua", href: "https://as.amineva.com/get-started", description: "Continue into a practical learning environment when you are ready to apply and develop skills." }
  },
  {
    slug: "travel-destination",
    title: "Travel and Destination",
    summary: "Understand destinations through country information, entry rules, living conditions, work, education, safety and official guidance.",
    purpose: "Make informed decisions about visiting, studying, working or living in another country. Country information should be specific to the jurisdiction and date, and entry or immigration decisions must always be confirmed with the relevant official authority.",
    icon: Plane,
    topics: ["Country profiles", "Visa and entry requirements", "Cost of living", "Housing and transport", "Healthcare and safety", "Employment conditions", "Education opportunities", "Laws and culture", "Embassies and official contacts", "Discrimination and social conditions"],
    structure: [
      { heading: "Country profiles", description: "Build a useful picture of a destination and its local context.", items: ["Geography and regions", "Living conditions", "Culture and local laws", "Public services"] },
      { heading: "Entry and travel requirements", description: "Understand the rules and official processes relevant to a traveller's nationality and purpose.", items: ["Visa and entry rules", "Application processes and official channels", "Travel documents", "Embassies and consulates"] },
      { heading: "Living and working", description: "Assess practical conditions before relocating.", items: ["Cost of living and accommodation", "Transport and connectivity", "Employment and unemployment conditions", "Education and healthcare access"] },
      { heading: "Safety and social conditions", description: "Review relevant risks and social realities with appropriate context.", items: ["Personal safety and crime", "Travel and regional risks", "Discrimination and potential racism", "Legal rights and responsibilities"] }
    ]
  },
  {
    slug: "it-innovation",
    title: "IT and Innovation",
    summary: "Understand technology requirements, infrastructure choices, system reliability, security and professional IT services.",
    purpose: "Technology decisions affect continuity, cost, security and the ability of an organisation to operate. This section explains practical IT needs, the consequences of neglected systems and the considerations behind selecting, maintaining and integrating technology.",
    icon: Laptop,
    topics: ["Website and web app development", "Continuous maintenance", "Cloud and self-hosted databases", "Cloud services", "Database management", "Cybersecurity", "Business automation", "System integration", "IT infrastructure", "Software maintenance"],
    structure: [
      { heading: "Digital products and maintenance", description: "Plan, build and maintain dependable digital services.", items: ["Website and web application development", "Ongoing maintenance and updates", "Performance and availability", "Application support"] },
      { heading: "Data and infrastructure", description: "Understand the trade-offs behind infrastructure decisions.", items: ["Cloud databases and services", "Self-hosted infrastructure", "Database administration", "Backup, recovery and continuity"] },
      { heading: "Security and integration", description: "Reduce exposure and make systems work together.", items: ["Cybersecurity practices", "Access and identity management", "System and API integration", "Business process automation"] },
      { heading: "Professional IT services", description: "Identify the expertise and support an organisation may need.", items: ["Infrastructure assessment", "System administration", "Technical support", "Software and systems maintenance"] }
    ],
    product: { label: "Explore DataLens", href: "https://app.amineva.com/signup", description: "Connect a relevant technology requirement with professional IT services." }
  },
  {
    slug: "business-management",
    title: "Business Management",
    summary: "Explore the records, controls and operating practices that help businesses understand performance and prevent avoidable losses.",
    purpose: "A business needs more than sales figures to understand what is happening. Reliable operational records, stock accountability, transaction reconciliation and clear responsibilities help owners identify discrepancies, manage resources and improve day-to-day decisions.",
    icon: BriefcaseBusiness,
    topics: ["Inventory and stock management", "Business operations", "Employee accountability", "Stock losses and discrepancies", "Sales and transaction records", "Cash reconciliation", "Business monitoring", "Operational efficiency"],
    structure: [
      { heading: "Inventory and stock control", description: "Understand what the business holds, moves, sells and loses.", items: ["Stock records and movement", "Receiving and dispatch", "Stocktaking and variances", "Loss prevention"] },
      { heading: "Transactions and reconciliation", description: "Connect sales, payments and cash records.", items: ["Sales and transaction records", "Cash and payment reconciliation", "Returns and adjustments", "Record discrepancies"] },
      { heading: "People and accountability", description: "Make responsibilities and operational activity easier to review.", items: ["Roles and responsibilities", "Employee accountability", "Approvals and controls", "Investigation of irregularities"] },
      { heading: "Operational performance", description: "Identify process weaknesses and opportunities to improve efficiency.", items: ["Daily business monitoring", "Operational reporting", "Process efficiency", "Management decisions"] }
    ],
    product: { label: "Explore Inventra", href: "https://stock.amineva.com/", description: "Move from understanding operational needs to managing inventory and business activity." }
  },
  {
    slug: "agriculture-climate-intelligence",
    title: "Agriculture and Climate Intelligence",
    summary: "Understand agricultural conditions through climate information, land and crop suitability, satellite observations and market context.",
    purpose: "Agricultural decisions depend on changing environmental and operational conditions. Useful intelligence connects weather and climate risks with land characteristics, crop requirements, observed crop conditions, farm activity, logistics and market information.",
    icon: Sprout,
    topics: ["Weather and climate risks", "Land suitability", "Crop suitability", "Satellite intelligence", "Crop stress and anomalies", "Farm management", "Agricultural logistics", "Market intelligence"],
    structure: [
      { heading: "Climate and environmental conditions", description: "Understand conditions that influence agricultural planning.", items: ["Weather observations and forecasts", "Seasonal climate risks", "Rainfall and temperature patterns", "Environmental conditions"] },
      { heading: "Land and crop suitability", description: "Assess how land and local conditions relate to crop requirements.", items: ["Land characteristics", "Crop-specific requirements", "Suitability considerations", "Site assessment"] },
      { heading: "Satellite and crop monitoring", description: "Use observations to investigate farm conditions and changes.", items: ["Satellite imagery and mapping", "Crop condition monitoring", "Stress and anomaly indicators", "Field verification"] },
      { heading: "Farm operations and markets", description: "Connect production decisions with operational and market realities.", items: ["Farm management", "Agricultural logistics", "Storage and post-harvest", "Market and supply information"] }
    ],
    product: { label: "Explore AgroClimate", href: "https://agro.amineva.com/create-account", description: "Continue into agricultural and climate intelligence tools." }
  },
  {
    slug: "operational-intelligence",
    title: "Operational Intelligence",
    summary: "Understand what is happening across an organisation by connecting processes, records, evidence, exceptions and outcomes.",
    purpose: "Organisations often hold information across separate systems, documents and teams. Operational intelligence brings relevant evidence together to establish what is known, what conflicts, what needs attention and whether decisions or corrective actions achieved their intended result.",
    icon: ShieldCheck,
    topics: ["Reality mapping", "Cross-system verification", "Evidence intelligence", "Continuous anomaly detection", "Outcome verification", "Operational monitoring", "Discrepancy analysis", "Decision accountability"],
    structure: [
      { heading: "Reality Mapping", description: "Build a structured picture of processes, systems, records, activities, responsibilities and their relationships.", items: ["Process and workflow mapping", "Systems and record relationships", "Roles and responsibilities", "Operational dependencies"] },
      { heading: "Cross-System Verification", description: "Compare authorised records across systems and identify contradictions, missing information and discrepancies.", items: ["Record comparison", "Inconsistency detection", "Missing or conflicting information", "Reconciliation findings"] },
      { heading: "Evidence Intelligence", description: "Examine documents, transactions, communications and other evidence to distinguish supported findings from questionable or unverified claims.", items: ["Evidence examination", "Source and provenance tracking", "Supported and disputed findings", "Evidence gaps"] },
      { heading: "Continuous Anomaly Detection", description: "Monitor authorised operational information for unusual patterns, suspicious changes, risks and failures.", items: ["Unusual activity patterns", "Unexpected changes", "Operational exceptions", "Risk alerts"] },
      { heading: "Outcome Verification", description: "Determine whether instructions, decisions, transactions, projects and corrective actions were completed and achieved their intended outcomes.", items: ["Action completion", "Decision follow-through", "Corrective-action tracking", "Outcome evidence"] }
    ]
  }
];

function normalise(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function InfoDiscoveryPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const selected = categories.find((category) => category.slug === categorySlug);
  const filtered = useMemo(() => {
    const q = normalise(query.trim());
    if (!q) return categories;
    return categories.filter((category) =>
      normalise([category.title, category.summary, ...category.topics, ...category.structure.flatMap(section => [section.heading, section.description, ...section.items])].join(" ")).includes(q)
    );
  }, [query]);

  const goToCategory = (slug: string) => navigate(`/info-discovery/${slug}`);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-gradient-to-b from-primary/[0.06] to-background">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Link to="/" className="transition hover:text-foreground">Amineva Global</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Info Discovery</span>
            {selected && <><ChevronRight className="h-3.5 w-3.5" /><span className="text-foreground">{selected.title}</span></>}
          </div>
          {selected ? (
            <div className="max-w-4xl">
              <Button variant="ghost" size="sm" className="-ml-3 mb-5 text-muted-foreground" onClick={() => navigate("/info-discovery")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> All discovery areas
              </Button>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl border border-border bg-card p-3"><selected.icon className="h-6 w-6 text-primary" /></div>
                <Badge variant="secondary">Discovery area</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{selected.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">{selected.summary}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5 text-primary" /> AMINEVA GLOBAL · INFORMATION DISCOVERY SYSTEM
              </div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">Discover information that helps you make better decisions.</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">Explore practical knowledge across careers, destinations, technology, business, agriculture and organisational operations. Start with a subject and follow the information that matters to you.</p>
            </>
          )}
          <div className="mt-8 max-w-4xl">
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && filtered.length === 1) goToCategory(filtered[0].slug); }} placeholder="Search areas, subjects and topics" className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" aria-label="Search discovery categories and topics" />
              </div>
              <Button className="h-11 px-6" onClick={() => filtered.length === 1 ? goToCategory(filtered[0].slug) : document.getElementById("discovery-categories")?.scrollIntoView({ behavior: "smooth" })}>
                Explore <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Search the discovery areas and their listed topics. Detailed information is presented within each area.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:px-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4" /> Browse by area</div>
            <nav className="space-y-1">
              <button onClick={() => navigate("/info-discovery")} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${!selected ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                All discovery areas <span className="text-xs">{categories.length}</span>
              </button>
              {categories.map((category) => (
                <button key={category.slug} onClick={() => goToCategory(category.slug)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${selected?.slug === category.slug ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <category.icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">{category.title}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Information standards</div>
            <p className="text-xs leading-5 text-muted-foreground">Information should show its source, relevant location or jurisdiction, publication or update date, and verification status. Official requirements must be confirmed with the responsible authority.</p>
          </div>
        </aside>

        <section id="discovery-categories" className="min-w-0">
          {selected ? (
            <div className="space-y-8">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><Lightbulb className="h-4 w-4" /> About this discovery area</div>
                <p className="max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">{selected.purpose}</p>
              </div>
              <div>
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div><h2 className="text-xl font-semibold">Explore topics</h2><p className="mt-1 text-sm text-muted-foreground">Choose a subject to understand the information covered in this area.</p></div>
                  <Badge variant="outline">{selected.topics.length} topics</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {selected.structure.map((section) => (
                    <article key={section.heading} className="rounded-xl border border-border bg-card p-5">
                      <h3 className="font-semibold">{section.heading}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.description}</p>
                      <ul className="mt-4 space-y-2">
                        {section.items.map((item) => <li key={item} className="flex items-start gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" /><span>{item}</span></li>)}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
              {selected.product && (
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 sm:flex-row sm:items-center">
                  <div><div className="mb-1 text-sm font-semibold">{selected.product.label}</div><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{selected.product.description}</p></div>
                  <a href={selected.product.href} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center text-sm font-semibold text-primary hover:underline">{selected.product.label} <ExternalLink className="ml-2 h-4 w-4" /></a>
                </div>
              )}
              <div className="rounded-xl border border-dashed border-border p-5">
                <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" /><div><h3 className="font-medium">Source and update transparency</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Published information in this area must identify its source, location or jurisdiction, relevant date and verification state. This directory currently defines the subject structure; it does not present unconnected topic descriptions as verified live records.</p></div></div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div><h2 className="text-xl font-semibold">Explore discovery areas</h2><p className="mt-1 text-sm text-muted-foreground">Select an area to explore its subjects and information structure.</p></div>
                <Badge variant="outline">{filtered.length} of {categories.length} areas</Badge>
              </div>
              {filtered.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filtered.map((category) => (
                    <button key={category.slug} onClick={() => goToCategory(category.slug)} className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md md:p-6">
                      <div className="mb-5 flex items-start justify-between">
                        <div className="rounded-xl border border-border bg-muted/50 p-3"><category.icon className="h-6 w-6 text-primary" /></div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">{category.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{category.summary}</p>
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {category.topics.slice(0, 4).map((topic) => <span key={topic} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{topic}</span>)}
                        {category.topics.length > 4 && <span className="px-1 py-1 text-[11px] text-muted-foreground">+{category.topics.length - 4} more</span>}
                      </div>
                      <div className="mt-5 flex items-center border-t border-border pt-4 text-sm font-medium text-primary">Explore area <ChevronRight className="ml-1 h-4 w-4" /></div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                  <Search className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-4 font-semibold">No matching discovery areas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Try another subject or clear your search.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>Clear search</Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <span>© {new Date().getFullYear()} Amineva Global. Information Discovery System.</span>
          <div className="flex gap-4"><Link to="/about-us" className="hover:text-foreground">About Us</Link><Link to="/faqs" className="hover:text-foreground">FAQs</Link><Link to="/support" className="hover:text-foreground">Support</Link></div>
        </div>
      </footer>
    </main>
  );
}
