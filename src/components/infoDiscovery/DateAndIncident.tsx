import React, { useMemo, useState } from "react";
import { CalendarDays, Search, Loader2, ExternalLink, Clock3, ShieldCheck, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ResearchSource = { title: string; publisher: string; url: string; sourceType: string; supports: string };
type HistoricalEvent = {
  year: number; title: string; summary: string; location: string; region: "Africa" | "International";
  category: string; eventDateBasis: string; significance: string; people: string[];
  sources: ResearchSource[]; confidence: "corroborated" | "single-source" | "contested"; caveat: string;
};

const FUNCTION_ID = (import.meta as any).env?.VITE_DATE_INCIDENT_FUNCTION_ID || (import.meta as any).env?.VITE_SUITE_FUNCTION_ID || "69689f59003426b9e5e3";

async function runResearch(month: number, day: number, region: string, category: string): Promise<HistoricalEvent[]> {
  const { account, functions } = await import("@/lib/appwrite");
  const session = await account.getSession("current").catch(() => null);
  const execution = await functions.createExecution(
    FUNCTION_ID,
    JSON.stringify({ action: "dateIncidentResearch", month, day, region, category }),
    false,
    "/",
    "POST",
    { "Content-Type": "application/json" }
  );
  let result: any = {};
  try { result = JSON.parse(execution.responseBody || "{}"); } catch { throw new Error("The historical research service returned an unreadable response."); }
  if (!execution.responseStatusCode || execution.responseStatusCode < 200 || execution.responseStatusCode >= 300 || !result.success) {
    throw new Error(result.error || "Historical research is temporarily unavailable.");
  }
  return Array.isArray(result.events) ? result.events : [];
}

export function DateAndIncident() {
  const today = new Date();
  const [date, setDate] = useState(`${today.getMonth() + 1}-${today.getDate()}`);
  const [region, setRegion] = useState("Africa first");
  const [category, setCategory] = useState("all");
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const filteredEvents = useMemo(() => events.filter(event => {
    if (region === "Africa" && event.region !== "Africa") return false;
    if (region === "International" && event.region !== "International") return false;
    if (category !== "all" && !event.category.toLowerCase().includes(category)) return false;
    return true;
  }), [events, region, category]);

  async function searchDate() {
    const [month, day] = date.split("-").map(Number);
    const validDate = new Date(Date.UTC(2000, month - 1, day));
    if (!month || !day || validDate.getUTCMonth() + 1 !== month || validDate.getUTCDate() !== day) {
      setError("Choose a valid calendar date."); return;
    }
    setLoading(true); setError(""); setSearched(true); setEvents([]);
    try {
      const results = await runResearch(month, day, region, category);
      setEvents(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to research this date.");
    } finally { setLoading(false); }
  }

  const [month, day] = date.split("-").map(Number);
  const displayDate = new Date(Date.UTC(2000, (month || 1) - 1, day || 1)).toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" });

  return (
    <section className="space-y-6" aria-labelledby="date-incident-heading">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary"><CalendarDays className="h-4 w-4" /> Historical discovery</div>
        <h2 id="date-incident-heading" className="mt-3 text-2xl font-bold tracking-tight">Date &amp; Incident</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Discover the events, incidents and historical milestones that shaped our world.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="space-y-1.5 text-xs font-medium text-foreground">Choose a date
            <Input type="date" value={`2000-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`} onChange={e => { const value = e.target.value; if (value) setDate(`${Number(value.slice(5,7))}-${Number(value.slice(8,10))}`); }} />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-foreground">Geographical coverage
            <select value={region} onChange={e => setRegion(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Africa first">Africa first · then worldwide</option><option value="Africa">Africa only</option><option value="International">International events</option><option value="all">All regions</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium text-foreground">Event category
            <select value={category} onChange={e => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All events</option><option value="conflict">Wars, conflicts &amp; independence</option><option value="politics">Politics &amp; government</option><option value="disaster">Disasters &amp; accidents</option><option value="science">Science &amp; discoveries</option><option value="culture">Culture, society &amp; sport</option>
            </select>
          </label>
          <div className="flex items-end"><Button onClick={searchDate} disabled={loading} className="w-full md:w-auto"><Search className="mr-2 h-4 w-4" />Discover events</Button></div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Searching {displayDate}, prioritising African records while including significant events worldwide.</p>
      </div>

      {loading && <div className="flex items-center justify-center gap-2 rounded-xl border border-border p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Researching historical records…</div>}
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {searched && !loading && !error && <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-semibold">Events on {displayDate}</h3><p className="text-xs text-muted-foreground">{filteredEvents.length} researched records</p></div><Badge variant="outline">African history prioritised</Badge></div>
        {filteredEvents.length ? <div className="grid gap-3 md:grid-cols-2">{filteredEvents.map((event, index) => <article key={`${event.year}-${index}-${event.title}`} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge variant={event.region === "Africa" ? "default" : "secondary"}>{event.region}</Badge><Badge variant="outline">{event.category}</Badge><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{event.year}</span></div>
          <h4 className="mt-3 font-semibold leading-5">{event.title}</h4>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{event.location}</p>
          <p className="mt-3 text-sm leading-6">{event.summary}</p>
          {event.significance && <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.significance}</p>}
          {event.people?.length > 0 && <p className="mt-2 text-xs text-muted-foreground">People: {event.people.join(", ")}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{event.confidence === "corroborated" ? "Multiple sources" : event.confidence === "contested" ? "Contested account" : "Single-source support"}</span></div>
          {event.eventDateBasis && <p className="mt-2 text-xs leading-5 text-muted-foreground">Date record: {event.eventDateBasis}</p>}
          {event.caveat && <p className="mt-2 rounded-md bg-muted/60 p-2 text-xs leading-5 text-muted-foreground">Historical note: {event.caveat}</p>}
          <div className="mt-4 border-t border-border pt-3"><p className="mb-2 text-xs font-semibold">Sources and records</p><ul className="space-y-2">{event.sources.map((source, sourceIndex) => <li key={source.url + sourceIndex}><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">{source.title || source.publisher} <ExternalLink className="h-3 w-3" /></a><p className="text-[11px] text-muted-foreground">{source.publisher} · {source.sourceType}{source.supports ? ` · ${source.supports}` : ""}</p></li>)}</ul></div>
        </article>)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No sufficiently supported records matched these filters for this date. Try all regions or another category.</div>}
        <p className="text-[11px] leading-5 text-muted-foreground">Confidence labels reflect the number and type of available sources. Review the linked original records, especially where historical accounts or dates are disputed.</p>
      </div>}
    </section>
  );
}
