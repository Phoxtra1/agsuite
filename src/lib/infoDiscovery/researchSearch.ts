/**
 * Read-only adapters for public scholarly and repository metadata.
 * These adapters discover records; they do not certify research quality or
 * imply that a file is open access merely because its metadata is visible.
 */

export type ResearchRecord = {
  id: string;
  title: string;
  doi?: string;
  url?: string;
  year?: number;
  authors: string;
  publisher: string;
  journal: string;
  abstract: string;
  type: string;
  sources: string[];
  openAccess?: boolean;
  subjects: string[];
  verificationStatus: "metadata-only";
  verificationNote: string;
};

export type ResearchSearchResult = {
  records: ResearchRecord[];
  sourceErrors: { source: string; message: string }[];
};

type CrossrefWork = {
  DOI?: string; title?: string[]; author?: { given?: string; family?: string }[];
  "container-title"?: string[]; publisher?: string; URL?: string; type?: string;
  published?: { "date-parts"?: number[][] }; issued?: { "date-parts"?: number[][] };
  abstract?: string; subject?: string[];
};

type OpenAlexWork = {
  id?: string; doi?: string | null; display_name?: string; publication_year?: number;
  authorships?: { author?: { display_name?: string } }[];
  primary_location?: { landing_page_url?: string; source?: { display_name?: string } };
  open_access?: { is_oa?: boolean };
  type?: string; abstract_inverted_index?: Record<string, number[]> | null;
  keywords?: { display_name?: string }[];
};

type ZenodoRecord = {
  id?: number; doi?: string; conceptdoi?: string; metadata?: {
    title?: string; description?: string; publication_date?: string;
    creators?: { name?: string }[]; publisher?: string; resource_type?: { title?: string };
    access_right?: string; keywords?: string[];
  };
  links?: { html?: string; self_html?: string };
};

function cleanText(value?: string): string {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function abstractFromIndex(index?: Record<string, number[]> | null): string {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) words[position] = word;
  }
  return cleanText(words.join(" ")).slice(0, 900);
}

function normaliseDoi(value?: string | null): string {
  return (value || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim().toLowerCase();
}

function deduplicate(records: ResearchRecord[]): ResearchRecord[] {
  const byKey = new Map<string, ResearchRecord>();
  for (const record of records) {
    const key = record.doi ? "doi:" + normaliseDoi(record.doi) : "title:" + record.title.toLocaleLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, record);
      continue;
    }
    existing.sources = Array.from(new Set([...existing.sources, ...record.sources]));
    if (!existing.abstract && record.abstract) existing.abstract = record.abstract;
    if (!existing.publisher && record.publisher) existing.publisher = record.publisher;
    if (!existing.url && record.url) existing.url = record.url;
    if (existing.openAccess === undefined) existing.openAccess = record.openAccess;
    existing.subjects = Array.from(new Set([...existing.subjects, ...record.subjects]));
  }
  return Array.from(byKey.values());
}

async function searchCrossref(query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const fields = "DOI,title,author,published,issued,publisher,URL,type,container-title,abstract,subject";
  const url = "https://api.crossref.org/works?query.bibliographic=" + encodeURIComponent(query) + "&rows=8&select=" + fields;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const items: CrossrefWork[] = payload?.message?.items || [];
  return items.filter(item => item.title?.[0]).map(item => {
    const date = item.published?.["date-parts"]?.[0] || item.issued?.["date-parts"]?.[0] || [];
    return {
      id: "crossref:" + (item.DOI || item.URL || item.title?.[0]),
      title: cleanText(item.title?.[0]) || "Untitled record",
      doi: item.DOI,
      url: item.URL || (item.DOI ? "https://doi.org/" + item.DOI : undefined),
      year: date[0],
      authors: (item.author || []).slice(0, 5).map(a => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean).join(", "),
      publisher: item.publisher || "Publisher not supplied",
      journal: item["container-title"]?.[0] || "",
      abstract: cleanText(item.abstract).slice(0, 900),
      type: item.type || "Research output",
      sources: ["Crossref"],
      subjects: (item.subject || []).slice(0, 8),
      verificationStatus: "metadata-only",
      verificationNote: "Crossref registration confirms deposited metadata only; verify the publisher record, methods, corrections and access rights.",
    };
  });
}

