import React, { useMemo, useState } from "react";
import { CalendarDays, Search, Loader2, Globe2, MapPin, ExternalLink, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type OnThisDayEvent = {
  year: number;
  text: string;
  pages?: { title?: string; normalizedtitle?: string; content_urls?: { desktop?: { page?: string } } }[];
};
type EventItem = OnThisDayEvent & { region: "Africa" | "International"; url: string };

const AFRICAN_TERMS = [
  "africa","ghana","nigeria","kenya","ethiopia","egypt","sudan","south africa","senegal","mali","mugabe","mandela","lumumba","nkrumah","congo","zimbabwe","rwanda","somalia","libya","algeria","morocco","tunisia","angola","mozambique","tanzania","uganda","cameroon","ivory coast","côte d’ivoire","burkina","benin","togo","niger","chad","eritrea","namibia","botswana","lesotho","eswatini","malawi","zambia","gambia","guinea","sierra leone","liberia","mauritania","madagascar","mauritius","seychelles","comoros","djibouti","gabon","equatorial guinea","central african republic","democratic republic of the congo","kingdom of kush","aksum","asante","dahomey","kongo","songhai","mali empire","swahili"
];

function classifyRegion(event: OnThisDayEvent): "Africa" | "International" {
  const haystack = [event.text, ...(event.pages || []).map(page => page.title || "")].join(" ").toLowerCase();
  return AFRICAN_TERMS.some(term => haystack.includes(term)) ? "Africa" : "International";
}

export function DateAndIncident() {
  const today = new Date();
  const [date, setDate] = useState(`${today.getMonth() + 1}-${today.getDate()}`);
  const [region, setRegion] = useState("Africa first");
  const [category, setCategory] = useState("all");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const filteredEvents = useMemo(() => events.filter(event => {
    if (region === "Africa" && event.region !== "Africa") return false;
    if (region === "International" && event.region !== "International") return false;
    if (category === "conflict" && !/war|battle|conflict|invasion|coup|revolution|independence|assassinat|genocide|rebellion|military/i.test(event.text)) return false;
    if (category === "politics" && !/president|election|government|king|queen|parliament|treaty|minister|political|constitution|republic/i.test(event.text)) return false;
    if (category === "disaster" && !/earthquake|flood|fire|storm|cyclone|crash|accident|eruption|disaster|tsunami|drought/i.test(event.text)) return false;
    if (category === "science" && !/discover|science|invention|launch|space|research|medical|technology/i.test(event.text)) return false;
    if (category === "culture" && !/music|art|film|book|culture|festival|sport|champion|olympic|award/i.test(event.text)) return false;
    return true;
  }), [events, region, category]);

  async function searchDate() {
    const [month, day] = date.split("-").map(Number);
    if (!month || !day) return;
    setLoading(true); setError(""); setSearched(true); setEvents([]);
    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("The historical events collection is temporarily unavailable. Please try again.");
      const payload = await response.json();
      const items: OnThisDayEvent[] = payload?.events || [];
      const mapped = items.map(event => ({
        ...event,
        region: classifyRegion(event),
        url: event.pages?.[0]?.content_urls?.desktop?.page || (event.pages?.[0]?.title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(event.pages[0].title.replace(/ /g, "_"))}` : "https://en.wikipedia.org/wiki/Main_Page")
      }));
      mapped.sort((a, b) => a.region === b.region ? b.year - a.year : a.region === "Africa" ? -1 : 1);
      setEvents(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retrieve events for this date.");
    } finally { setLoading(false); }
  }

  const [month, day] = date.split("-").map(Number);
  const displayDate = new Date(2000, (month || 1) - 1, day || 1).toLocaleDateString(undefined, { month: "long", day: "numeric" });

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
        <p className="mt-3 text-xs text-muted-foreground">Searching {displayDate} across historical records, with African events prioritised and international events included.</p>
      </div>

      {loading && <div className="flex items-center justify-center gap-2 rounded-xl border border-border p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Finding historical events…</div>}
      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {searched && !loading && !error && <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-semibold">Events on {displayDate}</h3><p className="text-xs text-muted-foreground">{filteredEvents.length} matching records</p></div><Badge variant="outline">Africa-first collection</Badge></div>
        {filteredEvents.length ? <div className="grid gap-3 md:grid-cols-2">{filteredEvents.map((event, index) => <article key={`${event.year}-${index}-${event.text.slice(0,30)}`} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge variant={event.region === "Africa" ? "default" : "secondary"}>{event.region}</Badge><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{event.year}</span></div>
          <p className="mt-3 text-sm leading-6">{event.text}</p>
          <a href={event.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Read historical record <ExternalLink className="h-3 w-3" /></a>
        </article>)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No records matched these filters for this date. Try all regions or another event category.</div>}
        <p className="text-[11px] leading-5 text-muted-foreground">Historical records are retrieved from Wikipedia’s On This Day collection. Regional classification is an initial keyword-based guide, not an editorial verification. Follow the linked record and its references before relying on a historical claim.</p>
      </div>}
    </section>
  );
}
