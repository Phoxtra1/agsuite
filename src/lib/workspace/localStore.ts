/**
 * Local-first Workspace record store.
 *
 * Rich editor data belongs in IndexedDB, not localStorage. Records are scoped
 * by the active Workspace identity and stored individually so editing one
 * document does not rewrite every document in the account.
 *
 * Existing account-scoped localStorage collections are migrated on first read.
 * The old key is removed only after the IndexedDB transaction commits.
 */

import { getWorkspaceUser, wsKey } from "@/lib/workspace/scope";

const DB_NAME = "amineva-workspace-local";
const DB_VERSION = 2;
const RECORDS_STORE = "records";
const META_STORE = "meta";
const BLOBS_STORE = "blobs";

interface StoredRecord<T = unknown> {
  key: string;
  scope: string;
  id: string;
  value: T;
  updatedAt: string;
}

interface StoredMeta {
  key: string;
  value: boolean;
}

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not support IndexedDB."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(RECORDS_STORE)) {
          const store = db.createObjectStore(RECORDS_STORE, { keyPath: "key" });
          store.createIndex("scope", "scope", { unique: false });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(BLOBS_STORE)) {
          const blobs = db.createObjectStore(BLOBS_STORE, { keyPath: "key" });
          blobs.createIndex("scope", "scope", { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          databasePromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        databasePromise = null;
        reject(request.error || new Error("Unable to open Workspace local storage."));
      };
      request.onblocked = () => {
        databasePromise = null;
        reject(new Error("Workspace storage is blocked by another open tab. Close older Amineva tabs and retry."));
      };
    });
  }

  return databasePromise;
}

function currentScope(collection: string): string {
  return `${getWorkspaceUser()}::${collection}`;
}

function recordKey(scope: string, id: string): string {
  return `${scope}::${id}`;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Workspace storage request failed."));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Workspace storage transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("Workspace storage transaction was aborted."));
  });
}

function timestampOf(value: any): number {
  const raw = value?.updated_at ?? value?.updatedAt ?? value?.created_at ?? value?.createdAt ?? 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

async function getAllInScope<T>(db: IDBDatabase, scope: string): Promise<StoredRecord<T>[]> {
  const tx = db.transaction(RECORDS_STORE, "readonly");
  const request = tx.objectStore(RECORDS_STORE).index("scope").getAll(IDBKeyRange.only(scope));
  const rows = await requestResult(request) as StoredRecord<T>[];
  await transactionDone(tx);
  return rows;
}

async function hasMeta(db: IDBDatabase, key: string): Promise<boolean> {
  const tx = db.transaction(META_STORE, "readonly");
  const result = await requestResult(tx.objectStore(META_STORE).get(key)) as StoredMeta | undefined;
  await transactionDone(tx);
  return !!result?.value;
}

async function markMeta(db: IDBDatabase, key: string): Promise<void> {
  const tx = db.transaction(META_STORE, "readwrite");
  tx.objectStore(META_STORE).put({ key, value: true } satisfies StoredMeta);
  await transactionDone(tx);
}

async function migrateLegacyCollection<T extends { id?: string }>(db: IDBDatabase, collection: string, scope: string): Promise<void> {
  const marker = `migrated::${scope}`;
  if (await hasMeta(db, marker)) return;

  const uid = getWorkspaceUser();
  const legacyKey = wsKey(collection);
  let legacy: T[] = [];
  try {
    const raw = localStorage.getItem(legacyKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) legacy = parsed.filter((item) => item && typeof item === "object");
    }
  } catch (error) {
    console.warn(`[workspace-storage] Could not read legacy cache ${legacyKey}.`, error);
  }

  // Adopt records left in a temporary local scope before sign-in completed.
  const placeholderScopes = uid !== "anon" && uid !== "local-user"
    ? [`anon::${collection}`, `local-user::${collection}`]
    : [];
  const existing = await getAllInScope<T>(db, scope);
  const candidates = new Map<string, T>();
  for (const row of existing) candidates.set(row.id, row.value);
  for (const item of legacy) {
    if (item.id) {
      const current = candidates.get(item.id);
      if (!current || timestampOf(item) >= timestampOf(current)) candidates.set(item.id, item);
    }
  }
  for (const placeholderScope of placeholderScopes) {
    const rows = await getAllInScope<T>(db, placeholderScope);
    for (const row of rows) {
      if (!row.id) continue;
      const current = candidates.get(row.id);
      if (!current || timestampOf(row.value) >= timestampOf(current)) candidates.set(row.id, row.value);
    }
  }

  const tx = db.transaction([RECORDS_STORE, META_STORE], "readwrite");
  const store = tx.objectStore(RECORDS_STORE);
  for (const [id, value] of candidates) {
    store.put({
      key: recordKey(scope, id),
      scope,
      id,
      value,
      updatedAt: new Date(timestampOf(value) || Date.now()).toISOString(),
    } satisfies StoredRecord<T>);
  }
  tx.objectStore(META_STORE).put({ key: marker, value: true } satisfies StoredMeta);
  if (uid !== "anon" && uid !== "local-user") {
    tx.objectStore(META_STORE).put({ key: `adopted::${scope}`, value: true } satisfies StoredMeta);
  }
  await transactionDone(tx);

  // Keep the old copy unless the IndexedDB transaction has safely committed.
  if (legacy.length && typeof localStorage !== "undefined") {
    try { localStorage.removeItem(legacyKey); } catch { /* keep the IndexedDB copy */ }
  }
}

