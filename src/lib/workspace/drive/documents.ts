import { supabase } from "@/integrations/supabase/client";

export type DriveKind = "upload" | "doc" | "sheet" | "slide" | "form";

export interface DriveFolder {
  id: string;
  name: string;
  parent_id: string | null;
  owner_id: string;
  color?: string;
  description?: string;
  pinned?: boolean;
  starred?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriveFile {
  id: string;
  name: string;
  kind: DriveKind;
  folder_id: string | null;
  owner_id: string;
  source_id?: string | null;
  storage_path?: string | null;
  mime_type?: string;
  size_bytes: number;
  starred: boolean;
  trashed_at?: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
  workspace_id?: string | null; // Smart Collection or Workspace identifier
}

export interface DriveShare {
  id: string;
  file_id: string;
  token: string;
  access: "view" | "comment" | "edit";
  expires_at: string | null;
  created_by: string;
  created_at: string;
}

export interface DriveActivity {
  id: string;
  action: string;
  item_name: string;
  item_type: "file" | "folder";
  user_email: string;
  created_at: string;
}

const STORAGE_KEY_FOLDERS = "amineva_drive_folders";
const STORAGE_KEY_FILES = "amineva_drive_files";
const STORAGE_KEY_SHARES = "amineva_drive_shares";
const STORAGE_KEY_ACTIVITY = "amineva_drive_activity";

// Get logged-in or fall back user id
async function getUserId(): Promise<string> {
  try {
    const { data: u } = await supabase.auth.getUser();
    return u?.user?.id || "usr-demo";
  } catch {
    return "usr-demo";
  }
}

async function getUserEmail(): Promise<string> {
  try {
    const { data: u } = await supabase.auth.getUser();
    return u?.user?.email || "demo@amineva.com";
  } catch {
    return "demo@amineva.com";
  }
}

// ---- Sync and Local Storage Backups ----

function getLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[drive] Failed to save local key: ${key}`, e);
  }
}

// Add activity log entry
export async function logActivity(action: string, itemName: string, itemType: "file" | "folder") {
  const email = await getUserEmail();
  const logs = getLocal<DriveActivity>(STORAGE_KEY_ACTIVITY);
  const log: DriveActivity = {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    item_name: itemName,
    item_type: itemType,
    user_email: email,
    created_at: new Date().toISOString()
  };
  logs.unshift(log);
  saveLocal(STORAGE_KEY_ACTIVITY, logs.slice(0, 100)); // Keep last 100 logs
}

export async function listActivity(): Promise<DriveActivity[]> {
  return getLocal<DriveActivity>(STORAGE_KEY_ACTIVITY);
}

// ---- Database or Local Fallback Handlers ----

export async function listFolder(folderId: string | null): Promise<{ folders: DriveFolder[]; files: DriveFile[] }> {
  try {
    // Attempt Supabase Fetch
    const { data: foldersData, error: foldersErr } = await supabase
      .from("drive_folders" as any)
      .select("*")
      .eq("parent_id", folderId);

    const { data: filesData, error: filesErr } = await supabase
      .from("drive_files" as any)
      .select("*")
      .eq("folder_id", folderId)
      .is("trashed_at", null);

    if (!foldersErr && !filesErr && foldersData && filesData) {
      saveLocal(STORAGE_KEY_FOLDERS, foldersData);
      saveLocal(STORAGE_KEY_FILES, filesData);
      return { folders: foldersData as any, files: filesData as any };
    }
  } catch (e) {
    console.warn("[drive] Fallback to local indexing", e);
  }

  // Offline/Local Storage mapping
  const allFolders = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
  const allFiles = getLocal<DriveFile>(STORAGE_KEY_FILES);

  const folders = allFolders.filter(f => f.parent_id === folderId);
  const files = allFiles.filter(f => f.folder_id === folderId && !f.trashed_at);

  return { folders, files };
}

export async function createFolder(
  name: string,
  parentId: string | null = null,
  color: string = "sky",
  description: string = ""
): Promise<DriveFolder | null> {
  const owner_id = await getUserId();
  const now = new Date().toISOString();
  const newFolder: DriveFolder = {
    id: `folder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    parent_id: parentId,
    owner_id,
    color,
    description,
    pinned: false,
    starred: false,
    created_at: now,
    updated_at: now
  };

  // Local storage save
  const local = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
  local.unshift(newFolder);
  saveLocal(STORAGE_KEY_FOLDERS, local);

  try {
    const { data, error } = await supabase
      .from("drive_folders" as any)
      .insert({
        name,
        parent_id: parentId,
        owner_id,
        color,
        description,
        pinned: false,
        starred: false
      } as any)
      .select()
      .single();

    if (!error && data) {
      const current = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
      const idx = current.findIndex(f => f.id === newFolder.id);
      if (idx >= 0) current[idx] = data as any;
      saveLocal(STORAGE_KEY_FOLDERS, current);
      await logActivity("Created folder", name, "folder");
      return data as any;
    }
  } catch (e) {
    console.warn("[drive] Offline create folder", e);
  }

  await logActivity("Created folder (offline)", name, "folder");
  return newFolder;
}

