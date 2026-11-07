import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "__amv_chunk_reload";

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

/**
 * React.lazy wrapper that survives stale deploys and unavailable browser storage.
 * A failed dynamic import triggers one cache/service-worker reset and reload.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      clearReloadFlag();
      return mod;
    } catch (err) {
      if (!readReloadFlag() && writeReloadFlag()) {
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
          /* best effort: the retry must still happen */
        }
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