async function searchOpenAlex(query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const params = new URLSearchParams({
    search: query, "per-page": "8",
    select: "id,doi,display_name,publication_year,authorships,primary_location,open_access,type,abstract_inverted_index,keywords",
  });
  const response = await fetch("https://api.openalex.org/works?" + params.toString(), {
    signal, headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const items: OpenAlexWork[] = payload?.results || [];
  return items.filter(item => item.display_name).map(item => ({
    id: item.id || "openalex:" + item.display_name,
    title: cleanText(item.display_name),
    doi: normaliseDoi(item.doi) || undefined,
    url: item.primary_location?.landing_page_url || item.doi || item.id,
    year: item.publication_year,
    authors: (item.authorships || []).slice(0, 5).map(a => a.author?.display_name).filter(Boolean).join(", "),
    publisher: item.primary_location?.source?.display_name || "Publisher not supplied",
    journal: item.primary_location?.source?.display_name || "",
    abstract: abstractFromIndex(item.abstract_inverted_index),
    type: item.type || "Scholarly work",
    sources: ["OpenAlex"],
    openAccess: item.open_access?.is_oa,
    subjects: (item.keywords || []).map(k => k.display_name).filter(Boolean).slice(0, 8),
    verificationStatus: "metadata-only",
    verificationNote: "OpenAlex is a discovery index; confirm bibliographic details, publisher status, corrections and full-text rights at the original record.",
  }));
}

async function searchPubMed(query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const searchParams = new URLSearchParams({ db: "pubmed", term: query, retmode: "json", retmax: "8" });
  const searchResponse = await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?" + searchParams, {
    signal, headers: { Accept: "application/json" },
  });
  if (!searchResponse.ok) throw new Error("Search HTTP " + searchResponse.status);
  const searchPayload = await searchResponse.json();
  const ids: string[] = searchPayload?.esearchresult?.idlist || [];
  if (!ids.length) return [];
  const summaryParams = new URLSearchParams({ db: "pubmed", id: ids.join(","), retmode: "json" });
  const summaryResponse = await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?" + summaryParams, {
    signal, headers: { Accept: "application/json" },
  });
  if (!summaryResponse.ok) throw new Error("Record lookup HTTP " + summaryResponse.status);
  const summaryPayload = await summaryResponse.json();
  return ids.map(id => summaryPayload?.result?.[id]).filter((item: any) => item?.title).map((item: any) => {
    const doi = item.articleids?.find((identifier: any) => identifier.idtype === "doi")?.value;
    return {
      id: "pubmed:" + id,
      title: cleanText(item.title),
      doi: doi ? normaliseDoi(doi) : undefined,
      url: "https://pubmed.ncbi.nlm.nih.gov/" + id + "/",
      year: Number(String(item.pubdate || "").match(/\\b(19|20)\\d{2}\\b/)?.[0]) || undefined,
      authors: (item.authors || []).slice(0, 5).map((author: any) => author.name).filter(Boolean).join(", "),
      publisher: item.fulljournalname || "PubMed indexed journal",
      journal: item.fulljournalname || "",
      abstract: "",
      type: (item.pubtype || ["Biomedical publication"]).join(", "),
      sources: ["PubMed"],
      subjects: [],
      verificationStatus: "metadata-only",
      verificationNote: "PubMed indexing is a bibliographic discovery signal, not a quality guarantee. Check the journal, article version, corrections and full text.",
    };
  });
}

async function searchEuropePmc(query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const params = new URLSearchParams({ query, format: "json", pageSize: "8", resultType: "core" });
  const response = await fetch("https://www.ebi.ac.uk/europepmc/webservices/rest/search?" + params, {
    signal, headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const items = payload?.resultList?.result || [];
  return items.filter((item: any) => item.title).map((item: any) => ({
    id: "europepmc:" + (item.id || item.doi || item.title),
    title: cleanText(item.title),
    doi: item.doi ? normaliseDoi(item.doi) : undefined,
    url: item.doi ? "https://doi.org/" + normaliseDoi(item.doi) : item.pmid ? "https://pubmed.ncbi.nlm.nih.gov/" + item.pmid + "/" : "https://europepmc.org/article/" + item.source + "/" + item.id,
    year: Number(String(item.firstPublicationDate || "").slice(0, 4)) || undefined,
    authors: cleanText(item.authorString),
    publisher: item.journalTitle || "Europe PMC indexed source",
    journal: item.journalTitle || "",
    abstract: cleanText(item.abstractText).slice(0, 900),
    type: item.pubType || "Life-sciences publication",
    sources: ["Europe PMC"],
    openAccess: item.isOpenAccess === "Y",
    subjects: [],
    verificationStatus: "metadata-only",
    verificationNote: "Europe PMC provides literature discovery and metadata; confirm the original publisher, version, corrections and reuse licence.",
  }));
}

async function searchZenodo(query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const params = new URLSearchParams({ q: query, size: "8", sort: "bestmatch" });
  const response = await fetch("https://zenodo.org/api/records/?" + params.toString(), {
    signal, headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const items: ZenodoRecord[] = payload?.hits?.hits || [];
  return items.filter(item => item.metadata?.title).map(item => {
    const metadata = item.metadata || {};
    const doi = normaliseDoi(item.doi || item.conceptdoi);
    return {
      id: "zenodo:" + (item.id || doi || metadata.title),
      title: cleanText(metadata.title),
      doi: doi || undefined,
      url: item.links?.html || item.links?.self_html || (doi ? "https://doi.org/" + doi : undefined),
      year: metadata.publication_date ? Number(metadata.publication_date.slice(0, 4)) : undefined,
      authors: (metadata.creators || []).slice(0, 5).map(creator => creator.name).filter(Boolean).join(", "),
      publisher: metadata.publisher || "Zenodo repository record",
      journal: "",
      abstract: cleanText(metadata.description).slice(0, 900),
      type: metadata.resource_type?.title || "Repository record",
      sources: ["Zenodo"],
      openAccess: metadata.access_right === "open",
      subjects: (metadata.keywords || []).slice(0, 8),
      verificationStatus: "metadata-only",
      verificationNote: "Zenodo record metadata identifies a deposited research output; check its file-level licence, version, provenance and contents before reuse.",
    };
  });
}

export async function searchResearchRepositories(
  query: string,
  signal: AbortSignal,
): Promise<ResearchSearchResult> {
  const providers = [
    { name: "Crossref", search: searchCrossref },
    { name: "OpenAlex", search: searchOpenAlex },
    { name: "Zenodo", search: searchZenodo },
    { name: "PubMed", search: searchPubMed },
    { name: "Europe PMC", search: searchEuropePmc },
  ];
  const settled = await Promise.allSettled(providers.map(provider => provider.search(query, signal)));
  if (signal.aborted) throw new DOMException("Search cancelled", "AbortError");
  const records: ResearchRecord[] = [];
  const sourceErrors: ResearchSearchResult["sourceErrors"] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") records.push(...result.value);
    else if ((result.reason as Error)?.name !== "AbortError") {
      sourceErrors.push({ source: providers[index].name, message: (result.reason as Error)?.message || "Request failed" });
    }
  });
  return {
    records: deduplicate(records).slice(0, 18),
    sourceErrors,
  };
}