export async function uploadFile(
  file: File | { name: string; size: number; type: string },
  folderId: string | null = null,
  kind: DriveKind = "upload",
  sourceId: string | null = null
): Promise<DriveFile | null> {
  const owner_id = await getUserId();
  const now = new Date().toISOString();
  const fileId = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newFile: DriveFile = {
    id: fileId,
    name: file.name,
    kind,
    folder_id: folderId,
    owner_id,
    source_id: sourceId,
    storage_path: kind === "upload" ? `${owner_id}/${folderId || "root"}/${fileId}-${file.name}` : null,
    mime_type: file.type,
    size_bytes: file.size,
    starred: false,
    trashed_at: null,
    created_at: now,
    updated_at: now,
    tags: []
  };

  const local = getLocal<DriveFile>(STORAGE_KEY_FILES);
  local.unshift(newFile);
  saveLocal(STORAGE_KEY_FILES, local);

  // Attempt upload bucket save if active File
  if (kind === "upload" && file instanceof File) {
    try {
      const bucketName = "workspace-drive";
      const { error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(newFile.storage_path!, file);

      if (uploadErr) {
        console.warn("[drive] Bucket upload skipped, storing offline simulation", uploadErr);
      }
    } catch (e) {
      console.warn("[drive] Bucket offline", e);
    }
  }

  // Attempt database save
  try {
    const { data, error } = await supabase
      .from("drive_files" as any)
      .insert({
        name: file.name,
        kind,
        folder_id: folderId,
        owner_id,
        source_id: sourceId,
        storage_path: newFile.storage_path,
        mime_type: file.type,
        size_bytes: file.size,
        starred: false
      } as any)
      .select()
      .single();

    if (!error && data) {
      const current = getLocal<DriveFile>(STORAGE_KEY_FILES);
      const idx = current.findIndex(f => f.id === fileId);
      if (idx >= 0) current[idx] = data as any;
      saveLocal(STORAGE_KEY_FILES, current);
      await logActivity("Uploaded file", file.name, "file");
      return data as any;
    }
  } catch (e) {
    console.warn("[drive] Offline file registration", e);
  }

  await logActivity("Uploaded file (offline)", file.name, "file");
  return newFile;
}

export async function renameItem(id: string, name: string, type: "file" | "folder"): Promise<boolean> {
  const now = new Date().toISOString();
  if (type === "folder") {
    const local = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].name = name;
      local[idx].updated_at = now;
      saveLocal(STORAGE_KEY_FOLDERS, local);
    }
    try {
      await supabase.from("drive_folders" as any).update({ name, updated_at: now }).eq("id", id);
    } catch {}
    await logActivity("Renamed folder to " + name, name, "folder");
  } else {
    const local = getLocal<DriveFile>(STORAGE_KEY_FILES);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].name = name;
      local[idx].updated_at = now;
      saveLocal(STORAGE_KEY_FILES, local);
    }
    try {
      await supabase.from("drive_files" as any).update({ name, updated_at: now }).eq("id", id);
    } catch {}
    await logActivity("Renamed file to " + name, name, "file");
  }
  return true;
}

