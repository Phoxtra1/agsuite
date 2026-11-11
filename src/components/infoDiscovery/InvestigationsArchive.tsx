import React, { useMemo, useState } from "react";
import { Search, ExternalLink, FileText, ShieldCheck, Clock3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchVerifiedDiscoveryRecords } from "@/lib/infoDiscovery/discoveryLibrary";
import type { ResearchRecord } from "@/lib/infoDiscovery/researchSearch";

const INITIAL_INVESTIGATIONS = [{
  id: "osp-labianca-2022",
  title: "Investigation into Labianca Company Limited and the Customs Division of the Ghana Revenue Authority",
  publisher: "Office of the Special Prosecutor, Ghana",
  year: 2022,
  jurisdiction: "Ghana",
  type: "Published official investigation report",
  status: "Labianca complaint report published · 3 August 2022; wider Customs inquiry subsequently opened",
  summary: "The OSP investigated a complaint concerning customs advance rulings and reduced benchmark values for imported frozen foods. Its report found that a 5–10% reduction had been granted without meeting the statutory requirements it identified, and calculated a revenue shortfall of GH¢1,074,627.15 across 531 import declarations. The report records that Labianca complied with the OSP's directive to repay that amount on 31 March 2022.",
  method: "The published report describes review of company and customs documents, including payment records, contracts, invoices, bills of lading, sales books, customs ruling applications and tax returns, as well as interviews with relevant individuals. The OSP states that interviewees were given an opportunity to respond and were represented by counsel.",
  outcome: "The OSP report records repayment of GH¢1,074,627.15 and directs an integrity plan for the Customs Division. It also directed a wider investigation into customs advance rulings and benchmark-value markdowns from July 2017 to December 2021; the OSP’s public case profile continues to list that wider Customs Division investigation as ongoing. A later OSP press release states that the discretionary discount on FOB values of general goods and HDV of vehicles was reversed with effect from 1 January 2023. These are findings and administrative developments reported by the OSP, not a court judgment or a statement that every person named was convicted.",
  sources: [
    { label: "Read the OSP investigation report (PDF)", url: "https://osp.gov.gh/media/Resources/osp_investigation_report_labianca.pdf" },
    { label: "OSP press release on reversal of customs discounts", url: "https://osp.gov.gh/media_center/press_details/ghana-revenue-authority-reversal-of-discount-on-fob-value-of-general-goods-and-hdv-of-vehicles" },
    { label: "OSP investigation and impact record", url: "https://osp.gov.gh/media_center/impact" },
    { label: "OSP case profile: wider Customs Division investigation", url: "https://osp.gov.gh/case_files/case_profile/9/cases/" }
  ],
  keywords: "Labianca customs Ghana customs advance ruling frozen foods benchmark values OSP investigation 531 declarations repayment integrity plan"
}];

export function InvestigationsArchive() {
  const [query, setQuery] = useState("");
  const [libraryRecords, setLibraryRecords] = useState<ResearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const localMatches = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase();
    return INITIAL_INVESTIGATIONS.filter(item => !clean || [item.title, item.publisher, item.jurisdiction, item.type, item.status, item.summary, item.method, item.outcome, item.keywords].join(" ").toLocaleLowerCase().includes(clean));
  }, [query]);

  const searchArchive = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = query.trim();
    if (clean.length < 2) {
      setError("Enter at least two characters to search the archive.");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const records = await searchVerifiedDiscoveryRecords(clean);
      setLibraryRecords(records.filter(record => /investigation|inquiry|commission report|official report/i.test(record.type)));
    } catch (err: any) {
      setError(err?.message || "The reviewed archive could not be searched right now.");
      setLibraryRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => { setQuery(""); setLibraryRecords([]); setError(""); setSearched(false); };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6" aria-labelledby="investigations-archive-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> <h2 id="investigations-archive-title">Investigations Archive</h2></div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">A curated starting archive of published investigative journalism and completed official investigations. Entries identify who made each finding and link to the original report.</p>
        </div>
        <Badge variant="outline">Publicly documented records</Badge>
      </div>
      <form onSubmit={searchArchive} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input value={query} onChange={event => { setQuery(event.target.value); setLibraryRecords([]); setError(""); setSearched(false); }} placeholder="Search investigations, organisations, methods or findings" aria-label="Search investigations archive" />
        <Button type="submit" disabled={loading || query.trim().length < 2} className="sm:min-w-32">{loading ? "Searching…" : <><Search className="mr-2 h-4 w-4" />Search archive</>}</Button>
        {(query || searched) && <Button type="button" variant="outline" onClick={clearSearch}>Clear</Button>}
      </form>
      {error && <p role="status" className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{error}</p>}
      <div className="mt-4 space-y-3">
        {localMatches.map(item => (
          <article key={item.id} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.year}</Badge><Badge variant="outline">{item.jurisdiction}</Badge><Badge>{item.type}</Badge></div>
            <h3 className="mt-2 text-sm font-semibold leading-6">{item.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{item.publisher} · {item.status}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div><h4 className="text-xs font-semibold">Investigation and method</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.method}</p></div>
              <div><h4 className="text-xs font-semibold">Reported findings and outcome</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.summary} {item.outcome}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3">{item.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2">{source.label} <ExternalLink className="h-3 w-3" /></a>)}</div>
          </article>
        ))}
        {libraryRecords.map(record => (
          <article key={record.id} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{record.year || "Year not supplied"}</Badge><Badge variant="outline">{record.type}</Badge><Badge>Editorially verified</Badge></div>
            <h3 className="mt-2 text-sm font-semibold">{record.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{record.publisher} · {record.authors}</p>
            {record.abstract && <p className="mt-2 text-xs leading-5 text-muted-foreground">{record.abstract}</p>}
            {record.url && <a href={record.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2">Open original report <ExternalLink className="h-3 w-3" /></a>}
          </article>
        ))}
      </div>
      {searched && !libraryRecords.length && !error && <p className="mt-3 text-xs text-muted-foreground">No additional reviewed investigation records matched this search. The curated entries above remain available; new entries appear here only after source and publication review.</p>}
      {!localMatches.length && !libraryRecords.length && !loading && <p className="mt-3 rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">No archive entries match that wording. Try another name, institution or subject.</p>}
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-[11px] leading-5 text-muted-foreground"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><p>Scope of this first release: published journalism and completed official investigations with public reports. Active confidential investigations, unpublished case files and unverified allegations are excluded. An investigation report is not a court judgment; prosecution, conviction and acquittal must be recorded separately.</p></div>
      <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground"><FileText className="mt-0.5 h-4 w-4 shrink-0" /><p>Search includes this curated archive and records already approved in the Amineva publication library. External reporting is not automatically treated as independently established fact.</p></div>
    </section>
  );
}
