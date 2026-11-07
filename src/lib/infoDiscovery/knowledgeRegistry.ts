/**
 * Curated institutional source registry for Info Discovery.
 *
 * Registry entries identify primary institutional publishers and the subjects
 * they cover. A listed source is not a blanket endorsement of every claim it
 * publishes. Record-level verification, jurisdiction, dates and methodology
 * must still be checked before evidence is relied upon.
 */

export type KnowledgeSource = {
  id: string;
  name: string;
  publisher: string;
  url: string;
  sourceType: "intergovernmental" | "research-index" | "official-statistics" | "specialist-agency";
  subjects: string[];
  geographicScope: string;
  access: "open-web" | "metadata-index" | "mixed";
  reviewStatus: "curated-publisher" | "needs-review";
  verificationNote: string;
};

export const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: "world-bank-open-data",
    name: "World Bank Open Data",
    publisher: "World Bank Group",
    url: "https://data.worldbank.org/",
    sourceType: "official-statistics",
    subjects: ["economics", "development", "poverty", "education", "health", "agriculture", "trade"],
    geographicScope: "Global and country-level",
    access: "open-web",
    reviewStatus: "curated-publisher",
    verificationNote: "Check indicator definition, country coverage, observation year and methodology.",
  },
  {
    id: "un-data",
    name: "UN Data",
    publisher: "United Nations Statistics Division",
    url: "https://data.un.org/",
    sourceType: "official-statistics",
    subjects: ["population", "economics", "society", "environment", "trade"],
    geographicScope: "Global and national",
    access: "open-web",
    reviewStatus: "curated-publisher",
    verificationNote: "Check the contributing agency, series definition, reporting period and revision notes.",
  },
  {
    id: "unesco-uis",
    name: "UNESCO Institute for Statistics",
    publisher: "UNESCO Institute for Statistics",
    url: "https://uis.unesco.org/",
    sourceType: "specialist-agency",
    subjects: ["education", "science", "culture", "literacy", "skills"],
    geographicScope: "Global and national",
    access: "open-web",
    reviewStatus: "curated-publisher",
    verificationNote: "Check indicator metadata, national reporting coverage and data vintage.",
  },
  {
    id: "ilo-stat",
    name: "ILOSTAT",
    publisher: "International Labour Organization",
    url: "https://ilostat.ilo.org/",
    sourceType: "specialist-agency",
    subjects: ["employment", "labour", "skills", "wages", "occupations", "social-protection"],
    geographicScope: "Global and national",
    access: "open-web",
    reviewStatus: "curated-publisher",
    verificationNote: "Distinguish national observations from modelled estimates and projections.",
  },
  {
    id: "who-data",
    name: "WHO Data",
    publisher: "World Health Organization",
    url: "https://www.who.int/data",
    sourceType: "specialist-agency",
    subjects: ["health", "public-health", "disease", "health-systems"],
    geographicScope: "Global and national",
    access: "mixed",
    reviewStatus: "curated-publisher",
    verificationNote: "Check indicator definitions, reporting dates, country coverage and health guidance updates.",
  },
  {
    id: "fao-data",
    name: "FAOSTAT",
    publisher: "Food and Agriculture Organization of the United Nations",
    url: "https://www.fao.org/faostat/",
    sourceType: "specialist-agency",
    subjects: ["agriculture", "food", "land", "forestry", "fisheries", "production", "trade"],
    geographicScope: "Global and national",
    access: "open-web",
    reviewStatus: "curated-publisher",
    verificationNote: "Check commodity definitions, units, production year and national reporting notes.",
  },
  {
    id: "unctad-stat",
    name: "UNCTADstat",
    publisher: "United Nations Trade and Development",
    url: "https://unctadstat.unctad.org/",
    sourceType: "specialist-agency",
    subjects: ["trade", "investment", "development", "shipping", "commodities"],
    geographicScope: "Global and national",
    access: "open-web",
    reviewStatus: "curated-publisher",
    verificationNote: "Check trade classifications, valuation basis, reporting period and data source.",
  },
  {
    id: "unido-stat",
    name: "UNIDO Statistics",
    publisher: "United Nations Industrial Development Organization",
    url: "https://stat.unido.org/",
    sourceType: "specialist-agency",
    subjects: ["industry", "manufacturing", "production", "industrial-development", "employment"],
    geographicScope: "Global and national",
    access: "open-web",
    reviewStatus: "curated-publisher",
    verificationNote: "Check industrial classification, country-year coverage and statistical methodology.",
  },
  {
    id: "crossref",
    name: "Crossref",
    publisher: "Crossref",
    url: "https://www.crossref.org/",
    sourceType: "research-index",
    subjects: ["research", "scholarly-publications", "books", "journals", "doi"],
    geographicScope: "International publication metadata",
    access: "metadata-index",
    reviewStatus: "curated-publisher",
    verificationNote: "A registered DOI confirms deposited metadata, not research quality, peer review or correctness.",
  },
  {
    id: "openalex",
    name: "OpenAlex",
    publisher: "OurResearch",
    url: "https://openalex.org/",
    sourceType: "research-index",
    subjects: ["research", "scholarly-publications", "authors", "institutions", "topics"],
    geographicScope: "International scholarly metadata",
    access: "metadata-index",
    reviewStatus: "curated-publisher",
    verificationNote: "Discovery metadata can contain gaps or matching errors; confirm records with the original publisher.",
  },
];

export function searchKnowledgeSources(query: string): KnowledgeSource[] {
  const terms = query.toLocaleLowerCase().trim().split(/\\s+/).filter(Boolean);
  if (!terms.length) return KNOWLEDGE_SOURCES;
  return KNOWLEDGE_SOURCES
    .map(source => {
      const searchable = [
        source.name, source.publisher, source.geographicScope,
        source.sourceType, ...source.subjects,
      ].join(" ").toLocaleLowerCase();
      const matched = terms.filter(term => searchable.includes(term)).length;
      return { source, matched };
    })
    .filter(item => item.matched > 0)
    .sort((a, b) => b.matched - a.matched)
    .map(item => item.source);
}
