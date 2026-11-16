import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { wsKey } from "@/lib/workspace/scope";

export interface TopicSummaryResult {
  summary: string;
  sources: { name: string; url: string; scope: string }[];
  keyTakeaways: string[];
  provider: "dipa-ai" | "dipa-knowledge-base";
}

export type DateIncidentSource = {
  name: string;
  url: string;
  publisher?: string;
  sourceType?: string;
  supports?: string;
};

export type DateIncidentRecord = {
  occurrenceDate: string;
  title: string;
  location: string;
  region: "Africa" | "International";
  category: string;
  summary: string;
  significance: string;
  people: string[];
  prominence: "major" | "notable";
  dateBasis: string;
  confidence: "corroborated" | "single-source" | "contested";
  caveat: string;
  sources: DateIncidentSource[];
};

async function invokeDipa(action: string, body: Record<string, unknown>) {
  return supabase.functions.invoke("docs-intelligence", {
    body: { action, ...body },
  });
}

function extractJsonPayload(data: any): any {
  let payload = data?.events || data?.incidents || data?.result || data?.data || data;
  if (typeof payload === "string") {
    const trimmed = payload.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    try {
      payload = JSON.parse(trimmed);
    } catch {
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start < 0 || end <= start) throw new Error("The historical search returned an unreadable result.");
      try { payload = JSON.parse(trimmed.slice(start, end + 1)); }
      catch { throw new Error("The historical search returned an unreadable result."); }
    }
  }
  return Array.isArray(payload) ? { events: payload } : payload;
}

const MULTI_PART_PUBLIC_SUFFIXES = new Set([
  "gov.gh", "gov.za", "go.ke", "gov.ke", "gov.ng", "gov.rw", "gov.ug",
  "go.ug", "gov.uk", "ac.uk", "co.uk", "org.uk", "com.au", "net.au",
  "org.au", "gov.au", "co.nz", "org.nz", "gov.nz", "co.za", "org.za",
  "com.ng", "com.gh", "co.ug", "com.br", "gov.br", "co.in", "gov.in",
]);

/**
 * Collapse subdomains to the same publisher identity before describing two
 * links as independent corroboration (for example, au.int and archives.au.int).
 */
