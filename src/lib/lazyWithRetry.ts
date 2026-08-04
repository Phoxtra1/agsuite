import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "__amv_chunk_reload";

/**
 * React.lazy wrapper that survives stale deploys.
 * When a hashed chunk no longer exists (new build shipped while the tab was open),
 * the dynamic import rejects and we do a single hard reload to fetch the new index.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err) {
      if (sessionStorage.getItem(RELOAD_KEY) !== "1") {
        sessionStorage.setItem(RELOAD_KEY, "1");
        // Drop any stale caches/service workers holding the old asset manifest.
        try {
          if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.allSettled(regs.map((r) => r.unregister()));
          }
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.allSettled(keys.map((k) => caches.delete(k)));
          }
        } catch {
          /* best effort */
        }
        window.location.reload();
        // Never resolves; the page is reloading.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
