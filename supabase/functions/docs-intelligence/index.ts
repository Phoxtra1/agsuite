import {
  cleanModelJson,
  isExactISODate,
  isHttpUrl,
  publisherFromUrl,
} from "./historicalEvents.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const action = String(body.action || "");
  if (action !== "historical_events_search") {
    return jsonResponse({ error: "Unsupported docs-intelligence action." }, 400);
  }

  const date = String(body.date || "").trim();
  const region = String(body.region || "Africa first").slice(0, 40);
  const category = String(body.category || "all").slice(0, 80);
  if (!isExactISODate(date)) {
    return jsonResponse({ error: "A valid exact date including year is required." }, 400);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_GEMINI_API_KEY") || "";
  if (!apiKey) {
    return jsonResponse({ error: "The historical research service is not configured. Add GEMINI_API_KEY to Supabase Edge Function secrets." }, 503);
  }

  try {
    const dateLabel = new Date(date + "T00:00:00Z").toLocaleDateString("en", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    const regionInstruction = region === "Africa first"
      ? "Prioritise African events and under-documented African history, then include major international events."
      : region === "Africa"
        ? "Return African events only."
        : region === "International"
          ? "Return major international events outside Africa."
          : "Cover Africa and all world regions.";

    const prompt = [
      "Research prominent historical events that OCCURRED on the exact date " + dateLabel + " (" + date + ").",
      "The year is mandatory. Exclude all events from other years, even if they occurred on the same month and day. Exclude events only announced, published, reported, commemorated or remembered on this date unless that act itself is the event.",
      regionInstruction,
      "Category: " + category + ". Select only consequential, well-documented events, not minor trivia. Aim for 3 to 10 events where credible records exist. Include major political events, independence, wars and battles, coups, assassinations, disasters, court decisions, scientific breakthroughs, and major cultural or sporting milestones.",
      "Search for African records actively, including national archives, national libraries, official gazettes, museums, university research, UNESCO, African regional bodies and reputable African news archives. Search globally for international events too.",
      "For each event provide the actual occurrence date, title, location, region, category, factual summary, significance, key people, evidence confirming the exact occurrence date, and any caveat about disputed accounts.",
      "Use Google Search grounding. Use only sources actually present in groundingChunks. sourceIndexes must refer to the zero-based indexes of the groundingChunks that support that event. Do not invent URLs or use a search result's publication date as the occurrence date.",
      "Return JSON only: {events:[{occurrenceDate:'YYYY-MM-DD',title:string,location:string,region:'Africa'|'International',category:string,summary:string,significance:string,people:string[],prominence:'major'|'notable',dateBasis:string,sourceIndexes:number[],confidence:'corroborated'|'single-source'|'contested',caveat:string}]}. If you cannot establish the exact occurrence date, omit the event. Do not pad results.",
    ].join("\n\n");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 8192 },
        }),
        signal: AbortSignal.timeout(55_000),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error("Historical research provider returned HTTP " + response.status + ": " + detail.slice(0, 250));
    }

    const ai = await response.json();
    const candidate = ai.candidates?.[0];
    const raw = (candidate?.content?.parts || []).map((part: { text?: string }) => part.text || "").join("");
    let parsed: { events?: Array<Record<string, unknown>> };
    try {
      parsed = JSON.parse(cleanModelJson(raw));
    } catch {
      throw new Error("Historical research returned an invalid structured result.");
    }

    const chunks = Array.isArray(candidate?.groundingMetadata?.groundingChunks)
      ? candidate.groundingMetadata.groundingChunks
      : [];
    const events = (Array.isArray(parsed.events) ? parsed.events : []).slice(0, 12).map((item) => {
      const indexes = Array.isArray(item.sourceIndexes)
        ? [...new Set(item.sourceIndexes.map(Number).filter((index) =>
          Number.isInteger(index) && index >= 0 && index < chunks.length
        ))]
        : [];
      const sources = indexes.map((index) => {
        const web = chunks[index]?.web;
        if (!web?.uri || !isHttpUrl(web.uri)) return null;
        const publisher = publisherFromUrl(web.uri);
        return {
          name: String(web.title || publisher || "Historical source"),
          publisher,
          url: web.uri,
          sourceType: "Google Search result",
          supports: "Retrieved as a supporting source for this event",
        };
      }).filter(Boolean).slice(0, 6);

      if (
        String(item.occurrenceDate || "") !== date ||
        !String(item.title || "").trim() ||
        !String(item.summary || "").trim() ||
        !sources.length
      ) return null;

      const publishers = new Set(sources.map((source) => source.publisher).filter(Boolean));
      return {
        occurrenceDate: date,
        title: String(item.title).slice(0, 240),
        location: String(item.location || "Location not established").slice(0, 180),
        region: item.region === "Africa" ? "Africa" : "International",
        category: String(item.category || "Historical event").slice(0, 80),
        summary: String(item.summary).slice(0, 1800),
        significance: String(item.significance || "").slice(0, 900),
        people: Array.isArray(item.people) ? item.people.slice(0, 12).map((person) => String(person).slice(0, 100)) : [],
        prominence: item.prominence === "major" ? "major" : "notable",
        dateBasis: String(item.dateBasis || "").slice(0, 500),
        confidence: item.confidence === "contested" ? "contested" : publishers.size >= 2 ? "corroborated" : "single-source",
        caveat: String(item.caveat || "").slice(0, 600),
        sources,
      };
    }).filter(Boolean);

    events.sort((a, b) =>
      a.region === b.region
        ? (a.prominence === b.prominence ? a.title.localeCompare(b.title) : a.prominence === "major" ? -1 : 1)
        : a.region === "Africa" ? -1 : 1
    );

    return jsonResponse({ events, date, count: events.length });
  } catch (error) {
    console.error("[docs-intelligence] historical_events_search:", error);
    return jsonResponse({ error: (error as Error)?.message || "Historical event research failed." }, 502);
  }
});
