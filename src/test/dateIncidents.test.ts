import { describe, expect, it } from "vitest";
import { normaliseDateIncidentResults } from "@/lib/infoDiscovery/askTopic";

describe("Date & Incidents exact-date results", () => {
  const source = { name: "National Archives", publisher: "archives.gov", url: "https://archives.gov/record/1", sourceType: "primary", supports: "Confirms occurrence date" };
  const event = {
    occurrenceDate: "1985-01-01",
    title: "A documented historical event",
    location: "Example city",
    region: "Africa",
    category: "Politics",
    summary: "An event summary tied to the selected date.",
    significance: "A consequential historical milestone.",
    people: ["A. Person"],
    prominence: "major",
    dateBasis: "Contemporary official record",
    confidence: "corroborated",
    caveat: "",
    sources: [source, { ...source, name: "Independent archive", publisher: "archive2.gov", url: "https://archive2.gov/record/1" }],
  };

  it("keeps only events that occurred on the exact selected date including year", () => {
    const results = normaliseDateIncidentResults({
      events: [event, { ...event, occurrenceDate: "1995-01-01", title: "Different year" }, { ...event, occurrenceDate: "1985-01-02", title: "Different day" }],
    }, "1985-01-01");

    expect(results).toHaveLength(1);
    expect(results[0].occurrenceDate).toBe("1985-01-01");
    expect(results[0].title).toBe("A documented historical event");
  });

  it("does not present events without source links as researched results", () => {
    const results = normaliseDateIncidentResults({
      events: [{ ...event, sources: [] }],
    }, "1985-01-01");

    expect(results).toHaveLength(0);
  });

  it("deduplicates the same event and date", () => {
    const results = normaliseDateIncidentResults({ events: [event, event] }, "1985-01-01");
    expect(results).toHaveLength(1);
  });
});