export async function moveItem(id: string, folderId: string | null, type: "file" | "folder" = "file"): Promise<boolean> {
  const now = new Date().toISOString();
  if (type === "folder") {
    const local = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].parent_id = folderId;
      local[idx].updated_at = now;
      saveLocal(STORAGE_KEY_FOLDERS, local);
    }
    try {
      await supabase.from("drive_folders" as any).update({ parent_id: folderId, updated_at: now }).eq("id", id);
    } catch {}
    await logActivity("Moved folder", local[idx]?.name || id, "folder");
  } else {
    const local = getLocal<DriveFile>(STORAGE_KEY_FILES);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].folder_id = folderId;
      local[idx].updated_at = now;
      saveLocal(STORAGE_KEY_FILES, local);
    }
    try {
      await supabase.from("drive_files" as any).update({ folder_id: folderId, updated_at: now }).eq("id", id);
    } catch {}
    await logActivity("Moved file", local[idx]?.name || id, "file");
  }
  return true;
}

export async function toggleStar(id: string, type: "file" | "folder" = "file"): Promise<boolean> {
  const now = new Date().toISOString();
  if (type === "folder") {
    const local = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].starred = !local[idx].starred;
      local[idx].updated_at = now;
      saveLocal(STORAGE_KEY_FOLDERS, local);
      try {
        await supabase.from("drive_folders" as any).update({ starred: local[idx].starred, updated_at: now }).eq("id", id);
      } catch {}
      await logActivity(local[idx].starred ? "Starred folder" : "Unstarred folder", local[idx].name, "folder");
    }
  } else {
    const local = getLocal<DriveFile>(STORAGE_KEY_FILES);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].starred = !local[idx].starred;
      local[idx].updated_at = now;
      saveLocal(STORAGE_KEY_FILES, local);
      try {
        await supabase.from("drive_files" as any).update({ starred: local[idx].starred, updated_at: now }).eq("id", id);
      } catch {}
      await logActivity(local[idx].starred ? "Starred file" : "Unstarred file", local[idx].name, "file");
    }
  }
  return true;
}

export async function trashItem(id: string, type: "file" | "folder" = "file"): Promise<boolean> {
  const now = new Date().toISOString();
  if (type === "folder") {
    const local = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].starred = false;
      // We set drive_folders custom trashed attribute locally or simply Cascade.
      // For this spec, folders themselves can be soft deleted:
      (local[idx] as any).trashed_at = now;
      saveLocal(STORAGE_KEY_FOLDERS, local);
      await logActivity("Moved folder to trash", local[idx].name, "folder");
    }
  } else {
    const local = getLocal<DriveFile>(STORAGE_KEY_FILES);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].starred = false;
      local[idx].trashed_at = now;
      saveLocal(STORAGE_KEY_FILES, local);
      try {
        await supabase.from("drive_files" as any).update({ trashed_at: now, starred: false }).eq("id", id);
      } catch {}
      await logActivity("Moved file to trash", local[idx].name, "file");
    }
  }
  return true;
}

export async function restoreItem(id: string, type: "file" | "folder" = "file"): Promise<boolean> {
  if (type === "folder") {
    const local = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      delete (local[idx] as any).trashed_at;
      saveLocal(STORAGE_KEY_FOLDERS, local);
      await logActivity("Restored folder", local[idx].name, "folder");
    }
  } else {
    const local = getLocal<DriveFile>(STORAGE_KEY_FILES);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      local[idx].trashed_at = null;
      saveLocal(STORAGE_KEY_FILES, local);
      try {
        await supabase.from("drive_files" as any).update({ trashed_at: null }).eq("id", id);
      } catch {}
      await logActivity("Restored file", local[idx].name, "file");
    }
  }
  return true;
}

