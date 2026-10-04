/**
 * Remote sync for Workspace tools (Docs, Sheets, Slides, Forms).
 *
 * Rules that keep typed work safe:
 *  - The browser copy is always written first and is the source of truth for
 *    the editor. Server responses NEVER overwrite a record that is open.
 *  - Server writes are coalesced per record and run one at a time, so a slow
 *    older write can never land after a newer one.
 *  - Every server write carries the record's own `updated_at`, so the
 *    "which copy is newer" comparison is exact.
 *  - When a list loads, any record that is newer in this browser (or missing
 *    on the server) is pushed up automatically — work done offline or before
 *    sign-in finished is never stranded on one device.
 */
import { supabase } from "@/integrations/appwrite/client";

type Task = () => Promise<unknown>;

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pending = new Map<string, Task>();
const running = new Map<string, Promise<unknown>>();

async function run(key: string) {
  const t = timers.get(key);
  if (t) clearTimeout(t);
  timers.delete(key);
  const prev = running.get(key);
  if (prev) await prev.catch(() => null);
  const task = pending.get(key);
  if (!task) return;
  pending.delete(key);
  const p = task().catch((e) => console.warn(`[workspace-sync] ${key} failed`, e));
  running.set(key, p);
  await p;
  if (running.get(key) === p) running.delete(key);
}

/** Queue the latest server write for a record; older queued writes are dropped. */
export function scheduleRemote(key: string, task: Task, delay = 700) {
  pending.set(key, task);
  const t = timers.get(key);
  if (t) clearTimeout(t);
  timers.set(key, setTimeout(() => void run(key), delay));
}

export function flushRemote() {
  for (const key of Array.from(pending.keys())) void run(key);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushRemote);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushRemote();
  });
  window.addEventListener("online", flushRemote);
}

/** Appwrite document ids: ≤36 chars, a-z A-Z 0-9 . - _ , not starting with a symbol. */
export function isRemoteId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(id);
}

export function isRealUser(userId: unknown): userId is string {
  return typeof userId === "string" && !!userId && userId !== "local-user" && userId !== "anon";
}

/** Update the server copy, or create it if it doesn't exist yet. */
export async function upsertRemote(table: string, id: string, row: Record<string, any>): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  const { id: _drop, ...rest } = row;
  const upd = await supabase.from(table as any).update(rest).eq("id", id);
  if (!upd.error && Array.isArray(upd.data) && upd.data.length > 0) return true;
  const ins = await supabase.from(table as any).insert({ ...rest, id });
  if (ins.error) throw new Error(ins.error.message);
  return true;
}

export function deleteRemote(table: string, id: string) {
  pending.delete(`${table}:${id}`);
  void supabase.from(table as any).delete().eq("id", id).then(() => null, () => null);
}

const ts = (v: unknown) => {
  const n = new Date(String(v ?? 0)).getTime();
  return Number.isFinite(n) ? n : 0;
};

/**
 * Merge server and browser lists. Newer copy wins per record; browser records
 * that are newer or missing on the server get pushed up.
 */
export function reconcile<T extends { id: string }>(opts: {
  table: string;
  local: T[];
  remote: T[];
  userId: string;
  updatedAt: (r: T) => unknown;
  toRow: (r: T, userId: string) => Record<string, any>;
}): T[] {
  const { table, local, remote, userId, updatedAt, toRow } = opts;
  const merged = [...local];
  const remoteById = new Map(remote.map((r) => [r.id, r]));
  for (const r of remote) {
    const idx = merged.findIndex((m) => m.id === r.id);
    if (idx < 0) merged.push(r);
    else if (ts(updatedAt(r)) > ts(updatedAt(merged[idx]))) merged[idx] = r;
  }
  if (isRealUser(userId)) {
    for (const l of local) {
      if (!isRemoteId(l.id)) continue;
      const r = remoteById.get(l.id);
      if (!r || ts(updatedAt(l)) > ts(updatedAt(r))) {
        scheduleRemote(`${table}:${l.id}`, () => upsertRemote(table, l.id, toRow(l, userId)), 50);
      }
    }
  }
  merged.sort((a, b) => ts(updatedAt(b)) - ts(updatedAt(a)));
  return merged;
}
