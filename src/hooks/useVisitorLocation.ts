import { useEffect, useState } from "react";

export type VisitorLocation = {
  city: string | null;
  region: string | null;
  timeZone: string | null;
};

type LocationApiResponse = {
  city?: unknown;
  region?: unknown;
  timezone?: unknown;
};

type CachedLocation = {
  savedAt: number;
  location: VisitorLocation;
};

const CACHE_KEY = "amineva_visitor_location_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let memoryCache: CachedLocation | null = null;
let locationRequest: Promise<VisitorLocation | null> | null = null;

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function cleanTimeZone(value: unknown): string | null {
  const candidate = cleanText(value);
  if (!candidate) return null;

  try {
    new Intl.DateTimeFormat("en", { timeZone: candidate });
    return candidate;
  } catch {
    return null;
  }
}

function readCachedLocation(): CachedLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedLocation>;
    const savedAt = Number(parsed.savedAt);
    const location = parsed.location;

    if (
      !Number.isFinite(savedAt) ||
      Date.now() - savedAt < 0 ||
      Date.now() - savedAt > CACHE_TTL_MS ||
      !location ||
      typeof location !== "object"
    ) {
      window.localStorage.removeItem(CACHE_KEY);
      return null;
    }

    const normalized: VisitorLocation = {
      city: cleanText(location.city),
      region: cleanText(location.region),
      timeZone: cleanTimeZone(location.timeZone),
    };

    if (!normalized.city && !normalized.region && !normalized.timeZone) {
      window.localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return { savedAt, location: normalized };
  } catch {
    return null;
  }
}

function writeCachedLocation(location: VisitorLocation): void {
  if (typeof window === "undefined") return;

  const cached: CachedLocation = { savedAt: Date.now(), location };
  memoryCache = cached;

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Continue with the in-memory value when browser storage is unavailable.
  }
}

async function requestVisitorLocation(): Promise<VisitorLocation | null> {
  if (typeof window === "undefined") return null;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Visitor location lookup failed with status ${response.status}`);
    }

    const data = (await response.json()) as LocationApiResponse;
    const location: VisitorLocation = {
      city: cleanText(data.city),
      region: cleanText(data.region),
      timeZone: cleanTimeZone(data.timezone),
    };

    if (!location.city && !location.region && !location.timeZone) {
      return null;
    }

    writeCachedLocation(location);
    return location;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getVisitorLocation(): Promise<VisitorLocation | null> {
  const cached = readCachedLocation();
  if (cached) {
    memoryCache = cached;
    return Promise.resolve(cached.location);
  }

  if (
    memoryCache &&
    Date.now() - memoryCache.savedAt <= CACHE_TTL_MS
  ) {
    return Promise.resolve(memoryCache.location);
  }

  if (!locationRequest) {
    locationRequest = requestVisitorLocation().finally(() => {
      locationRequest = null;
    });
  }

  return locationRequest;
}

export function useVisitorLocation() {
  const [initialCache] = useState<CachedLocation | null>(() => readCachedLocation());
  const [location, setLocation] = useState<VisitorLocation | null>(
    () => initialCache?.location ?? null,
  );
  const [isLoading, setIsLoading] = useState(() => initialCache === null);

  useEffect(() => {
    let active = true;

    getVisitorLocation().then((result) => {
      if (!active) return;
      setLocation(result);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const locationLabel =
    location?.city ||
    location?.region ||
    (isLoading ? "Locating…" : "Location unavailable");

  return {
    location,
    locationLabel,
    timeZone: location?.timeZone ?? null,
    isLoading,
  };
}