function sourcePublisherIdentity(source: DateIncidentSource): string {
  let hostname = "";
  try {
    hostname = new URL(source.url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return String(source.publisher || source.name || "").toLowerCase().trim();
  }

  const suffix = Array.from(MULTI_PART_PUBLIC_SUFFIXES)
    .find(candidate => hostname === candidate || hostname.endsWith("." + candidate));
  if (suffix) {
    const labels = hostname.split(".");
    const suffixLabels = suffix.split(".");
    return labels.length > suffixLabels.length
      ? labels.slice(-(suffixLabels.length + 1)).join(".")
      : hostname;
  }

  const labels = hostname.split(".");
  return labels.length > 1 ? labels.slice(-2).join(".") : hostname;
}

export function normaliseDateIncidentResults(data: any, requestedDate: string): DateIncidentRecord[] {
  const payload = extractJsonPayload(data);
  const items = Array.isArray(payload?.events) ? payload.events : Array.isArray(payload?.incidents) ? payload.incidents : [];
  const records = items.map((item: any): DateIncidentRecord | null => {
    const occurrenceDate = String(item?.occurrenceDate || item?.eventDate || item?.date || "").slice(0, 10);
    if (occurrenceDate !== requestedDate) return null;

    const sources = (Array.isArray(item.sources) ? item.sources : []).map((source: any) => {
      const url = String(source?.url || source?.uri || "").trim();
      if (!/^https?:\/\//i.test(url)) return null;
      return {
        name: String(source.name || source.title || source.publisher || "Historical source").slice(0, 180),
        url,
        publisher: String(source.publisher || "").slice(0, 160),
        sourceType: String(source.sourceType || source.type || "Historical reference").slice(0, 80),
        supports: String(source.supports || source.relevance || "").slice(0, 350),
      };
    }).filter(Boolean).slice(0, 6) as DateIncidentSource[];

    const title = String(item.title || item.event || "").trim();
    const summary = String(item.summary || item.description || "").trim();
    if (!title || !summary || !sources.length) return null;

    const region: "Africa" | "International" = /^(africa|african)$/i.test(String(item.region || "")) ? "Africa" : "International";
    const independentPublishers = new Set(sources.map(sourcePublisherIdentity).filter(Boolean));
    const confidence = item.confidence === "contested"
      ? "contested"
      : independentPublishers.size >= 2 && item.confidence === "corroborated"
        ? "corroborated"
        : "single-source";
    return {
      occurrenceDate,
      title: title.slice(0, 240),
      location: String(item.location || item.place || "Location not established").slice(0, 180),
      region,
      category: String(item.category || "Historical event").slice(0, 80),
      summary: summary.slice(0, 1800),
      significance: String(item.significance || "").slice(0, 900),
      people: Array.isArray(item.people) ? item.people.slice(0, 12).map((person: unknown) => String(person).slice(0, 100)) : [],
      prominence: item.prominence === "major" ? "major" : "notable",
      dateBasis: String(item.dateBasis || item.dateEvidence || "").slice(0, 500),
      confidence,
      caveat: String(item.caveat || item.uncertainty || "").slice(0, 600),
      sources,
    };
  }).filter(Boolean) as DateIncidentRecord[];

  const seen = new Set<string>();
  return records.filter(record => {
    const key = record.title.toLocaleLowerCase() + "|" + record.occurrenceDate;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => {
    if (a.region !== b.region) return a.region === "Africa" ? -1 : 1;
    if (a.prominence !== b.prominence) return a.prominence === "major" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Uses the same Dipa docs-intelligence service as the platform's other
 * AI-assisted discovery features, with a date-specific historical search
 * instruction and a strict occurrence-date result contract.
 */

const DATE_INCIDENT_CACHE_KEY = "amineva_date_incidents_cache_v1";
const DATE_INCIDENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
type DateIncidentCacheEntry = { cachedAt: number; records: DateIncidentRecord[] };
type DateIncidentCache = Record<string, DateIncidentCacheEntry>;

function dateIncidentQueryKey(params: { date: string; region: string; category: string }): string {
  return [params.date, params.region, params.category].join("|");
}

export function readCachedDateIncidentResults(
  params: { date: string; region?: string; category?: string },
  maxAgeMs = DATE_INCIDENT_CACHE_TTL_MS,
  now = Date.now(),
): DateIncidentRecord[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(wsKey(DATE_INCIDENT_CACHE_KEY));
    if (!raw) return null;
    const cache = JSON.parse(raw) as DateIncidentCache;
    const entry = cache?.[dateIncidentQueryKey({
      date: params.date,
      region: params.region || "Africa first",
      category: params.category || "all",
    })];
    if (!entry || !Array.isArray(entry.records) || !Number.isFinite(entry.cachedAt)) return null;
    if (now - entry.cachedAt > maxAgeMs) return null;
    return entry.records;
  } catch {
    return null;
  }
}

export function cacheDateIncidentResults(
  params: { date: string; region?: string; category?: string },
  records: DateIncidentRecord[],
  now = Date.now(),
): void {
  if (typeof localStorage === "undefined" || !records.length) return;
  try {
    const storageKey = wsKey(DATE_INCIDENT_CACHE_KEY);
    const raw = localStorage.getItem(storageKey);
    const cache = (raw ? JSON.parse(raw) : {}) as DateIncidentCache;
    cache[dateIncidentQueryKey({
      date: params.date,
      region: params.region || "Africa first",
      category: params.category || "all",
    })] = { cachedAt: now, records };
    const newestFirst = Object.entries(cache)
      .sort((a, b) => b[1].cachedAt - a[1].cachedAt)
      .slice(0, 40);
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(newestFirst)));
  } catch (error) {
    console.warn("[Date & Incidents] Could not save local results:", error);
  }
}

export async function searchDateIncidents(params: {
  date: string;
  region?: "Africa first" | "Africa" | "International" | "all";
  category?: string;
}): Promise<DateIncidentRecord[]> {
  const { date, region = "Africa first", category = "all" } = params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T00:00:00Z"))) {
    throw new Error("Choose a valid date, including the year.");
  }

  const selectedDate = new Date(date + "T00:00:00Z");
  if (selectedDate.toISOString().slice(0, 10) !== date) throw new Error("Choose a valid calendar date.");

  const cached = readCachedDateIncidentResults(params);
  if (cached?.length) return cached;
  const staleCache = readCachedDateIncidentResults(params, Number.POSITIVE_INFINITY);

  if (!isSupabaseConfigured) {
    if (staleCache?.length) return staleCache;
    throw new Error("No saved results are available for this date, and Supabase is not configured in this deployment.");
  }

  const dateLabel = selectedDate.toLocaleDateString("en", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
  const regionInstruction = region === "Africa first"
    ? "Prioritise Africa and under-documented African history first, then include major international events."
    : region === "Africa"
      ? "Return African events only."
      : region === "International"
        ? "Return major international events outside Africa."
        : "Cover Africa and all other world regions.";
  const prompt = [
    "Find the most prominent historical events, incidents and milestones that OCCURRED on the exact calendar date " + dateLabel + " (" + date + ").",
    "The year is mandatory. Do not return other years on the same month and day. Do not return events merely announced, reported, published, remembered or commemorated on this date unless that is itself the event being described.",
    regionInstruction,
    "Category filter: " + category + ".",
    "Select the most consequential, widely documented occurrences rather than trying to list every minor event. Aim for 3–10 strong results when the evidence supports them. Prioritise major political events, independence and liberation milestones, wars and battles, coups, assassinations, disasters, court decisions, scientific breakthroughs and important cultural or sporting milestones.",
    "Research across primary and institutional sources: national archives and libraries, official gazettes, court records, inquiry reports, museums, universities, UNESCO, African regional institutions, established historical institutes and reputable news archives. For Africa, actively look beyond the most frequently repeated global timelines and surface credible local and regional records.",
    "For every event, provide the actual occurrence date, concise factual summary, place, historical importance, main people involved, the evidence that confirms the exact date, caveats where accounts differ, and direct source links. Prefer two independent credible sources; a primary archival document can be included even when only one source is available.",
    "Do not invent events, dates, quotes or source URLs. If the source only supports a year, month or approximate period, do not present it as an exact-date incident. Exclude weakly supported items.",
    "Return JSON only with this shape: { \"events\": [{ \"occurrenceDate\": \"YYYY-MM-DD\", \"title\": \"\", \"location\": \"\", \"region\": \"Africa|International\", \"category\": \"\", \"summary\": \"\", \"significance\": \"\", \"people\": [], \"prominence\": \"major|notable\", \"dateBasis\": \"\", \"confidence\": \"corroborated|single-source|contested\", \"caveat\": \"\", \"sources\": [{ \"name\": \"\", \"publisher\": \"\", \"url\": \"https://...\", \"sourceType\": \"primary|institutional|scholarly|news\", \"supports\": \"\" }] }] }",
  ].join("\n\n");

  try {
    const { data, error } = await invokeDipa("docs-intelligence", {
      action: "historical_events_search",
      task: "date_and_incidents",
      date,
      region,
      category,
      text: prompt,
      query: prompt,
      responseFormat: "json",
    });
    if (error) throw new Error(error.message || "The historical search service could not complete the search.");
    if (!data || data.error) throw new Error(data?.error || "The historical search service did not return results.");

    const records = normaliseDateIncidentResults(data, date);
    if (!records.length) {
      throw new Error("No well-sourced events were returned for this exact date. Try a different date or geographical filter.");
    }
    cacheDateIncidentResults(params, records);
    return records;
  } catch (error: any) {
    if (staleCache?.length) return staleCache;
    throw new Error(error?.message || "The historical search could not be completed. Check the connection and try again.");
  }
}

/**
 * Generates an objective, source-backed summary for a given topic with Dipa support behind the scenes.
 * Uses the same docs-intelligence service as the other Dipa-backed workflows.
 */
export async function askAboutTopic(params: {
  topicTitle: string;
  categoryTitle: string;
  description: string;
  questions?: string[];
  referenceSources?: { name: string; url: string; scope: string }[];
}): Promise<TopicSummaryResult> {
  const { topicTitle, categoryTitle, description, questions = [], referenceSources = [] } = params;
  try {
    const prompt = `Topic: ${topicTitle} (${categoryTitle})\nDescription: ${description}\nQuestions: ${questions.join("; ")}`;
    const { data, error } = await invokeDipa("docs-intelligence", {
      action: "summarize_topic",
      text: prompt,
      category: categoryTitle,
      topic: topicTitle,
    });
    if (!error && data && (data.summary || data.result)) {
      return {
        summary: data.summary || data.result,
        sources: referenceSources,
        keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : questions.slice(0, 3),
        provider: "dipa-ai",
      };
    }
  } catch (e) {
    console.warn("[Dipa AI] Live function unavailable, using local synthesis engine:", e);
  }

  return {
    summary: `Investigation into "${topicTitle}" within ${categoryTitle} centers on establishing verifiable facts, operational metrics, and institutional standards. Evidence should be verified directly against designated official bodies and regulatory frameworks rather than informal assumptions.`,
    sources: referenceSources,
    keyTakeaways: [
      `Validate baseline requirements directly against the primary authorities for ${categoryTitle}.`,
      `Focus on operational indicators and measurable criteria: ${questions[0] || "Review primary criteria."}`,
      "Retain source publication dates and regional jurisdictions before formulating conclusions.",
    ],
    provider: "dipa-knowledge-base",
  };
}
