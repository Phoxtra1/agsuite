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
    canonicalUrl: "https://www.uis.unesco.org/en/data",
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
  {
    "id": "ghana-statistical-service",
    "name": "Ghana Statistical Service",
    "publisher": "Ghana Statistical Service",
    "canonicalUrl": "https://statsghana.gov.gh/",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "ghana",
      "statistics",
      "population",
      "economics",
      "labour",
      "agriculture"
    ],
    "jurisdictions": [
      "ghana"
    ],
    "description": "Official Ghanaian national statistics, census, surveys and statistical releases.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "bank-of-ghana",
    "name": "Bank of Ghana",
    "publisher": "Bank of Ghana",
    "canonicalUrl": "https://www.bog.gov.gh/",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "ghana",
      "finance",
      "banking",
      "monetary-policy",
      "economics"
    ],
    "jurisdictions": [
      "ghana"
    ],
    "description": "Central-bank publications, monetary and financial statistics, policy and regulatory information.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "ghana-revenue-authority",
    "name": "Ghana Revenue Authority",
    "publisher": "Ghana Revenue Authority",
    "canonicalUrl": "https://gra.gov.gh/",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "ghana",
      "tax",
      "customs",
      "business",
      "trade",
      "compliance"
    ],
    "jurisdictions": [
      "ghana"
    ],
    "description": "Official tax, customs, taxpayer guidance and revenue administration information.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "office-registrar-companies",
    "name": "Office of the Registrar of Companies",
    "publisher": "Office of the Registrar of Companies, Ghana",
    "canonicalUrl": "https://orc.gov.gh/",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "ghana",
      "business",
      "company-registration",
      "corporate-compliance"
    ],
    "jurisdictions": [
      "ghana"
    ],
    "description": "Official company and business registration information, forms and regulatory notices.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "ghana-health-service",
    "name": "Ghana Health Service",
    "publisher": "Ghana Health Service",
    "canonicalUrl": "https://ghs.gov.gh/",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "ghana",
      "health",
      "public-health",
      "health-services"
    ],
    "jurisdictions": [
      "ghana"
    ],
    "description": "National public-health programmes, service information and official health notices.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "ghana-education-service",
    "name": "Ghana Education Service",
    "publisher": "Ghana Education Service",
    "canonicalUrl": "https://ges.gov.gh/",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "ghana",
      "education",
      "schools",
      "curriculum",
      "teaching"
    ],
    "jurisdictions": [
      "ghana"
    ],
    "description": "Official pre-tertiary education administration, school and education-sector information.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "imf-data",
    "name": "IMF Data",
    "publisher": "International Monetary Fund",
    "canonicalUrl": "https://www.imf.org/en/Data",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "economics",
      "finance",
      "monetary-policy",
      "trade",
      "public-finance"
    ],
    "jurisdictions": [
      "global",
      "national"
    ],
    "description": "International macroeconomic, financial and country surveillance datasets and publications.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "oecd-data",
    "name": "OECD Data Explorer",
    "publisher": "Organisation for Economic Co-operation and Development",
    "canonicalUrl": "https://data-explorer.oecd.org/",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "economics",
      "education",
      "employment",
      "trade",
      "development"
    ],
    "jurisdictions": [
      "global",
      "member-countries"
    ],
    "description": "Comparable statistical datasets and indicators, with coverage depending on each series.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "wipo",
    "name": "World Intellectual Property Organization",
    "publisher": "WIPO",
    "canonicalUrl": "https://www.wipo.int/",
    "access": "open-web",
    "sourceKind": "institutional",
    "subjects": [
      "intellectual-property",
      "patents",
      "trademarks",
      "innovation",
      "business"
    ],
    "jurisdictions": [
      "global",
      "national"
    ],
    "description": "International intellectual-property treaties, guidance, statistics and registration information.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "wipo-lex",
    "name": "WIPO Lex",
    "publisher": "World Intellectual Property Organization",
    "canonicalUrl": "https://www.wipo.int/wipolex/en/",
    "access": "repository",
    "sourceKind": "institutional",
    "subjects": [
      "law",
      "intellectual-property",
      "legislation",
      "regulation"
    ],
    "jurisdictions": [
      "global",
      "national"
    ],
    "description": "Legal texts and treaty materials relating to intellectual property, organised by jurisdiction.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "pubmed",
    "name": "PubMed",
    "publisher": "U.S. National Library of Medicine",
    "canonicalUrl": "https://pubmed.ncbi.nlm.nih.gov/",
    "access": "open-api",
    "sourceKind": "research-index",
    "subjects": [
      "medicine",
      "health",
      "biomedical-research",
      "public-health"
    ],
    "jurisdictions": [
      "global"
    ],
    "description": "Biomedical and life-sciences citations and abstracts; inclusion does not itself validate findings.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "europe-pmc",
    "name": "Europe PMC",
    "publisher": "EMBL-EBI and partners",
    "canonicalUrl": "https://europepmc.org/",
    "access": "open-api",
    "sourceKind": "research-index",
    "subjects": [
      "medicine",
      "health",
      "life-sciences",
      "biomedical-research"
    ],
    "jurisdictions": [
      "global"
    ],
    "description": "Life-sciences literature, abstracts, grants and links to available full text.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "doaj",
    "name": "Directory of Open Access Journals",
    "publisher": "DOAJ",
    "canonicalUrl": "https://doaj.org/",
    "access": "open-api",
    "sourceKind": "research-index",
    "subjects": [
      "research",
      "journals",
      "open-access",
      "scholarly-publications"
    ],
    "jurisdictions": [
      "global"
    ],
    "description": "Directory of open-access journals and article metadata; verify individual journal and article details.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "core",
    "name": "CORE",
    "publisher": "CORE",
    "canonicalUrl": "https://core.ac.uk/",
    "access": "open-api",
    "sourceKind": "research-index",
    "subjects": [
      "research",
      "repositories",
      "open-access",
      "scholarly-publications"
    ],
    "jurisdictions": [
      "global"
    ],
    "description": "Aggregated discovery of research outputs from repositories and journals; check original repository records.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },
  {
    "id": "zenodo",
    "name": "Zenodo",
    "publisher": "CERN",
    "canonicalUrl": "https://zenodo.org/",
    "access": "repository",
    "sourceKind": "research-index",
    "subjects": [
      "research",
      "datasets",
      "software",
      "reports",
      "open-science"
    ],
    "jurisdictions": [
      "global"
    ],
    "description": "Research outputs, datasets, software and reports deposited by researchers and organisations.",
    "reviewStatus": "listed-pending-record-review",
    "recordLevelVerificationRequired": true
  },];

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
  const byId = new Map(KNOWLEDGE_SUBJECTS.map(subject => [subject.id, subject]));
  const selected = new Set<string>();
  const pending = [...subjectIds];

  // Traverse relationships until no new subject can be reached. This keeps
  // multi-discipline discovery independent of the order in which taxonomy
  // entries happen to be declared.
  while (pending.length) {
    const id = pending.shift()!;
    if (selected.has(id)) continue;
    selected.add(id);
    const subject = byId.get(id);
    if (!subject) continue;
    for (const relatedId of [...subject.parentIds, ...subject.relatedIds]) {
      if (!selected.has(relatedId)) pending.push(relatedId);
    }
  }
  return KNOWLEDGE_SUBJECTS.filter(subject => selected.has(subject.id));
}

export function searchDiscoverySources(query: string): DiscoverySource[] {
  const terms = query.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(term => term.length > 1);
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
