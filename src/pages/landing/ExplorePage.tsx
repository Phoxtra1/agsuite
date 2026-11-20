import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, Compass, GraduationCap, Search, X, Sparkles
} from "lucide-react";

type Product = {
  name: string;
  description: string;
  group: string;
  icon?: React.ElementType;
  image?: string;
  href?: string;
  external?: boolean;
  status?: "coming-soon";
};

const products: Product[] = [
  { name: "Info Solutions", description: "Discover information. Access professional services.", group: "Information", icon: Compass, href: "https://info.amineva.com", external: true },
  { name: "Career & Education", description: "Explore pathways, learning and opportunity.", group: "People", image: "/adesua.png", href: "/explore/career-education" },
  { name: "AgroClimate", description: "Agriculture and climate intelligence.", group: "Agriculture", image: "/agroclimate.png", href: "https://agro.amineva.com", external: true },
  { name: "DataLens", description: "A new service is in development.", group: "Business", image: "/datalens.png", status: "coming-soon" },
  { name: "Sikasem", description: "Financial operations and management.", group: "Finance", image: "/sikasem.png", href: "https://ops.amineva.com", external: true },
  { name: "Inventra", description: "Inventory and sales management.", group: "Business", image: "/inventra.png", href: "https://stock.amineva.com", external: true },
  { name: "Dipa", description: "Artificial intelligence.", group: "Intelligence", image: "/Dipa-icon.webp", href: "https://ode.amineva.com", external: true },
];

const careerOptions: Product[] = [
  { name: "Amineva Impact", description: "Career Development & Exploration Programme.", group: "Impact", icon: Sparkles, href: "https://www.amineva.com/Impact", external: true },
  { name: "Adesua", description: "Learning and practical education.", group: "Education", image: "/adesua.png", href: "https://as.amineva.com", external: true },
];

const filters = ["All", "Business", "People", "Intelligence", "Agriculture", "Finance", "Information"];

function ProductCard({ product, index, showDescription = true, showGroup = false }: { product: Product; index: number; showDescription?: boolean; showGroup?: boolean }) {
  const Icon = product.icon;
  const content = (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.045 }}
      whileHover={product.status ? undefined : { y: -4 }}
      className={`group relative flex min-h-[132px] flex-col overflow-hidden rounded-xl border border-border/80 bg-card/90 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg sm:min-h-[138px] sm:p-3.5 ${product.status ? "opacity-80" : ""}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.06] blur-2xl transition-all duration-500 group-hover:bg-primary/[0.13]" />
      <div className="relative flex items-start justify-between gap-3">
        {(product.image || Icon) && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.08] p-1 transition-transform duration-300 group-hover:scale-105">
            {product.image ? (
              <img src={product.image} alt={`${product.name} icon`} className="h-full w-full object-contain" />
            ) : Icon ? (
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            ) : null}
          </span>
        )}
        {product.status === "coming-soon" ? (
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Coming soon</span>
        ) : (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        )}
      </div>
      <div className="relative mt-3">
        <h2 className="text-sm font-semibold leading-snug tracking-tight text-foreground sm:text-[14px]">{product.name}</h2>
        {showDescription && <p className="mt-1 text-xs leading-5 text-muted-foreground">{product.description}</p>}
        {showGroup && <span className="mt-1.5 inline-flex rounded-full border border-border/80 bg-muted/55 px-2 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground">{product.group}</span>}
      </div>
      <div className="relative mt-auto pt-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary/80">
        Solution
      </div>
    </motion.article>
  );

  if (product.status === "coming-soon" || !product.href) {
    return <div aria-label={`${product.name} solution`}>{content}</div>;
  }
  if (product.external) {
    return (
      <a href={product.href} target="_blank" rel="noopener noreferrer" className="block w-full" aria-label={`Open ${product.name} application in a new tab`}>
        {content}
      </a>
    );
  }
  return <Link to={product.href} aria-label={`Open ${product.name} solution`}>{content}</Link>;
}

export default function ExplorePage() {
  const { section } = useParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const isCareer = section === "career-education";

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesFilter = filter === "All" || product.group === filter;
    const matchesQuery = `${product.name} ${product.description} ${product.group}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesQuery;
  }), [filter, query]);

  const clearSearch = () => setQuery("");

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-0 h-80 w-80 rounded-full bg-primary/[0.08] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-48 h-96 w-96 rounded-full bg-violet-500/[0.07] blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <AnimatePresence mode="wait">
          {isCareer ? (
            <motion.section key="career" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All solutions</Link>
              <div className="mx-auto mb-9 mt-8 max-w-2xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary"><GraduationCap className="h-3.5 w-3.5" /> Career & Education</span>
                <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Choose your destination</h1>
                <p className="mt-3 text-sm text-muted-foreground">Explore the initiative or continue to the learning platform.</p>
              </div>
              <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
                {careerOptions.map((product, index) => <ProductCard key={product.name} product={product} index={index} />)}
              </div>
            </motion.section>
          ) : (
            <motion.section key="all-products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
              <div className="mb-9 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Amineva Global</span>
                <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Solutions</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">One ecosystem. Connected solutions.</p>
              </div>

              <div className="mx-auto mb-3 max-w-2xl">
                <div className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-card/90 px-4 shadow-sm transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a solution..." aria-label="Find a solution" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" />
                  {query && <button type="button" onClick={clearSearch} aria-label="Clear search" className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>}
                </div>
              </div>
              <p className="mx-auto mb-6 max-w-2xl text-center text-xs leading-5 text-muted-foreground sm:text-sm">Explore our connected solutions across business, people, intelligence, agriculture, finance and information.</p>

              <div className="mb-7 flex flex-wrap justify-center gap-2">
                {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${filter === item ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card/70 text-muted-foreground hover:border-primary/35 hover:text-foreground"}`}>{item}</button>)}
              </div>

              {visibleProducts.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-10">
                  {visibleProducts.map((product, index) => (
                    <div key={product.name} className={index >= 5 ? "col-span-1 lg:col-span-5" : "col-span-1 lg:col-span-2"}>
                      <ProductCard product={product} index={index} showDescription={false} showGroup onSelect={setSelectedProduct} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-12 text-center">
                  <Search className="mx-auto h-6 w-6 text-muted-foreground/60" />
                  <p className="mt-3 text-sm font-medium">No matching solutions</p>
                  <button type="button" onClick={() => { setQuery(""); setFilter("All"); }} className="mt-2 text-xs font-semibold text-primary hover:underline">Clear filters</button>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
