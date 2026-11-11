import React, { useState } from "react";
import { Search, ExternalLink, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchVerifiedDiscoveryRecords } from "@/lib/infoDiscovery/discoveryLibrary";
import type { ResearchRecord } from "@/lib/infoDiscovery/researchSearch";

const INITIAL_CASES = [{
  id: "chy-trading-v-biglebb-2025",
  title: "CHY Trading Ltd v Biglebb Construction & Crushing Ltd and Giovanni Antonelli",
  citation: "Suit No. CM/RPC/0600/2019 · [2025] GHAHC 27",
  court: "High Court of Justice, Commercial Division, Accra",
  date: "28 January 2025",
  outcome: "The Court held that CHY Trading had not established the legal standing to bring the claim. It found that the assignment of the alleged debt from Unique Oil to CHY Trading had not been shown to bind the defendants: there was no documentary proof that written notice of the assignment had been served. The Court therefore declined the claim and made no order as to costs.",
  reasoning: "The judgment explains that being a shareholder in another company does not, by itself, give a company standing to enforce that other company's commercial debts. It also discusses the statutory requirements for assignment of a legal right, including written notice to the debtor. The Court did not decide the underlying debt claim on its merits after finding the plaintiff lacked standing. It observed that Gaso Petroleum and Unique Oil could pursue any claims they independently had, subject to proof.",
  lesson: "Businesses acquiring receivables or debts should preserve the written assignment instrument, identify the rights assigned, and retain clear documentary evidence that required written notice was served on the debtor. Shareholding in a separate company should not be treated as automatic authority to sue on that company's contracts.",
  appealStatus: "The judgment does not establish whether a later appeal was filed or how any appeal was resolved. That status must be checked separately before relying on the decision as current authority.",
  url: "https://ghalii.org/akn/gh/judgment/ghahc/2025/27/eng%402025-01-28/source",
  keywords: "commercial law contract debt recovery assignment receivables standing locus standi written notice company separate legal personality Ghana"
}];

const AUTHORITATIVE_CASE_SOURCES = [
  { name: "Ghana Judiciary e-Judgment Portal", description: "Judgments and case-law research across Ghanaian court jurisdictions; the portal describes its headnotes and keyword-linked search features.", url: "https://ejudgment.judicial.gov.gh/" },
  { name: "Ghana Legal Information Institute (GhaLII)", description: "Searchable Ghana legislation and judicial decisions. Confirm current law and procedural status against authoritative publications.", url: "https://ghalii.org/" },
  { name: "Ghana Revenue Authority – Legal Cases", description: "Published tax and revenue-related cases involving the Ghana Revenue Authority.", url: "https://gra.gov.gh/legal-cases/" }
];

export function BusinessCaseReference() {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const matchingInitialCases = INITIAL_CASES.filter(item => !query.trim() || [item.title, item.citation, item.court, item.date, item.outcome, item.reasoning, item.lesson, item.keywords].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  const searchCases = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = query.trim();
    if (clean.length < 2) { setError("Enter at least two characters to search reviewed case records."); return; }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const found = await searchVerifiedDiscoveryRecords(clean);
      setRecords(found.filter(record => /case|judg(e)?ment|court decision|tribunal decision|legal decision/i.test(record.type)));
    } catch (err: any) {
      setError(err?.message || "The reviewed case library could not be searched right now.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6" aria-labelledby="business-case-reference-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex items-center gap-2 text-sm font-semibold"><Scale className="h-4 w-4 text-primary" /><h2 id="business-case-reference-title">Business case decisions and outcomes</h2></div><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Search case records that have passed publication review, and consult the primary Ghanaian case-law repositories. Each published case summary must identify the court, jurisdiction, decision date, orders and appeal status.</p></div>
        <Badge variant="outline">Judgments · Settlements · Decisions</Badge>
      </div>
      <form onSubmit={searchCases} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input value={query} onChange={event => { setQuery(event.target.value); setRecords([]); setError(""); setSearched(false); }} placeholder="Search a case name, court, legal issue or citation" aria-label="Search reviewed business case decisions" />
        <Button type="submit" disabled={loading || query.trim().length < 2} className="sm:min-w-32">{loading ? "Searching…" : <><Search className="mr-2 h-4 w-4" />Search cases</>}</Button>
        {(query || searched) && <Button type="button" variant="outline" onClick={() => { setQuery(""); setRecords([]); setError(""); setSearched(false); }}>Clear</Button>}
      </form>
      {error && <p role="status" className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{error}</p>}
      {matchingInitialCases.map(item => <article key={item.id} className="mt-3 rounded-xl border border-border bg-background/60 p-4">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.date}</Badge><Badge variant="outline">Ghana · Commercial Division</Badge><Badge>Published judgment</Badge></div>
        <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{item.citation} · {item.court}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div><h4 className="text-xs font-semibold">Decision and reasoning</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.outcome} {item.reasoning}</p></div>
          <div><h4 className="text-xs font-semibold">Practical lesson and later status</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.lesson} {item.appealStatus}</p></div>
        </div>
        <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2">Read the full High Court judgment <ExternalLink className="h-3 w-3" /></a>
      </article>)}
      {records.map(record => <article key={record.id} className="mt-3 rounded-xl border border-border bg-background/60 p-4">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{record.year || "Decision year not supplied"}</Badge><Badge variant="outline">{record.type}</Badge><Badge>Editorially verified</Badge></div>
        <h3 className="mt-2 text-sm font-semibold">{record.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{record.publisher} · {record.authors}</p>
        {record.abstract && <p className="mt-2 text-xs leading-5 text-muted-foreground">{record.abstract}</p>}
        {record.url && <a href={record.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2">Open source judgment or decision <ExternalLink className="h-3 w-3" /></a>}
      </article>)}
      {searched && !records.length && !matchingInitialCases.length && !error && <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">No reviewed case summaries matched this search. Use the primary repositories below; additional summaries appear here only after the judgment or official decision has been checked.</p>}
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {AUTHORITATIVE_CASE_SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/60 p-3 transition hover:border-primary/40">
          <span className="flex items-center justify-between gap-2 text-xs font-semibold">{source.name}<ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" /></span>
          <span className="mt-2 block text-[11px] leading-5 text-muted-foreground">{source.description}</span>
        </a>)}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">A settlement, consent order, administrative determination and judgment after trial are different legal outcomes. Summaries must state which occurred, whether an appeal or later decision exists, and must not present a dissenting opinion as the court's order. This is general legal information, not legal advice.</p>
    </section>
  );
}
