/**
 * Info Discovery's shared source registry and knowledge taxonomy.
 *
 * This is the first structured curation layer. A listed publisher/domain is
 * not a verification of every document it hosts. Record-level review remains
 * explicit and must be completed before an individual item is labelled verified.
 */

export type SourceAccess = "open-web" | "open-api" | "repository";
export type SourceReviewStatus = "listed-pending-record-review" | "record-reviewed";

export interface DiscoverySource {
  id: string;
  name: string;
  publisher: string;
  canonicalUrl: string;
  access: SourceAccess;
  sourceKind: "institutional" | "research-index" | "specialist-dataset";
  subjects: string[];
  jurisdictions: string[];
  description: string;
  reviewStatus: SourceReviewStatus;
  recordLevelVerificationRequired: true;
}

export interface KnowledgeSubject {
  id: string;
  label: string;
  parentIds: string[];
  relatedIds: string[];
  keywords: string[];
}

export const DISCOVERY_SOURCES: DiscoverySource[] = [
  {
    id: "unesco-uis",
    name: "UNESCO Institute for Statistics",
    publisher: "UNESCO",
    canonicalUrl: "https://uis.unesco.org/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["education", "skills", "literacy", "research-statistics"],
    jurisdictions: ["global", "national"],
    description: "International education, literacy, science and cultural statistics.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "ilo-stat",
    name: "ILOSTAT",
    publisher: "International Labour Organization",
    canonicalUrl: "https://ilostat.ilo.org/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["employment", "labour", "skills", "working-conditions"],
    jurisdictions: ["global", "national"],
    description: "Labour-market statistics, concepts, definitions and methodological material.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "world-bank-data",
    name: "World Bank Open Data",
    publisher: "World Bank",
    canonicalUrl: "https://data.worldbank.org/",
    access: "open-api",
    sourceKind: "institutional",
    subjects: ["development", "economics", "poverty", "population", "agriculture", "governance"],
    jurisdictions: ["global", "national", "subnational-where-available"],
    description: "Country and development indicators with source-specific metadata and definitions.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "crossref",
    name: "Crossref",
    publisher: "Crossref",
    canonicalUrl: "https://www.crossref.org/",
    access: "open-api",
    sourceKind: "research-index",
    subjects: ["scholarly-publications", "research", "science", "social-sciences", "humanities"],
    jurisdictions: ["global"],
    description: "Publisher-deposited scholarly metadata and persistent DOI records; metadata registration does not establish research quality.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "esco",
    name: "ESCO Classification",
    publisher: "European Commission",
    canonicalUrl: "https://esco.ec.europa.eu/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["occupations", "skills", "qualifications", "employment"],
    jurisdictions: ["european-union"],
    description: "Structured occupation, skill, competence and qualification relationships.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "onet",
    name: "O*NET OnLine",
    publisher: "U.S. Department of Labor",
    canonicalUrl: "https://www.onetonline.org/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["occupations", "skills", "work-context", "employment"],
    jurisdictions: ["united-states"],
    description: "Occupational tasks, skills, knowledge and work-context information.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "nasa-power",
    name: "NASA POWER",
    publisher: "NASA",
    canonicalUrl: "https://power.larc.nasa.gov/",
    access: "open-api",
    sourceKind: "specialist-dataset",
    subjects: ["weather", "climate", "agriculture", "earth-observation"],
    jurisdictions: ["global", "coordinate-based"],
    description: "Satellite and model-derived meteorological and solar data with documented spatial and temporal limitations.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
];

export const KNOWLEDGE_SUBJECTS: KnowledgeSubject[] = [
  { id: "education", label: "Education", parentIds: [], relatedIds: ["skills", "employment", "development"], keywords: ["school", "learning", "teaching", "qualification"] },
  { id: "skills", label: "Skills and competencies", parentIds: [], relatedIds: ["education", "occupations", "employment"], keywords: ["ability", "competence", "training", "practical skills"] },
  { id: "occupations", label: "Occupations and professions", parentIds: [], relatedIds: ["skills", "education", "employment"], keywords: ["career", "profession", "job role", "work"] },
  { id: "employment", label: "Employment and labour", parentIds: [], relatedIds: ["occupations", "skills", "economics", "development"], keywords: ["jobs", "wages", "unemployment", "labour market"] },
  { id: "economics", label: "Economics", parentIds: [], relatedIds: ["development", "poverty", "governance", "employment"], keywords: ["markets", "trade", "income", "production"] },
  { id: "development", label: "Development", parentIds: [], relatedIds: ["economics", "poverty", "governance", "education"], keywords: ["economic development", "human development", "infrastructure"] },
  { id: "poverty", label: "Poverty and inequality", parentIds: [], relatedIds: ["development", "economics", "governance"], keywords: ["deprivation", "inequality", "living standards"] },
  { id: "governance", label: "Governance and public policy", parentIds: [], relatedIds: ["development", "economics", "law"], keywords: ["institutions", "public administration", "accountability", "policy"] },
  { id: "law", label: "Law and regulation", parentIds: [], relatedIds: ["governance", "business"], keywords: ["legislation", "regulation", "legal", "compliance"] },
  { id: "business", label: "Business and enterprise", parentIds: [], relatedIds: ["economics", "law", "finance", "production"], keywords: ["company", "enterprise", "operations", "industry"] },
  { id: "finance", label: "Finance and financial operations", parentIds: [], relatedIds: ["business", "economics"], keywords: ["accounting", "cash flow", "credit", "investment"] },
  { id: "production", label: "Production and industry", parentIds: [], relatedIds: ["business", "agriculture", "economics"], keywords: ["manufacturing", "factory", "supply chain", "industrial"] },
  { id: "agriculture", label: "Agriculture and food systems", parentIds: [], relatedIds: ["climate", "production", "economics"], keywords: ["farming", "crops", "livestock", "food systems"] },
  { id: "climate", label: "Climate and environment", parentIds: [], relatedIds: ["agriculture", "development"], keywords: ["weather", "climate risk", "drought", "rainfall", "environment"] },
];

export function findRelatedSubjects(subjectIds: string[]): KnowledgeSubject[] {
  const selected = new Set(subjectIds);
  for (const subject of KNOWLEDGE_SUBJECTS) {
    if (selected.has(subject.id)) subject.relatedIds.forEach(id => selected.add(id));
  }
  return KNOWLEDGE_SUBJECTS.filter(subject => selected.has(subject.id));
}

export function searchDiscoverySources(query: string): DiscoverySource[] {
  const terms = query.toLocaleLowerCase().split(/[^\\p{L}\\p{N}]+/u).filter(term => term.length > 1);
  if (!terms.length) return [];
  return DISCOVERY_SOURCES
    .map(source => {
      const haystack = [source.name, source.publisher, source.description, ...source.subjects, ...source.jurisdictions].join(" ").toLocaleLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { source, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.source);
}
