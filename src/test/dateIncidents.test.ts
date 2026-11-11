import { describe, expect, it } from "vitest";
import { normaliseDateIncidentResults } from "@/lib/infoDiscovery/askTopic";

const source = (name: string, publisher: string, url: string, supports = "Supports the occurrence date") => ({
  name, publisher, url, sourceType: "institutional", supports,
});

const historicalFixtures = [
  {
    date: "1957-03-06",
    title: "Ghana becomes independent",
    region: "Africa",
    sources: [
      source("Ghana government", "Government of Ghana", "https://presidency.gov.gh/"),
      source("Encyclopaedia Britannica", "Encyclopaedia Britannica", "https://www.britannica.com/place/Ghana"),
    ],
  },
  {
    date: "1963-05-25",
    title: "Organization of African Unity is founded",
    region: "Africa",
    sources: [
      source("African Union", "African Union", "https://au.int/"),
      source("UN Digital Library", "United Nations", "https://digitallibrary.un.org/"),
    ],
  },
  {
    date: "1963-12-12",
    title: "Kenya becomes independent",
    region: "Africa",
    sources: [
      source("Kenya government", "Government of Kenya", "https://www.president.go.ke/"),
      source("Commonwealth", "Commonwealth Secretariat", "https://thecommonwealth.org/"),
    ],
  },
  {
    date: "1990-02-11",
    title: "Nelson Mandela is released from prison",
    region: "Africa",
    sources: [
      source("Nelson Mandela Foundation", "Nelson Mandela Foundation", "https://www.nelsonmandela.org/"),
      source("South African History Archive", "South African History Archive", "https://www.saha.org.za/"),
    ],
  },
  {
    date: "1994-04-07",
    title: "Genocide against the Tutsi begins in Rwanda",
    region: "Africa",
    sources: [
      source("United Nations", "United Nations", "https://www.un.org/en/preventgenocide/rwanda/"),
      source("UN International Residual Mechanism", "United Nations Mechanism", "https://unictr.irmct.org/"),
    ],
  },
  {
    date: "1994-04-27",
    title: "South Africa holds its first democratic election",
    region: "Africa",
    sources: [
      source("Electoral Commission of South Africa", "IEC South Africa", "https://www.elections.org.za/"),
      source("South African Government", "Government of South Africa", "https://www.gov.za/"),
    ],
  },
];

function eventFor(fixture: (typeof historicalFixtures)[number]) {
  return {
    occurrenceDate: fixture.date,
    title: fixture.title,
    location: "Africa",
    region: fixture.region,
    category: "Politics and history",
    summary: "A prominent historical event recorded on the selected date.",
    significance: "A major historical milestone.",
    people: [],
    prominence: "major",
    dateBasis: "Institutional historical record",
    confidence: "corroborated",
    caveat: "",
    sources: fixture.sources,
  };
}

describe("Date & Incidents exact-date results", () => {
  it.each(historicalFixtures)(
    "retains the prominent African event on $date and rejects other dates",
    (fixture) => {
      const expected = eventFor(fixture);
      const results = normaliseDateIncidentResults({
        events: [
          expected,
          { ...expected, occurrenceDate: fixture.date.slice(0, 4) + "-01-01", title: "Wrong date" },
          { ...expected, occurrenceDate: "2000-01-01", title: "Wrong year and date" },
        ],
      }, fixture.date);

      expect(results.map(item => item.title)).toContain(fixture.title);
      expect(results.every(item => item.occurrenceDate === fixture.date)).toBe(true);
    }
  );

  it("prioritises African events ahead of international events", () => {
    const africa = eventFor(historicalFixtures[0]);
    const international = {
      ...africa,
      occurrenceDate: "1957-03-06",
      title: "International event",
      region: "International",
      sources: [
        source("UN", "United Nations", "https://www.un.org/"),
        source("Britannica", "Encyclopaedia Britannica", "https://www.britannica.com/"),
      ],
    };
    const results = normaliseDateIncidentResults({ events: [international, africa] }, "1957-03-06");
    expect(results[0].region).toBe("Africa");
  });

  it("does not label two subdomains of the same institution as independent corroboration", () => {
    const item = {
      ...eventFor(historicalFixtures[1]),
      sources: [
        source("AU main site", "African Union", "https://au.int/"),
        source("AU archive", "African Union archive", "https://archives.au.int/"),
      ],
    };
    const results = normaliseDateIncidentResults({ events: [item] }, "1963-05-25");
    expect(results).toHaveLength(1);
    expect(results[0].confidence).toBe("single-source");
  });

  it("does not present events without source links as researched results", () => {
    const item = eventFor(historicalFixtures[0]);
    expect(normaliseDateIncidentResults({ events: [{ ...item, sources: [] }] }, item.occurrenceDate)).toHaveLength(0);
  });

  it("deduplicates the same event and date", () => {
    const item = eventFor(historicalFixtures[0]);
    const results = normaliseDateIncidentResults({ events: [item, item] }, item.occurrenceDate);
    expect(results).toHaveLength(1);
  });
});
