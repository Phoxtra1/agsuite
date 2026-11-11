import React, { useState } from "react";
import { Search, ExternalLink, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchVerifiedDiscoveryRecords } from "@/lib/infoDiscovery/discoveryLibrary";
import type { ResearchRecord } from "@/lib/infoDiscovery/researchSearch";

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
        <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a case name, court, legal issue or citation" aria-label="Search reviewed business case decisions" />
        <Button type="submit" disabled={loading || query.trim().length < 2} className="sm:min-w-32">{loading ? "Searching…" : <><Search className="mr-2 h-4 w-4" />Search cases</>}</Button>
      </form>
      {error && <p role="status" className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{error}</p>}
      {records.map(record => <article key={record.id} className="mt-3 rounded-xl border border-border bg-background/60 p-4">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{record.year || "Decision year not supplied"}</Badge><Badge variant="outline">{record.type}</Badge><Badge>Editorially verified</Badge></div>
        <h3 className="mt-2 text-sm font-semibold">{record.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{record.publisher} · {record.authors}</p>
        {record.abstract && <p className="mt-2 text-xs leading-5 text-muted-foreground">{record.abstract}</p>}
        {record.url && <a href={record.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2">Open source judgment or decision <ExternalLink className="h-3 w-3" /></a>}
      </article>)}
      {searched && !records.length && !error && <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">No reviewed case summaries matched this search yet. Use the primary repositories below; new case summaries will appear here after the judgment or official decision has been checked.</p>}
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