export async function purgeItem(id: string, type: "file" | "folder" = "file"): Promise<boolean> {
  if (type === "folder") {
    const local = getLocal<DriveFolder>(STORAGE_KEY_FOLDERS);
    const idx = local.findIndex(f => f.id === id);
    const name = idx >= 0 ? local[idx].name : id;
    saveLocal(STORAGE_KEY_FOLDERS, local.filter(f => f.id !== id));
    try {
      await supabase.from("drive_folders" as any).delete().eq("id", id);
    } catch {}
    await logActivity("Permanently deleted folder", name, "folder");
  } else {
    const local = getLocal<DriveFile>(STORAGE_KEY_FILES);
    const idx = local.findIndex(f => f.id === id);
    if (idx >= 0) {
      const file = local[idx];
      saveLocal(STORAGE_KEY_FILES, local.filter(f => f.id !== id));
      if (file.storage_path) {
        try {
          await supabase.storage.from("workspace-drive").remove([file.storage_path]);
        } catch {}
      }
      try {
        await supabase.from("drive_files" as any).delete().eq("id", id);
      } catch {}
      await logActivity("Permanently deleted file", file.name, "file");
    }
  }
  return true;
}

export async function getSignedUrl(file: DriveFile, ttl: number = 300): Promise<string | null> {
  if (!file.storage_path) return null;
  try {
    const { data, error } = await supabase.storage
      .from("workspace-drive")
      .createSignedUrl(file.storage_path, ttl);
    if (!error && data) return data.signedUrl;
  } catch {}
  return "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop"; // fallback image
}

export async function createShare(fileId: string, access: "view" | "edit" = "view"): Promise<string | null> {
  const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const owner_id = await getUserId();
  const newShare: DriveShare = {
    id: `share-${Date.now()}`,
    file_id: fileId,
    token,
    access,
    expires_at: null,
    created_by: owner_id,
    created_at: new Date().toISOString()
  };

  const local = getLocal<DriveShare>(STORAGE_KEY_SHARES);
  local.push(newShare);
  saveLocal(STORAGE_KEY_SHARES, local);

  try {
    const { data, error } = await supabase
      .from("drive_shares" as any)
      .insert({
        file_id: fileId,
        token,
        access,
        created_by: owner_id
      } as any)
      .select()
      .single();

    if (!error && data) {
      return `/drive/shared/${token}`;
    }
  } catch {}

  return `/drive/shared/${token}`;
}

export async function searchDrive(query: string): Promise<DriveFile[]> {
  const lower = query.toLowerCase();
  const files = getLocal<DriveFile>(STORAGE_KEY_FILES);
  return files.filter(f => f.name.toLowerCase().includes(lower) && !f.trashed_at);
}

export async function storageUsage(): Promise<{ used: number; quota: number }> {
  const files = getLocal<DriveFile>(STORAGE_KEY_FILES);
  const totalBytes = files.filter(f => !f.trashed_at).reduce((acc, curr) => acc + (curr.size_bytes || 0), 0);
  // Free plan is 10 GB
  const quota = 10 * 1024 * 1024 * 1024;
  return { used: totalBytes, quota };
}

// ---- Auto-registration hooks for documents ----
export async function registerWorkspaceDocumentInDrive(
  doc: { id: string; title: string },
  kind: DriveKind
) {
  const owner_id = await getUserId();
  const files = getLocal<DriveFile>(STORAGE_KEY_FILES);

  // check if already registered
  const exists = files.find(f => f.source_id === doc.id && f.kind === kind);
  if (exists) {
    exists.name = doc.title;
    exists.updated_at = new Date().toISOString();
    saveLocal(STORAGE_KEY_FILES, files);
    return;
  }

  const now = new Date().toISOString();
  const newFile: DriveFile = {
    id: `drive-link-${doc.id}`,
    name: doc.title,
    kind,
    folder_id: null,
    owner_id,
    source_id: doc.id,
    storage_path: null,
    mime_type: `application/x-amineva-${kind}`,
    size_bytes: 1024, // simulated size
    starred: false,
    trashed_at: null,
    created_at: now,
    updated_at: now
  };

  files.unshift(newFile);
  saveLocal(STORAGE_KEY_FILES, files);

  try {
    await supabase.from("drive_files" as any).insert({
      name: doc.title,
      kind,
      folder_id: null,
      owner_id,
      source_id: doc.id,
      size_bytes: 1024,
      starred: false
    } as any);
  } catch {}
}
