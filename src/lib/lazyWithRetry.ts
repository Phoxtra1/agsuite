import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "__amv_chunk_reload";
const RETRY_COOLDOWN_MS = 60_000;
const APP_CACHE_PREFIXES = ["amineva-", "workbox-precache-", "workbox-runtime-"];

function readReloadFlag(): boolean {
  try { return sessionStorage.getItem(RELOAD_KEY) === "1"; } catch { return false; }
}

function writeReloadFlag(): boolean {
  try {
    sessionStorage.setItem(RELOAD_KEY, "1");
    return sessionStorage.getItem(RELOAD_KEY) === "1";
  } catch { return false; }
}

function clearReloadFlag(): void {
  try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* storage may be unavailable */ }
}

// Keep the guard for the complete initial page-load window so parallel lazy
// imports cannot trigger repeated reloads. Clear it after the page settles.
if (typeof window !== "undefined" && readReloadFlag()) {
  window.setTimeout(clearReloadFlag, RETRY_COOLDOWN_MS);
}

async function clearAminevaRuntimeCaches(): Promise<void> {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  const appCaches = keys.filter((key) =>
    APP_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)),
  );
  await Promise.allSettled(appCaches.map((key) => caches.delete(key)));
}

async function unregisterAminevaWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  const appRegistrations = registrations.filter((registration) => {
    const workerUrls = [
      registration.active?.scriptURL,
      registration.waiting?.scriptURL,
      registration.installing?.scriptURL,
    ].filter(Boolean) as string[];
    return workerUrls.some((workerUrl) => {
      try {
        const script = new URL(workerUrl);
        const scope = new URL(registration.scope);
        return script.origin === window.location.origin &&
          script.pathname === "/sw.js" &&
          scope.origin === window.location.origin &&
          scope.pathname === "/";
      } catch {
        return false;
      }
    });
  });
  await Promise.allSettled(appRegistrations.map((registration) => registration.unregister()));
}

/**
 * Recover once from stale/missing deployment chunks. Only Amineva's own
 * worker and named runtime caches are reset; unrelated origin workers/caches
 * are never removed. The reload obtains fresh, non-cacheable HTML.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (!readReloadFlag() && writeReloadFlag()) {
        await Promise.allSettled([
          unregisterAminevaWorker(),
          clearAminevaRuntimeCaches(),
        ]);
        const url = new URL(window.location.href);
        url.searchParams.set("__amv_chunk_recovery", String(Date.now()));
        window.location.replace(url.toString());
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
