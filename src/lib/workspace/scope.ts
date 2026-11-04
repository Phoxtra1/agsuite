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
/** Remove only legacy unscoped caches. Account-scoped caches belonging to
 * other users are retained: wsKey() prevents cross-account reads, while
 * retaining them prevents an account switch from destroying the previous
 * user's offline work.
 */
export function purgeForeignWorkspaceCaches(_uid: string) {
  if (typeof window === "undefined") return;
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
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
  // Only purge on a switch to a different REAL account. Placeholder ids
  // (used briefly while sign-in is still restoring after a browser restart)
  // must never wipe the signed-in user's saved work.
  if (uid && uid !== "anon" && uid !== "local-user") {
    adoptPlaceholderCaches(uid);
    purgeForeignWorkspaceCaches(uid);
  }
}

/**
 * Work typed while sign-in was still restoring is saved under a placeholder
 * id ("anon" / "local-user"). Fold it into the real account so it isn't lost.
 */
function adoptPlaceholderCaches(uid: string) {
  try {
    for (const base of LEGACY_KEYS) {
      for (const ph of ["anon", "local-user"]) {
        const phKey = `${base}::${ph}`;
        const raw = localStorage.getItem(phKey);
        if (!raw) continue;
        const realKey = `${base}::${uid}`;
        const existingRaw = localStorage.getItem(realKey);
        const a = JSON.parse(raw);
        const b = existingRaw ? JSON.parse(existingRaw) : null;
        let merged: any = a;
        if (Array.isArray(a) && (Array.isArray(b) || b == null)) {
          const map = new Map<string, any>();
          for (const it of [...(b || []), ...a]) {
            const id = it?.id ?? JSON.stringify(it);
            const prev = map.get(id);
            if (!prev || new Date(it?.updated_at || 0).getTime() >= new Date(prev?.updated_at || 0).getTime()) map.set(id, it);
          }
          merged = Array.from(map.values());
        } else if (b != null) {
          merged = b;
        }
        localStorage.setItem(realKey, JSON.stringify(merged));
        localStorage.removeItem(phKey);
      }
    }
  } catch {
    /* ignore */
  }
}
