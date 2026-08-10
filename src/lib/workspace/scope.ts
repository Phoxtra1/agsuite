/**
 * Workspace Scope — binds every offline/local Workspace cache to the signed-in account.
 *
 * Without this, all Workspace caches (docs, sheets, slides, forms, drive) used
 * global localStorage keys, so a second account signing in on the same browser
 * saw the first account's content — which looked like "the same dashboard".
 *
 * Every cache key is now suffixed with the active user id, and caches belonging
 * to other accounts are purged whenever the active account changes.
 */

const UID_KEY = "amineva_active_uid";

/** Legacy (unscoped) keys that must never be read again. */
const LEGACY_KEYS = [
  "amineva_workspace_docs",
  "amineva_workspace_sheets",
  "amineva_workspace_slides",
  "amineva_forms",
  "amineva_drive_uploaded_files",
  "amineva_drive_folders",
  "amineva_drive_starred_ids",
  "amineva_drive_trashed_ids",
  "amineva_drive_item_folders",
  "amineva_drive_item_names",
  "amineva_drive_custom_name",
  "amineva_drive_activity_log",
  "amineva_drive_pinned_ids",
  "amineva_drive_files",
  "amineva_drive_shares",
  "amineva_drive_activity",
];

let activeUid: string | null = null;

export function getWorkspaceUser(): string {
  if (activeUid) return activeUid;
  try {
    return localStorage.getItem(UID_KEY) || "anon";
  } catch {
    return "anon";
  }
}

/** Scoped cache key for the currently active account. */
export function wsKey(base: string): string {
  return `${base}::${getWorkspaceUser()}`;
}

/** Remove legacy unscoped caches and any cache belonging to another account. */
export function purgeForeignWorkspaceCaches(uid: string) {
  if (typeof window === "undefined") return;
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const base = LEGACY_KEYS.find((b) => k.startsWith(`${b}::`));
      if (base && k !== `${base}::${uid}`) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Called on every sign-in / sign-out / account switch. */
export function setWorkspaceUser(uid: string | null) {
  activeUid = uid;
  try {
    if (uid) localStorage.setItem(UID_KEY, uid);
    else localStorage.removeItem(UID_KEY);
  } catch {
    /* ignore */
  }
  purgeForeignWorkspaceCaches(uid || "anon");
}
