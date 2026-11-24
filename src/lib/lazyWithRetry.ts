import { lazy, type ComponentType } from "react";

const RETRY_DELAYS_MS = [750, 2000, 4000];
const RECOVERY_KEY_PREFIX = "__amv_chunk_recovery:";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isDynamicImportFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk .* failed|failed to load module script/i.test(message);
}

function recoverFromStaleChunk(): boolean {
  if (typeof window === "undefined" || !navigator.onLine) return false;

  const key = RECOVERY_KEY_PREFIX + window.location.pathname;
  try {
    // One automatic recovery reload per route/session. This prevents a
    // permanent reload loop if the deployed asset is genuinely unavailable.
    if (sessionStorage.getItem(key) === "1") return false;
    sessionStorage.setItem(key, "1");

    const url = new URL(window.location.href);
    url.searchParams.set("sw", "off");
    url.searchParams.set("chunk-recovery", "1");
    window.location.replace(url.toString());
    return true;
  } catch {
    return false;
  }
}

/**
 * Retry temporary chunk/network failures. If a deployed page references an
 * obsolete chunk, perform one controlled reload without the service worker.
 * Never force a reload while offline, and never enter an automatic reload loop.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const module = await factory();
        try {
          sessionStorage.removeItem(RECOVERY_KEY_PREFIX + window.location.pathname);
        } catch {
          // Storage may be unavailable; successful module loading still wins.
        }
        return module;
      } catch (error) {
        lastError = error;
        if (attempt < RETRY_DELAYS_MS.length) {
          await wait(RETRY_DELAYS_MS[attempt]);
        }
      }
    }

    if (isDynamicImportFailure(lastError) && recoverFromStaleChunk()) {
      // Navigation is underway; keep this lazy import pending until the page
      // reloads rather than immediately rendering the generic route error.
      await new Promise<never>(() => undefined);
    }

    throw lastError;
  });
}
