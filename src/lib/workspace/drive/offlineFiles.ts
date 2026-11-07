import {
  getWorkspaceBlob,
  putWorkspaceBlob,
  readWorkspaceCollection,
  writeWorkspaceCollection,
} from "@/lib/workspace/localStore";
import { getWorkspaceUser } from "@/lib/workspace/scope";

const QUEUE_COLLECTION = "amineva_drive_sync_queue";
const LEGACY_DB_NAME = "amineva-workspace";
const LEGACY_STORE_NAME = "drive-upload-queue";

interface DriveQueueRecord {
  id: string;
  path: string;
  action: "upload" | "delete";
  name?: string;
  type?: string;
  blobId?: string;
}

interface LegacyQueuedUpload {
  path: string;
  file: Blob;
  name: string;
  type: string;
}

function uploadIdFromPath(path: string): string {
  const filename = path.split("/").pop() || "";
  const match = filename.match(/^(upload-\d+-[a-zA-Z0-9]+)-/);
  return match?.[1] || `upload-restored-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getQueue(): Promise<DriveQueueRecord[]> {
  return readWorkspaceCollection<DriveQueueRecord>(QUEUE_COLLECTION);
}

async function saveQueue(records: DriveQueueRecord[]): Promise<void> {
  await writeWorkspaceCollection(QUEUE_COLLECTION, records);
}

function openLegacyDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(LEGACY_DB_NAME, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function migrateLegacyQueueForCurrentAccount(): Promise<void> {
  const userId = getWorkspaceUser();
  if (!userId || userId === "anon" || userId === "local-user") return;
  const db = await openLegacyDatabase();
  if (!db) return;
  if (!db.objectStoreNames.contains(LEGACY_STORE_NAME)) {
    db.close();
    return;
  }

  const legacy = await new Promise<LegacyQueuedUpload[]>((resolve) => {
    const request = db.transaction(LEGACY_STORE_NAME, "readonly")
      .objectStore(LEGACY_STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as LegacyQueuedUpload[]);
    request.onerror = () => resolve([]);
  });

  const prefix = `${userId}/`;
  for (const item of legacy) {
    if (!item?.path?.startsWith(prefix) || !item.file) continue;
    const blobId = uploadIdFromPath(item.path);
    try {
      await putWorkspaceBlob(blobId, item.file, item.name || "file");
      const records = await getQueue();
      if (!records.some((record) => record.path === item.path)) {
        await saveQueue([...records, {
          id: item.path,
          path: item.path,
          action: "upload",
          name: item.name || "file",
          type: item.type || item.file.type || "application/octet-stream",
          blobId,
        }]);
      }
      await new Promise<void>((resolve) => {
        const tx = db.transaction(LEGACY_STORE_NAME, "readwrite");
        tx.objectStore(LEGACY_STORE_NAME).delete(item.path);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      });
    } catch (error) {
      console.warn("[drive-sync] Could not migrate an older queued upload", error);
    }
  }
  db.close();
}

export async function queueDriveUpload(path: string, file: Blob, name = (file as File).name || "file", type = file.type): Promise<void> {
  const blobId = uploadIdFromPath(path);
  await putWorkspaceBlob(blobId, file, name);
  const records = await getQueue();
  await saveQueue([
    ...records.filter((record) => record.path !== path),
    {
      id: path,
      path,
      action: "upload",
      name,
      type: type || "application/octet-stream",
      blobId,
    },
  ]);
}

export async function listQueuedDriveUploads(): Promise<Array<{ path: string; file: Blob; name: string; type: string }>> {
  await migrateLegacyQueueForCurrentAccount();
  const records = (await getQueue()).filter((record) => record.action === "upload");
  const uploads: Array<{ path: string; file: Blob; name: string; type: string }> = [];
  for (const record of records) {
    if (!record.blobId) continue;
    const stored = await getWorkspaceBlob(record.blobId).catch(() => null);
    if (!stored) continue;
    uploads.push({
      path: record.path,
      file: stored.blob,
      name: record.name || stored.name,
      type: record.type || stored.type,
    });
  }
  return uploads;
}

export async function removeQueuedDriveUpload(path: string): Promise<void> {
  const records = await getQueue();
  await saveQueue(records.filter((record) => record.path !== path));
}

export async function queueDriveDelete(path: string): Promise<void> {
  const records = await getQueue();
  await saveQueue([
    ...records.filter((record) => record.path !== path),
    { id: path, path, action: "delete" },
  ]);
}

export async function listQueuedDriveDeletes(): Promise<Array<{ path: string }>> {
  return (await getQueue())
    .filter((record) => record.action === "delete")
    .map(({ path }) => ({ path }));
}

export async function removeQueuedDriveDelete(path: string): Promise<void> {
  await removeQueuedDriveUpload(path);
}
