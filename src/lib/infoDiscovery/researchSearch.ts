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
  verificationStatus: "metadata-only" | "editorially-verified";
  verificationNote: string;
  accessStatus?: "metadata_only" | "open_access" | "restricted" | "unknown";
  license?: string;
  fullTextUrl?: string;
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
  return ids.map(id => ({ id, item: summaryPayload?.result?.[id] }))
    .filter(({ item }) => item?.title).map(({ id, item }) => {
    const doi = item.articleids?.find((identifier: any) => identifier.idtype === "doi")?.value;
    return {
      id: "pubmed:" + id,
      title: cleanText(item.title),
      doi: doi ? normaliseDoi(doi) : undefined,
      url: "https://pubmed.ncbi.nlm.nih.gov/" + id + "/",
      year: Number(String(item.pubdate || "").match(/\b(19|20)\d{2}\b/)?.[0]) || undefined,
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


type OpenAireItem = Record<string, any>;

function valueText(value: any): string {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return cleanText(String(value));
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(", ");
  return cleanText(value.value || value.name || value.fullName || value.fullname || value.label || value.text || "");
}

function findDoi(item: any): string | undefined {
  const candidates = [
    item?.doi, item?.DOI, item?.pid, item?.pids, item?.identifiers,
    ...(Array.isArray(item?.instances) ? item.instances.flatMap((instance: any) => instance?.pids || instance?.identifiers || []) : []),
  ];
  const flattened = candidates.flat(Infinity);
  for (const candidate of flattened) {
    const scheme = String(candidate?.scheme || candidate?.type || candidate?.idType || "").toLowerCase();
    const raw = typeof candidate === "string" ? candidate : candidate?.value || candidate?.id || "";
    if ((scheme === "doi" || /^10\.\d{4,9}\//i.test(String(raw))) && raw) return normaliseDoi(String(raw));
  }
  return undefined;
}

async function searchOpenAire(query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const params = new URLSearchParams({ search: query, type: "publication", page: "1", pageSize: "8" });
  const response = await fetch("https://api.openaire.eu/graph/v3/research-products?" + params.toString(), {
    signal, headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const items: OpenAireItem[] = payload?.results || [];
  return items.map(item => {
    const title = valueText(item.title || item.metadata?.title || item.titles?.[0]);
    const creators = item.authors || item.author || item.creators || item.metadata?.creators || [];
    const authors = (Array.isArray(creators) ? creators : [creators]).map(valueText).filter(Boolean).slice(0, 8).join(", ");
    const publicationDate = valueText(item.publicationDate || item.date || item.metadata?.publicationDate);
    const year = Number(publicationDate.match(/\b(19|20)\d{2}\b/)?.[0]) || undefined;
    const bestRight = valueText(item.bestAccessRight?.label || item.bestAccessRight || item.accessRight?.label || item.accessRight);
    const instances = Array.isArray(item.instances) ? item.instances : [];
    const openInstance = instances.find((instance: any) => /open/i.test(valueText(instance.accessright?.label || instance.accessRight?.label || instance.accessright)));
    const instance = openInstance || instances[0];
    const license = valueText(instance?.license || instance?.licence);
    const doi = findDoi(item);
    const landingUrl = valueText(item.url || item.landingPageUrl || instance?.url?.[0] || instance?.url || item.id);
    const open = /open/i.test(bestRight) || Boolean(openInstance);
    return {
      id: "openaire:" + (valueText(item.id) || doi || title),
      title,
      doi,
      url: landingUrl || (doi ? "https://doi.org/" + doi : undefined),
      year,
      authors,
      publisher: valueText(item.publisher || item.metadata?.publisher || item.datasource?.name) || "OpenAIRE indexed source",
      journal: valueText(item.container?.name || item.journal?.name || item.source?.name),
      abstract: valueText(item.description || item.descriptions?.[0] || item.metadata?.description).slice(0, 900),
      type: valueText(item.type || item.resultType) || "Research publication",
      sources: ["OpenAIRE Graph"],
      openAccess: open,
      subjects: (Array.isArray(item.subjects) ? item.subjects : []).map(valueText).filter(Boolean).slice(0, 8),
      verificationStatus: "metadata-only",
      verificationNote: "OpenAIRE aggregates research metadata from many repositories and publishers. Confirm the source record, version, peer-review status and document licence before relying on or reusing the work.",
      accessStatus: open ? "open_access" : "unknown",
      license: license || undefined,
    };
  }).filter(record => record.title);
}

function xmlText(block: string, tag: string): string {
  const match = block.match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + tag + ">"));
  return cleanText((match?.[1] || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
}

function xmlAttribute(block: string, tag: string, attribute: string): string {
  const tagMatch = block.match(new RegExp("<" + tag + "\\b[^>]*>"));
  const attrMatch = tagMatch?.[0].match(new RegExp(attribute + "=\"([^\"]+)\""));
  return (attrMatch?.[1] || "").replace(/&amp;/g, "&");
}

async function searchArxiv(query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const params = new URLSearchParams({ search_query: "all:" + query, start: "0", max_results: "8", sortBy: "relevance" });
  const response = await fetch("https://export.arxiv.org/api/query?" + params.toString(), {
    signal, headers: { Accept: "application/atom+xml, application/xml, text/xml" },
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const xml = await response.text();
  const entries = [...xml.matchAll(/<entry>([\\s\\S]*?)</entry>/g)].map(match => match[1]);
  return entries.map(entry => {
    const title = xmlText(entry, "title");
    const id = xmlText(entry, "id");
    const authors = [...entry.matchAll(/<author>([\\s\\S]*?)</author>/g)].map(match => xmlText(match[1], "name")).filter(Boolean).join(", ");
    const pdfLink = [...entry.matchAll(/<link\\b[^>]*\/>/g)].map(match => match[0]).find(link => /title="pdf"/i.test(link));
    const published = xmlText(entry, "published");
    const categories = [...entry.matchAll(/<category\\b[^>]*term="([^"]+)"/g)].map(match => match[1]);
    return {
      id: "arxiv:" + id,
      title,
      url: id,
      year: Number(published.slice(0, 4)) || undefined,
      authors,
      publisher: "arXiv",
      journal: "",
      abstract: xmlText(entry, "summary").slice(0, 900),
      type: "Preprint",
      sources: ["arXiv"],
      openAccess: true,
      subjects: categories.slice(0, 8),
      verificationStatus: "metadata-only",
      verificationNote: "arXiv records are preprints and may differ from later peer-reviewed publications. Check version history, journal publication and the licence before reuse.",
      accessStatus: "open_access",
      fullTextUrl: pdfLink ? xmlAttribute(pdfLink, "link", "href") : undefined,
    };
  }).filter(record => record.title);
}

type DSpaceRepository = { id: string; name: string; baseUrl: string };
const DSPACE_REPOSITORIES: DSpaceRepository[] = [
  { id: "ugspace", name: "UGSpace Institutional Repository", baseUrl: "https://ugspace.ug.edu.gh" },
  { id: "knustspace", name: "KNUSTSpace", baseUrl: "https://dspace.knust.edu.gh" },
  { id: "ucc-ir", name: "University of Cape Coast Institutional Repository", baseUrl: "https://ir.ucc.edu.gh" },
];

function metadataValues(metadata: any, keys: string[]): string[] {
  for (const key of keys) {
    const raw = metadata?.[key];
    if (raw === undefined || raw === null) continue;
    const values = (Array.isArray(raw) ? raw : [raw]).map((item: any) => valueText(item?.value || item));
    if (values.length) return values.filter(Boolean);
  }
  return [];
}

async function searchDspaceRepository(repository: DSpaceRepository, query: string, signal: AbortSignal): Promise<ResearchRecord[]> {
  const params = new URLSearchParams({ query, dsoType: "item", page: "0", size: "8" });
  const response = await fetch(repository.baseUrl + "/server/api/discover/search/objects?" + params.toString(), {
    signal, headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const objects = payload?._embedded?.searchResult?._embedded?.objects || payload?._embedded?.objects || [];
  return objects.map((wrapper: any) => {
    const item = wrapper?._embedded?.indexableObject || wrapper?.indexableObject || wrapper;
    const metadata = item?.metadata || {};
    const title = metadataValues(metadata, ["dc.title", "dcterms.title"])[0] || valueText(item?.name);
    const authors = metadataValues(metadata, ["dc.contributor.author", "dc.creator", "dc.contributor"]);
    const abstract = metadataValues(metadata, ["dc.description.abstract", "dc.description"])[0] || "";
    const date = metadataValues(metadata, ["dc.date.issued", "dc.date.accessioned"])[0] || "";
    const year = Number(date.match(/\b(19|20)\d{2}\b/)?.[0]) || undefined;
    const handle = metadataValues(metadata, ["dc.identifier.uri", "dc.identifier"])[0];
    const itemId = valueText(item?.uuid || item?.id);
    const url = handle || (itemId ? repository.baseUrl + "/items/" + itemId : "");
    return {
      id: repository.id + ":" + (itemId || handle || title),
      title,
      url: url || repository.baseUrl,
      year,
      authors: authors.slice(0, 8).join(", "),
      publisher: repository.name,
      journal: metadataValues(metadata, ["dc.relation.ispartof", "dc.publisher"])[0] || "",
      abstract: abstract.slice(0, 900),
      type: metadataValues(metadata, ["dc.type"])[0] || "Institutional repository item",
      sources: [repository.name],
      subjects: metadataValues(metadata, ["dc.subject"]).slice(0, 8),
      verificationStatus: "metadata-only",
      verificationNote: "Repository metadata was retrieved from an institutional DSpace service. Confirm the item landing page, author, version and file access or reuse terms before citing or redistributing it.",
    };
  }).filter((record: ResearchRecord) => record.title);
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
    { name: "OpenAIRE Graph", search: searchOpenAire },
    { name: "arXiv", search: searchArxiv },
    ...DSPACE_REPOSITORIES.map(repository => ({ name: repository.name, search: (query: string, signal: AbortSignal) => searchDspaceRepository(repository, query, signal) })),
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
