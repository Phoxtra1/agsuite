/**
 * Reset Client State — wipes all per-user caches when accounts switch or sign out.
 *
 * Prevents:
 *   - dashboard contamination across accounts
 *   - profile reuse from a previous session
 *   - stale localStorage / sessionStorage entries
 */
import type { QueryClient } from "@tanstack/react-query";

const PREFIXES = [
  "suite_",
  "coms_",
  "acs_",
  "amineva_",
  "nkoso_",
  "sikasem_",
  "abi_",
  "profile_",
  "dashboard_",
];

function purgeStorage(storage: Storage) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      const isScopedWorkspaceCache =
        k.includes("::") &&
        (k.startsWith("amineva_workspace_") ||
          k.startsWith("amineva_forms::") ||
          k.startsWith("amineva_drive_"));
      if (
        k === "amineva_theme" ||
        isScopedWorkspaceCache ||
        k.startsWith("amineva_workspace_") ||
        k === "amineva_forms"
      ) {
        continue;
      }
      if (PREFIXES.some((p) => k.startsWith(p))) keys.push(k);
    }
    keys.forEach((k) => storage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function resetClientState(queryClient?: QueryClient) {
  if (typeof window !== "undefined") {
    purgeStorage(window.localStorage);
    purgeStorage(window.sessionStorage);
  }
  queryClient?.clear();
}
