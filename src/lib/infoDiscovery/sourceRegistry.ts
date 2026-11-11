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

  },
  {
    id: "openaire-graph",
    name: "OpenAIRE Research Graph",
    publisher: "OpenAIRE",
    canonicalUrl: "https://graph.openaire.eu/",
    access: "open-api",
    sourceKind: "research-index",
    subjects: ["research", "publications", "datasets", "software", "institutional-repositories", "open-science"],
    jurisdictions: ["global"],
    description: "Aggregated research products, repository records, datasets, software and linked institutional outputs.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "arxiv",
    name: "arXiv",
    publisher: "Cornell University",
    canonicalUrl: "https://arxiv.org/",
    access: "open-api",
    sourceKind: "research-index",
    subjects: ["physics", "mathematics", "computer-science", "statistics", "quantitative-biology", "economics"],
    jurisdictions: ["global"],
    description: "Open preprint repository; check version history, publication status and each work's reuse licence.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "ugspace",
    name: "UGSpace Institutional Repository",
    publisher: "University of Ghana",
    canonicalUrl: "https://ugspace.ug.edu.gh/",
    access: "repository",
    sourceKind: "institutional",
    subjects: ["ghana", "african-studies", "education", "research", "heritage", "theses", "dissertations"],
    jurisdictions: ["ghana"],
    description: "University of Ghana's open repository for scholarly, heritage and institutional materials.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "knustspace",
    name: "KNUSTSpace",
    publisher: "Kwame Nkrumah University of Science and Technology",
    canonicalUrl: "https://dspace.knust.edu.gh/",
    access: "repository",
    sourceKind: "institutional",
    subjects: ["ghana", "science", "technology", "engineering", "mathematics", "health", "theses", "dissertations"],
    jurisdictions: ["ghana"],
    description: "KNUST's institutional repository for research articles, theses, conference materials and university scholarship.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "ucc-ir",
    name: "University of Cape Coast Institutional Repository",
    publisher: "University of Cape Coast",
    canonicalUrl: "https://ir.ucc.edu.gh/",
    access: "repository",
    sourceKind: "institutional",
    subjects: ["ghana", "education", "science", "humanities", "social-sciences", "research", "theses"],
    jurisdictions: ["ghana"],
    description: "UCC's open archive of theses, dissertations, journal articles and university research outputs.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "datacite",
    name: "DataCite",
    publisher: "DataCite",
    canonicalUrl: "https://datacite.org/",
    access: "open-api",
    sourceKind: "research-index",
    subjects: ["research", "datasets", "software", "doi", "research-data"],
    jurisdictions: ["global"],
    description: "Persistent identifiers and metadata for research data and other scholarly outputs.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "fao-agris",
    name: "FAO AGRIS",
    publisher: "Food and Agriculture Organization of the United Nations",
    canonicalUrl: "https://agris.fao.org/",
    access: "open-web",
    sourceKind: "research-index",
    subjects: ["agriculture", "food-security", "fisheries", "forestry", "rural-development", "africa"],
    jurisdictions: ["global", "national"],
    description: "International discovery service for agricultural science and technology literature.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "who-iris",
    name: "WHO IRIS",
    publisher: "World Health Organization",
    canonicalUrl: "https://iris.who.int/",
    access: "repository",
    sourceKind: "institutional",
    subjects: ["health", "public-health", "medicine", "health-policy", "global-health"],
    jurisdictions: ["global", "national"],
    description: "WHO's institutional repository for publications, technical documents and health guidance.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "unesdoc",
    name: "UNESCO Digital Library",
    publisher: "UNESCO",
    canonicalUrl: "https://unesdoc.unesco.org/",
    access: "repository",
    sourceKind: "institutional",
    subjects: ["education", "culture", "science", "heritage", "communication", "africa"],
    jurisdictions: ["global", "national"],
    description: "UNESCO publications, reports, records and specialist knowledge materials.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "afdb-publications",
    name: "African Development Bank Publications",
    publisher: "African Development Bank Group",
    canonicalUrl: "https://www.afdb.org/en/knowledge/publications",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["africa", "development", "economics", "infrastructure", "agriculture", "governance", "finance"],
    jurisdictions: ["africa", "national", "regional"],
    description: "African development outlooks, working papers, statistical reports and policy publications.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "world-bank-documents",
    name: "World Bank Documents and Reports",
    publisher: "World Bank Group",
    canonicalUrl: "https://documents.worldbank.org/",
    access: "repository",
    sourceKind: "institutional",
    subjects: ["development", "economics", "education", "health", "agriculture", "governance", "africa"],
    jurisdictions: ["global", "national", "regional"],
    description: "Country strategies, project documents, evaluations, research papers and policy reports.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "un-digital-library",
    name: "United Nations Digital Library",
    publisher: "United Nations",
    canonicalUrl: "https://digitallibrary.un.org/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["international-law", "human-rights", "peace-and-security", "investigations", "official-reports"],
    jurisdictions: ["global", "international"],
    description: "Official UN documents, commission reports, resolutions, meeting records and report symbols.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "ohchr-commissions",
    name: "OHCHR Commissions of Inquiry and Fact-Finding Missions",
    publisher: "United Nations Office of the High Commissioner for Human Rights",
    canonicalUrl: "https://www.ohchr.org/en/hr-bodies",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["human-rights", "international-humanitarian-law", "commissions-of-inquiry", "fact-finding"],
    jurisdictions: ["global", "international", "country-specific"],
    description: "Official mandates, reports and documentation from UN human-rights investigative mechanisms.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "international-criminal-court",
    name: "International Criminal Court — Cases and Decisions",
    publisher: "International Criminal Court",
    canonicalUrl: "https://www.icc-cpi.int/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["international-criminal-law", "war-crimes", "crimes-against-humanity", "genocide", "court-decisions"],
    jurisdictions: ["international"],
    description: "Official case records, judicial decisions, warrants, filings and judgments of the ICC; procedural allegations must be distinguished from findings and convictions.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "international-court-of-justice",
    name: "International Court of Justice — Cases and Judgments",
    publisher: "International Court of Justice",
    canonicalUrl: "https://www.icj-cij.org/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["international-law", "state-responsibility", "court-judgments", "advisory-opinions"],
    jurisdictions: ["international"],
    description: "Official case files, orders, judgments and advisory opinions of the principal judicial organ of the United Nations.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "echr-hudoc",
    name: "European Court of Human Rights — HUDOC",
    publisher: "Council of Europe",
    canonicalUrl: "https://hudoc.echr.coe.int/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["human-rights", "european-law", "court-judgments", "tribunal-decisions"],
    jurisdictions: ["europe"],
    description: "Official searchable database of European Court of Human Rights judgments, decisions and case documents.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "us-gao-reports",
    name: "U.S. Government Accountability Office — Reports and Testimonies",
    publisher: "United States Government Accountability Office",
    canonicalUrl: "https://www.gao.gov/reports-testimonies",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["government-audit", "public-administration", "oversight", "investigations", "public-finance"],
    jurisdictions: ["united-states"],
    description: "Official government audits, evaluations, investigations and oversight reports to the U.S. Congress.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "uk-public-inquiries",
    name: "UK Public Inquiries — Official Reports",
    publisher: "Government of the United Kingdom",
    canonicalUrl: "https://www.gov.uk/government/collections/public-inquiries",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["public-inquiries", "government-investigations", "official-reports", "public-accountability"],
    jurisdictions: ["united-kingdom"],
    description: "Official inquiry announcements, evidence, interim reports and final reports published by UK government departments.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "australia-royal-commissions",
    name: "Australian Royal Commissions — Reports",
    publisher: "Commonwealth of Australia",
    canonicalUrl: "https://www.royalcommission.gov.au/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["royal-commissions", "public-inquiries", "government-investigations", "official-reports"],
    jurisdictions: ["australia"],
    description: "Official Australian Royal Commission mandates, final reports, recommendations and supporting public records.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
  },
  {
    id: "south-africa-justice-commissions",
    name: "South African Judicial Commissions of Inquiry",
    publisher: "Department of Justice and Constitutional Development, South Africa",
    canonicalUrl: "https://www.justice.gov.za/commissions/",
    access: "open-web",
    sourceKind: "institutional",
    subjects: ["judicial-commissions", "public-inquiries", "state-capture", "official-reports"],
    jurisdictions: ["south-africa"],
    description: "Official commission mandates, records and reports published through South Africa's justice institutions.",
    reviewStatus: "listed-pending-record-review",
    recordLevelVerificationRequired: true,
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
  const pending = subjectIds.map(id => ({ id, depth: 0 }));

  // Include the selected subjects, their direct links and one related layer.
  // A bounded traversal keeps cross-disciplinary discovery useful without
  // expanding one broad topic into the entire connected taxonomy.
  while (pending.length) {
    const current = pending.shift()!;
    if (selected.has(current.id)) continue;
    selected.add(current.id);
    if (current.depth >= 2) continue;
    const subject = byId.get(current.id);
    if (!subject) continue;
    for (const relatedId of [...subject.parentIds, ...subject.relatedIds]) {
      if (!selected.has(relatedId)) pending.push({ id: relatedId, depth: current.depth + 1 });
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
