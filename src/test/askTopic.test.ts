import { describe, it, expect } from "vitest";
import { askAboutTopic } from "@/lib/infoDiscovery/askTopic";

describe("Ask About Topic Service with Dipa AI", () => {
  it("generates a structured topic summary with key takeaways and sources", async () => {
    const res = await askAboutTopic({
      topicTitle: "Database design and management",
      categoryTitle: "IT and Innovation",
      description: "Understand data modelling, query performance, and backups.",
      questions: ["Which data must be stored and for how long?", "Are indexes aligned with queries?"],
      referenceSources: [
        { name: "NIST", url: "https://nist.gov", scope: "Cybersecurity" },
      ],
    });

    expect(res).toBeDefined();
    expect(res.summary).toContain("Database design and management");
    expect(res.summary).toContain("IT and Innovation");
    expect(res.keyTakeaways.length).toBeGreaterThan(0);
    expect(res.sources.length).toBe(1);
    expect(res.sources[0].name).toBe("NIST");
  });
});
