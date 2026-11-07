import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "__amv_chunk_reload";
const RETRY_COOLDOWN_MS = 60_000;

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

// Keep the retry guard for the whole page-load window. Clearing it as soon as
// ANY lazy module succeeds is unsafe: React loads several route chunks in
// parallel, so a successful chunk could erase the guard while another chunk
// is still failing and cause an endless reload loop.
if (typeof window !== "undefined" && readReloadFlag()) {
  window.setTimeout(clearReloadFlag, RETRY_COOLDOWN_MS);
}

/**
 * React.lazy wrapper for stale/missing deployment chunks.
 * A failed dynamic import gets one cache/service-worker reset and reload.
 * A second failure is surfaced to the route error boundary instead of looping.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (!readReloadFlag() && writeReloadFlag()) {
        try {
          if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.allSettled(regs.map((r) => r.unregister()));
          }
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.allSettled(keys.map((key) => caches.delete(key)));
          }
        } catch {
          // Cache cleanup is best-effort; still perform the single retry.
        }
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
