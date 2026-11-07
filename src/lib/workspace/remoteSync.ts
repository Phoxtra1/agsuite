/**
 * Remote sync boundary for Workspace tools.
 * Local saves always happen first. The currently configured cloud adapter is
 * self-hosted Appwrite (through the compatibility client); local-only offline
 * sessions never attempt a cloud read, write, or delete.
 */
import { supabase } from "@/integrations/appwrite/client";
import { isWorkspaceOfflineMode } from "@/lib/workspace/localAccess";
import { readWorkspaceCollection, writeWorkspaceCollection } from "@/lib/workspace/localStore";

type Task = () => Promise<unknown>;
interface DeleteTombstone {
  id: string;
  table: string;
  recordId: string;
  deletedAt: string;
}
const TOMBSTONES = "__amineva_workspace_sync_tombstones";
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pending = new Map<string, Task>();
const running = new Map<string, Promise<unknown>>();

function canReachCloud() {
  return !isWorkspaceOfflineMode() && (typeof navigator === "undefined" || navigator.onLine);
}

async function updateTombstone(table: string, recordId: string, remove: boolean) {
  const records = await readWorkspaceCollection<DeleteTombstone>(TOMBSTONES);
  const id = `${table}:${recordId}`;
  const next = remove
    ? records.filter((item) => item.id !== id)
    : [...records.filter((item) => item.id !== id), { id, table, recordId, deletedAt: new Date().toISOString() }];
  await writeWorkspaceCollection(TOMBSTONES, next);
}

async function flushDeleteTombstones() {
  if (!canReachCloud()) return;
  const records = await readWorkspaceCollection<DeleteTombstone>(TOMBSTONES);
  for (const tombstone of records) {
    try {
      const { error } = await supabase.from(tombstone.table as any).delete().eq("id", tombstone.recordId);
      if (!error) await updateTombstone(tombstone.table, tombstone.recordId, true);
    } catch (error) {
      console.warn("[workspace-sync] Deferred delete remains queued", error);
    }
  }
}

async function run(key: string) {
  const timer = timers.get(key);
  if (timer) clearTimeout(timer);
  timers.delete(key);
  if (!canReachCloud()) return;
  const previous = running.get(key);
  if (previous) await previous.catch(() => null);
  if (!canReachCloud()) return;
  const task = pending.get(key);
  if (!task) return;
  pending.delete(key);
  const current = task().catch((error) => console.warn(`[workspace-sync] ${key} failed`, error));
  running.set(key, current);
  await current;
  if (running.get(key) === current) running.delete(key);
}

export function scheduleRemote(key: string, task: Task, delay = 700) {
  if (!canReachCloud()) return;
  pending.set(key, task);
  const timer = timers.get(key);
  if (timer) clearTimeout(timer);
  timers.set(key, setTimeout(() => void run(key), delay));
}

export function flushRemote() {
  if (!canReachCloud()) return;
  for (const key of Array.from(pending.keys())) void run(key);
  void flushDeleteTombstones();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushRemote);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushRemote();
  });
  window.addEventListener("online", flushRemote);
}

export function isRemoteId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(id);
}

export function isRealUser(userId: unknown): userId is string {
  return typeof userId === "string" && !!userId && userId !== "local-user" && userId !== "anon";
}

export async function upsertRemote(table: string, id: string, row: Record<string, any>): Promise<boolean> {
  if (!canReachCloud()) return false;
  const { id: _drop, ...rest } = row;
  const update = await supabase.from(table as any).update(rest).eq("id", id);
  if (!update.error && Array.isArray(update.data) && update.data.length > 0) return true;
  const insert = await supabase.from(table as any).insert({ ...rest, id });
  if (insert.error) throw new Error(insert.error.message);
  return true;
}

export function deleteRemote(table: string, id: string) {
  pending.delete(`${table}:${id}`);
  void updateTombstone(table, id, false).then(() => flushDeleteTombstones());
}

export async function suppressTombstonedRemoteRows<T extends { id: string }>(table: string, rows: T[]): Promise<T[]> {
  const tombstones = await readWorkspaceCollection<DeleteTombstone>(TOMBSTONES);
  if (tombstones.some((item) => item.table === table) && canReachCloud()) {
    await flushDeleteTombstones();
  }
  const remaining = await readWorkspaceCollection<DeleteTombstone>(TOMBSTONES);
  const deleted = new Set(remaining.filter((item) => item.table === table).map((item) => item.recordId));
  return rows.filter((row) => !deleted.has(row.id));
}

const timestamp = (value: unknown) => {
  const parsed = new Date(String(value ?? 0)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export function reconcile<T extends { id: string }>(options: {
  table: string;
  local: T[];
  remote: T[];
  userId: string;
  updatedAt: (record: T) => unknown;
  toRow: (record: T, userId: string) => Record<string, any>;
}): T[] {
  const { table, local, remote, userId, updatedAt, toRow } = options;
  const merged = [...local];
  const remoteById = new Map(remote.map((record) => [record.id, record]));
  for (const record of remote) {
    const index = merged.findIndex((item) => item.id === record.id);
    if (index < 0) merged.push(record);
    else if (timestamp(updatedAt(record)) > timestamp(updatedAt(merged[index]))) merged[index] = record;
  }
  if (canReachCloud() && isRealUser(userId)) {
    for (const record of local) {
      if (!isRemoteId(record.id)) continue;
      const remoteRecord = remoteById.get(record.id);
      if (!remoteRecord || timestamp(updatedAt(record)) > timestamp(updatedAt(remoteRecord))) {
        scheduleRemote(`${table}:${record.id}`, () => upsertRemote(table, record.id, toRow(record, userId)), 50);
      }
    }
  }
  merged.sort((a, b) => timestamp(updatedAt(b)) - timestamp(updatedAt(a)));
  return merged;
}
