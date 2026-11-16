import { beforeEach, describe, expect, it } from "vitest";
import {
  cacheDateIncidentResults,
  readCachedDateIncidentResults,
  type DateIncidentRecord,
} from "@/lib/infoDiscovery/askTopic";

const record: DateIncidentRecord = {
  occurrenceDate: "1957-03-06",
  title: "Ghana becomes independent",
  location: "Accra, Gold Coast",
  region: "Africa",
  category: "Politics and independence",
  summary: "Ghana becomes an independent state.",
  significance: "A major milestone in African decolonisation.",
  people: ["Kwame Nkrumah"],
  prominence: "major",
  dateBasis: "The event occurred on 6 March 1957.",
  confidence: "single-source",
  caveat: "",
  sources: [{ name: "Example archive", url: "https://example.org/record", publisher: "Example", sourceType: "archive", supports: "Date and event" }],
};

describe("Date & Incidents local cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves results for the same date and filters", () => {
    const params = { date: "1957-03-06", region: "Africa first" as const, category: "all" };
    cacheDateIncidentResults(params, [record], 1_000);

    expect(readCachedDateIncidentResults(params, 86_400_000, 2_000)).toEqual([record]);
    expect(readCachedDateIncidentResults({ ...params, region: "International" }, 86_400_000, 2_000)).toBeNull();
  });

  it("does not treat expired entries as fresh", () => {
    const params = { date: "1957-03-06", region: "Africa first" as const, category: "all" };
    cacheDateIncidentResults(params, [record], 1_000);

    expect(readCachedDateIncidentResults(params, 500, 2_000)).toBeNull();
    expect(readCachedDateIncidentResults(params, Number.POSITIVE_INFINITY, 2_000)).toEqual([record]);
  });

  it("keeps the feature usable when browser storage is malformed", () => {
    localStorage.setItem("amineva_date_incidents_cache_v1::anon", "{invalid");
    expect(readCachedDateIncidentResults({ date: "1957-03-06" })).toBeNull();
  });
});