export async function readWorkspaceCollection<T extends { id?: string }>(collection: string): Promise<T[]> {
  // Non-browser test environments may not expose IndexedDB. Keep the same
  // scoped API with a localStorage fallback; production browsers use IndexedDB.
  if (typeof indexedDB === "undefined") {
    try {
      const raw = localStorage.getItem(wsKey(collection));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  const db = await openDatabase();
  const scope = currentScope(collection);
  await migrateLegacyCollection<T>(db, collection, scope);

  const primary = await getAllInScope<T>(db, scope);
  const uid = getWorkspaceUser();
  let records = primary;
  if (uid !== "anon" && uid !== "local-user") {
    const adopted = await hasMeta(db, `adopted::${scope}`);
    if (!adopted) {
      await migrateLegacyCollection<T>(db, collection, scope);
      records = await getAllInScope<T>(db, scope);
    }
  }
  return records
    .map((row) => row.value)
    .sort((a: any, b: any) => timestampOf(b) - timestampOf(a));
}

export async function writeWorkspaceCollection<T extends { id?: string }>(collection: string, values: T[]): Promise<void> {
  if (typeof indexedDB === "undefined") {
    localStorage.setItem(wsKey(collection), JSON.stringify(values));
    return;
  }
  const db = await openDatabase();
  const scope = currentScope(collection);
  await migrateLegacyCollection<T>(db, collection, scope);
  const existing = await getAllInScope<T>(db, scope);
  const next = new Map<string, T>();
  for (const value of values) {
    if (value?.id) next.set(value.id, value);
  }

  const tx = db.transaction(RECORDS_STORE, "readwrite");
  const store = tx.objectStore(RECORDS_STORE);
  for (const row of existing) {
    if (!next.has(row.id)) store.delete(row.key);
  }
  for (const [id, value] of next) {
    const previous = existing.find((row) => row.id === id);
    if (previous && JSON.stringify(previous.value) === JSON.stringify(value)) continue;
    store.put({
      key: recordKey(scope, id),
      scope,
      id,
      value,
      updatedAt: new Date(timestampOf(value) || Date.now()).toISOString(),
    } satisfies StoredRecord<T>);
  }
  await transactionDone(tx);
}

export async function clearWorkspaceCollection(collection: string): Promise<void> {
  const db = await openDatabase();
  const scope = currentScope(collection);
  const existing = await getAllInScope(db, scope);
  const tx = db.transaction(RECORDS_STORE, "readwrite");
  const store = tx.objectStore(RECORDS_STORE);
  existing.forEach((row) => store.delete(row.key));
  await transactionDone(tx);
}


interface StoredBlob {
  key: string;
  scope: string;
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  updatedAt: string;
}

export async function putWorkspaceBlob(id: string, blob: Blob, name = "file"): Promise<void> {
  if (typeof indexedDB === "undefined") {
    throw new Error("This browser does not support local file storage.");
  }
  const db = await openDatabase();
  const scope = currentScope("amineva_drive_blobs");
  const tx = db.transaction(BLOBS_STORE, "readwrite");
  tx.objectStore(BLOBS_STORE).put({
    key: recordKey(scope, id),
    scope,
    id,
    blob,
    name,
    type: blob.type || "application/octet-stream",
    size: blob.size,
    updatedAt: new Date().toISOString(),
  } satisfies StoredBlob);
  await transactionDone(tx);
}

export async function getWorkspaceBlob(id: string): Promise<StoredBlob | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDatabase();
  const scope = currentScope("amineva_drive_blobs");
  const tx = db.transaction(BLOBS_STORE, "readonly");
  const result = await requestResult(tx.objectStore(BLOBS_STORE).get(recordKey(scope, id))) as StoredBlob | undefined;
  await transactionDone(tx);
  return result ?? null;
}

export async function deleteWorkspaceBlob(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDatabase();
  const scope = currentScope("amineva_drive_blobs");
  const tx = db.transaction(BLOBS_STORE, "readwrite");
  tx.objectStore(BLOBS_STORE).delete(recordKey(scope, id));
  await transactionDone(tx);
}


export async function moveWorkspaceBlob(fromId: string, toId: string): Promise<void> {
  if (fromId === toId || typeof indexedDB === "undefined") return;
  const existing = await getWorkspaceBlob(fromId);
  if (!existing) return;
  const db = await openDatabase();
  const scope = currentScope("amineva_drive_blobs");
  const tx = db.transaction(BLOBS_STORE, "readwrite");
  const store = tx.objectStore(BLOBS_STORE);
  store.put({
    ...existing,
    key: recordKey(scope, toId),
    id: toId,
    updatedAt: new Date().toISOString(),
  } satisfies StoredBlob);
  store.delete(recordKey(scope, fromId));
  await transactionDone(tx);
}
