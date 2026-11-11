import { afterEach, describe, expect, it, vi } from "vitest";
import { searchResearchRepositories } from "@/lib/infoDiscovery/researchSearch";
import { DISCOVERY_SOURCES, KNOWLEDGE_SUBJECTS, findRelatedSubjects } from "@/lib/infoDiscovery/sourceRegistry";
import { validateDiscoveryRecordDraft, validateDiscoveryReview } from "@/lib/infoDiscovery/sourceReview";

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
  text: async () => "<?xml version=\"1.0\"?><feed xmlns=\"http://www.w3.org/2005/Atom\"></feed>",
}) as Response;

describe("Info Discovery source foundation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("registers institutional, specialist and research repository sources with explicit review status", () => {
    expect(DISCOVERY_SOURCES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(DISCOVERY_SOURCES.map(source => source.id)).size).toBe(DISCOVERY_SOURCES.length);
    expect(new Set(KNOWLEDGE_SUBJECTS.map(subject => subject.id)).size).toBe(KNOWLEDGE_SUBJECTS.length);
    expect(DISCOVERY_SOURCES.some(source => source.id === "ghana-statistical-service")).toBe(true);
    expect(DISCOVERY_SOURCES.some(source => source.id === "pubmed")).toBe(true);
    expect(DISCOVERY_SOURCES.some(source => source.id === "zenodo")).toBe(true);
    expect(DISCOVERY_SOURCES.some(source => source.id === "ugspace")).toBe(true);
    expect(DISCOVERY_SOURCES.some(source => source.id === "knustspace")).toBe(true);
    expect(DISCOVERY_SOURCES.some(source => source.id === "ucc-ir")).toBe(true);
    expect(DISCOVERY_SOURCES.some(source => source.id === "openaire-graph")).toBe(true);
    expect(DISCOVERY_SOURCES.every(source => source.recordLevelVerificationRequired)).toBe(true);
    expect(DISCOVERY_SOURCES.every(source => source.reviewStatus === "listed-pending-record-review")).toBe(true);
  });

  it("traverses related knowledge subjects across connected disciplines", () => {
    const related = findRelatedSubjects(["education"]).map(subject => subject.id);
    expect(related).toContain("skills");
    expect(related).toContain("employment");
    expect(related).toContain("occupations");
    expect(related.length).toBeLessThan(KNOWLEDGE_SUBJECTS.length);
    expect(KNOWLEDGE_SUBJECTS.some(subject => subject.id === "education")).toBe(true);
  });

  it("searches multiple repositories and merges duplicate DOI records", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ message: { items: [{
        DOI: "10.1234/example", title: ["A verified-looking title"], author: [{ given: "A", family: "Researcher" }],
        publisher: "Example Publisher", URL: "https://publisher.example/article",
        published: { "date-parts": [[2024]] }, type: "journal-article", subject: ["education"],
      }] } }))
      .mockResolvedValueOnce(jsonResponse({ results: [{
        id: "https://openalex.org/W123", doi: "https://doi.org/10.1234/example",
        display_name: "A verified-looking title", publication_year: 2024,
        authorships: [{ author: { display_name: "A Researcher" } }],
        primary_location: { landing_page_url: "https://publisher.example/article", source: { display_name: "Example Journal" } },
        open_access: { is_oa: true }, type: "article", keywords: [{ display_name: "education" }],
      }] }))
      .mockResolvedValueOnce(jsonResponse({ hits: { hits: [] } }))
      .mockResolvedValueOnce(jsonResponse({ esearchresult: { idlist: [] } }))
      .mockResolvedValueOnce(jsonResponse({ resultList: { result: [] } }))
      .mockResolvedValueOnce(jsonResponse({ results: [] }))
      .mockResolvedValueOnce(jsonResponse({ results: [] }))
      .mockResolvedValueOnce(jsonResponse({ _embedded: { searchResult: { _embedded: { objects: [] } } } }))
      .mockResolvedValueOnce(jsonResponse({ _embedded: { searchResult: { _embedded: { objects: [] } } } }))
      .mockResolvedValueOnce(jsonResponse({ _embedded: { searchResult: { _embedded: { objects: [] } } } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchResearchRepositories("education policy", new AbortController().signal);
    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(result.sourceErrors).toHaveLength(0);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].sources).toEqual(expect.arrayContaining(["Crossref", "OpenAlex"]));
    expect(result.records[0].verificationStatus).toBe("metadata-only");
  });

  it("preserves PubMed identifiers when mapping record summaries", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("esearch.fcgi")) return jsonResponse({ esearchresult: { idlist: ["12345678", "99999999"] } });
      if (url.includes("esummary.fcgi")) return jsonResponse({ result: {
        "12345678": { title: "Health research", pubdate: "2024 Jan", articleids: [], authors: [] },
      } });
      return jsonResponse({});
    }));

    const result = await searchResearchRepositories("health", new AbortController().signal);
    expect(result.sourceErrors).toHaveLength(0);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe("pubmed:12345678");
    expect(result.records[0].url).toBe("https://pubmed.ncbi.nlm.nih.gov/12345678/");
    expect(result.records[0].year).toBe(2024);
  });

  it("returns available records when one repository is unavailable", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ message: { items: [] } }))
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(jsonResponse({ hits: { hits: [{
        id: 12, doi: "10.5281/zenodo.12", metadata: {
          title: "Open research dataset", description: "A dataset record",
          publication_date: "2023-05-01", creators: [{ name: "Researcher" }],
          access_right: "open", keywords: ["climate"],
          resource_type: { title: "Dataset" },
        }, links: { html: "https://zenodo.org/records/12" },
      }] } }))
      .mockResolvedValueOnce(jsonResponse({ esearchresult: { idlist: [] } }))
      .mockResolvedValueOnce(jsonResponse({ resultList: { result: [] } }))
      .mockResolvedValueOnce(jsonResponse({ results: [] }))
      .mockResolvedValueOnce(jsonResponse({ results: [] }))
      .mockResolvedValueOnce(jsonResponse({ _embedded: { searchResult: { _embedded: { objects: [] } } } }))
      .mockResolvedValueOnce(jsonResponse({ _embedded: { searchResult: { _embedded: { objects: [] } } } }))
      .mockResolvedValueOnce(jsonResponse({ _embedded: { searchResult: { _embedded: { objects: [] } } } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchResearchRepositories("climate data", new AbortController().signal);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].title).toBe("Open research dataset");
    expect(result.records[0].openAccess).toBe(true);
    expect(result.sourceErrors).toEqual([{ source: "OpenAlex", message: "network unavailable" }]);
  });
  
  it("requires a source, stable original URL and valid bibliographic identifiers at intake", () => {
    const base = {
      title: "Research publication",
      authors: ["A. Researcher"],
      publicationYear: 2024,
      publisher: "University Press",
      containerTitle: "",
      doi: "10.1234/example",
      canonicalUrl: "https://repository.example/items/123",
      sourceId: "example-repository",
      sourceName: "Example Repository",
      abstract: "",
      materialType: "thesis",
      subjects: ["education"],
      jurisdiction: "Ghana",
      accessStatus: "unknown" as const,
      license: "",
      rightsBasis: "",
      fullTextUrl: "",
    };
    expect(validateDiscoveryRecordDraft(base)).toEqual([]);
    expect(validateDiscoveryRecordDraft({ ...base, canonicalUrl: "javascript:alert(1)" })).toContain("The original record URL must be a valid HTTP or HTTPS address.");
    expect(validateDiscoveryRecordDraft({ ...base, doi: "not-a-doi" })).toContain("The DOI does not appear to be valid.");
  });

  it("requires all evidence and a rights basis before editorial verification", () => {
    const incomplete = {
      bibliographicDetailsChecked: true,
      originalSourceChecked: false,
      versionAndCorrectionsChecked: true,
      rightsAndAccessChecked: false,
      jurisdictionAndPublicationDateChecked: false,
      findingsAndLegalStatusChecked: false,
      reviewNote: "",
      rightsBasis: "",
    };
    expect(validateDiscoveryReview(incomplete)).toHaveLength(6);
    expect(validateDiscoveryReview({
      ...incomplete,
      originalSourceChecked: true,
      rightsAndAccessChecked: true,
      jurisdictionAndPublicationDateChecked: true,
      findingsAndLegalStatusChecked: true,
      reviewNote: "Checked the issuing institution record and licence.",
      rightsBasis: "Institutional repository licence permits public access.",
    })).toEqual([]);
  });

});
