import { beforeEach, describe, expect, it } from "vitest";
import { setWorkspaceUser } from "@/lib/workspace/scope";
import { cacheCompassResearchResults, compassTokens, readCompassResearchCache, scoreCompassPathway, type KnowledgePathway } from "@/lib/infoDiscovery/knowledgeCompass";

const africanHistoryPathway: KnowledgePathway = {
  id: "african-history",
  subject: "Culture and history",
  situation: "You want to explore African history through African-centred scholarship rather than relying on accounts that begin with colonial rule.",
  materialType: "Book",
  title: "The African Origin of Civilization: Myth or Reality",
  creator: "Cheikh Anta Diop",
  why: "Presents influential arguments about African antiquity and historical identity.",
  keywords: ["African history", "Ghana", "West Africa", "independence"],
};

describe("Knowledge Compass search", () => {
  beforeEach(() => {
    localStorage.clear();
    setWorkspaceUser(null);
  });
  it("splits multi-word labels into individual searchable tokens", () => {
    expect(compassTokens("African history")).toEqual(["african", "history"]);
  });

  it("matches a multi-word subject label to curated pathways", () => {
    expect(scoreCompassPathway(africanHistoryPathway, "African history")).toBeGreaterThan(0);
  });

  it("matches expanded intent phrases such as starting a business", () => {
    const businessPathway: KnowledgePathway = {
      id: "entrepreneurship",
      subject: "Business and income",
      situation: "You have an idea and want to understand how to test whether people will actually pay for it before investing heavily.",
      materialType: "Book",
      title: "The Mom Test",
      creator: "Rob Fitzpatrick",
      why: "Shows how to ask customers useful questions when validating an idea.",
      keywords: ["entrepreneurship", "business idea", "startup", "customers"],
    };
    expect(scoreCompassPathway(businessPathway, "start a business")).toBeGreaterThan(0);
  });

  it("normalises punctuation and accented characters without merging words", () => {
    expect(compassTokens("Culture & identité")).toEqual(["culture", "identite"]);
  });

  it("caches live research matches locally using a normalised query", () => {
    const records = [{ id: "crossref:1", title: "African history research" }];
    cacheCompassResearchResults("  African   history ", records, 1_000);

    expect(readCompassResearchCache("african history", 2_000)).toEqual(records);
  });

  it("does not return expired local research matches", () => {
    cacheCompassResearchResults("African history", [{ id: "crossref:1" }], 1_000);

    expect(readCompassResearchCache("African history", 50_000, 1_000)).toBeNull();
  });

  it("returns no score for an empty query", () => {
    expect(scoreCompassPathway(africanHistoryPathway, "   ")).toBe(0);
  });
});
