/**
 * App Context — resolves the "current application" for centralized auth.
 *
 * In this codebase, the running project IS the Amineva Suite hub (slug = "suite").
 * Sub-products (AGIS, AminevaOps, Amniva, etc.) live in their own deployments and
 * will set their own APP_SLUG when they integrate with the central auth suite.
 *
 * Future apps only need to set VITE_APP_SLUG (or override with setCurrentAppSlug)
 * — no other plumbing changes required.
 */

const ENV_SLUG = (import.meta.env.VITE_APP_SLUG as string | undefined)?.trim();

let runtimeSlug: string | null = null;

export function getCurrentAppSlug(): string {
  return runtimeSlug || ENV_SLUG || "suite";
}

export function setCurrentAppSlug(slug: string) {
  runtimeSlug = slug;
}
