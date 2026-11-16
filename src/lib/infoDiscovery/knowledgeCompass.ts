import { wsKey } from "@/lib/workspace/scope";

export type KnowledgePathway = {
  id: string;
  situation: string;
  subject: string;
  materialType: string;
  title: string;
  creator: string;
  why: string;
  perspective?: string;
  keywords?: string[];
  audience?: string;
};

export const COMPASS_INTENT_GROUPS: Record<string, string[]> = {
  "earn money online": ["online income", "digital business", "ecommerce", "freelancing", "internet business", "make money online"],
  "start a business": ["entrepreneurship", "business idea", "startup", "customers", "market validation", "small business"],
  "poverty and inequality": ["poverty", "inequality", "development", "economic hardship", "low income", "underdevelopment"],
  "culture and identity": ["culture", "traditions", "customs", "anthropology", "identity", "society"],
  "become a lawyer": ["law", "legal reasoning", "advocacy", "court", "lawyer", "legal practice"],
  "become a scientist": ["science", "scientific method", "research", "evidence", "experiments", "discovery"],
  "become a writer": ["writing", "writer", "storytelling", "communication", "craft", "research"],
  "understand people": ["psychology", "human behaviour", "decision making", "influence", "relationships", "judgement"],
  "become a doctor": ["medicine", "medical", "clinical", "health", "diagnosis", "public health"],
  "build technology": ["technology", "computer", "software", "engineering", "coding", "invention"],
  "lead a team": ["leadership", "management", "organisation", "team", "negotiation", "systems"],
  "teach better": ["teaching", "education", "learning", "classroom", "instruction"],
  "understand africa": ["africa", "african history", "colonialism", "culture", "development"],
  "african history": ["african history", "ghana", "west africa", "colonialism", "independence", "asante", "history"],
  "african literature": ["african literature", "nigerian literature", "ghanaian literature", "novel", "poetry", "theatre", "writers"],
  "african philosophy": ["african philosophy", "akan philosophy", "ethics", "decolonisation", "knowledge", "worldviews"],
  "african science": ["african science", "indigenous knowledge", "astronomy", "mathematics", "technology", "medicinal plants"],
  "african governance": ["african governance", "democracy", "political reform", "institutions", "leadership", "citizenship"],
  "african society": ["african society", "contemporary africa", "african cities", "urbanisation", "identity", "development"],
  "protect the environment": ["environment", "climate", "ecology", "agriculture", "conservation"],
};

export function compassTokens(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 2);
}

export function scoreCompassPathway(item: KnowledgePathway, query: string): number {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return 0;

  const tokens = compassTokens(cleanQuery);
  const itemText = [
    item.situation,
    item.subject,
    item.materialType,
    item.title,
    item.creator,
    item.why,
    ...(item.keywords || []),
  ].join(" ").toLowerCase();
  const itemTokens = new Set(compassTokens(itemText));

  let score = 0;
  for (const token of tokens) if (itemTokens.has(token)) score += 2;
  if (item.situation.toLowerCase().includes(cleanQuery)) score += 8;
  if (item.title.toLowerCase().includes(cleanQuery)) score += 5;

  for (const [phrase, expansions] of Object.entries(COMPASS_INTENT_GROUPS)) {
    if (cleanQuery.includes(phrase) || expansions.some(term => cleanQuery.includes(term))) {
      const related = [phrase, ...expansions].flatMap(compassTokens);
      for (const term of related) if (itemTokens.has(term)) score += 2;
    }
  }

  return score;
}

const COMPASS_RESEARCH_CACHE_KEY = "amineva_knowledge_compass_research_v1";
const COMPASS_RESEARCH_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
type CompassResearchCacheEntry<T> = { cachedAt: number; records: T[] };
type CompassResearchCache<T> = Record<string, CompassResearchCacheEntry<T>>;

function compassCacheQueryKey(query: string): string {
  return query.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

/** Return locally saved research matches while a fresh search is running or offline. */
export function readCompassResearchCache<T>(
  query: string,
  now = Date.now(),
  maxAgeMs = COMPASS_RESEARCH_CACHE_TTL_MS,
): T[] | null {
  if (typeof localStorage === "undefined" || query.trim().length < 3) return null;
  try {
    const raw = localStorage.getItem(wsKey(COMPASS_RESEARCH_CACHE_KEY));
    if (!raw) return null;
    const cache = JSON.parse(raw) as CompassResearchCache<T>;
    const entry = cache?.[compassCacheQueryKey(query)];
    if (!entry || !Array.isArray(entry.records) || !Number.isFinite(entry.cachedAt)) return null;
    return now - entry.cachedAt <= maxAgeMs ? entry.records : null;
  } catch {
    return null;
  }
}

/** Keep a small, account-scoped browser cache of recent Compass research searches. */
export function cacheCompassResearchResults<T>(query: string, records: T[], now = Date.now()): void {
  if (typeof localStorage === "undefined" || query.trim().length < 3 || !records.length) return;
  try {
    const key = wsKey(COMPASS_RESEARCH_CACHE_KEY);
    const raw = localStorage.getItem(key);
    const cache = (raw ? JSON.parse(raw) : {}) as CompassResearchCache<T>;
    cache[compassCacheQueryKey(query)] = { cachedAt: now, records };
    const newestFirst = Object.entries(cache)
      .sort((a, b) => b[1].cachedAt - a[1].cachedAt)
      .slice(0, 30);
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(newestFirst)));
  } catch (error) {
    console.warn("[Knowledge Compass] Could not save local research cache:", error);
  }
}
