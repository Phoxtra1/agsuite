import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen, FolderPlus, UploadCloud, Plus, Search, LayoutGrid, List as ListIcon,
  FileText, Sheet as SheetIcon, Presentation, ClipboardList, File, MoreVertical,
  Trash2, Copy, Pencil, Star, Download, HardDrive, ArrowLeft, Eye, Check, X,
  ChevronRight, ChevronLeft, Filter, Clock, Share2, Info, ArrowUpRight,
  Home as HomeIcon, Users as UsersIcon, Activity as ActivityIcon, AlertCircle, Sparkles, Pin
} from "lucide-react";
import { listDocuments, createDocument, duplicateDocument, type WorkspaceDocument } from "@/lib/workspace/documents";
import { listSheets, createSheet, duplicateSheet, type WorkspaceSheet } from "@/lib/workspace/sheets/documents";
import { listDecks, createDeck, duplicateDeck, type WorkspaceSlideDoc } from "@/lib/workspace/slides/documents";
import { listForms, createForm, duplicateForm, type FormDocument } from "@/lib/workspace/forms/documents";
import { useAuth } from "@/contexts/AuthContext";
import { wsKey } from "@/lib/workspace/scope";
import { saveDriveToDatabase, loadDriveFromDatabase } from "@/lib/workspace/drive/sync";
import { listQueuedDriveUploads, queueDriveUpload, removeQueuedDriveUpload, listQueuedDriveDeletes, queueDriveDelete, removeQueuedDriveDelete } from "@/lib/workspace/drive/offlineFiles";
import { getWorkspaceBlob, putWorkspaceBlob, deleteWorkspaceBlob } from "@/lib/workspace/localStore";
import { useWorkspaceSession } from "@/components/workspace/WorkspaceGate";
import { supabase } from "@/integrations/appwrite/client";
import { isWorkspaceOfflineMode } from "@/lib/workspace/localAccess";
import { toast } from "@/hooks/use-toast";

export interface DriveUploadedFile {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // mime / category
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  starred?: boolean;
  storagePath?: string;
  syncStatus?: "pending" | "synced";
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  color?: string;
  pinned?: boolean;
}

export interface DriveItem {
  id: string;
  title: string;
  kind: "folder" | "doc" | "sheet" | "slide" | "form" | "upload";
  route?: string;
  sizeFormatted: string;
  sizeBytes: number;
  updatedAt: string;
  starred: boolean;
  pinned?: boolean;
  folderId?: string;
  originalRef?: any;
}

export interface ActivityEntry {
  id: string;
  action: string;
  name: string;
  timestamp: string;
}

const STORAGE_FILES_KEY = "amineva_drive_uploaded_files";
const STORAGE_FOLDERS_KEY = "amineva_drive_folders";
const STORAGE_STARRED_KEY = "amineva_drive_starred_ids";
const STORAGE_TRASHED_KEY = "amineva_drive_trashed_ids";
const STORAGE_ITEM_FOLDERS_KEY = "amineva_drive_item_folders";
const STORAGE_ITEM_NAMES_KEY = "amineva_drive_item_names";
const STORAGE_DRIVE_NAME_KEY = "amineva_drive_custom_name";
const STORAGE_VIEW_MODE_KEY = "amineva_drive_view_mode";
const STORAGE_SIDEBAR_COLLAPSED_KEY = "amineva_drive_sidebar_collapsed";
const STORAGE_ACTIVITY_KEY = "amineva_drive_activity_log";
const STORAGE_PINNED_KEY = "amineva_drive_pinned_ids";

function getLocalUploadedFiles(): DriveUploadedFile[] {
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_FILES_KEY));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUploadedFiles(files: DriveUploadedFile[]) {
  try {
    localStorage.setItem(wsKey(STORAGE_FILES_KEY), JSON.stringify(files));
  } catch (e) {
    console.error("Failed to save uploaded files", e);
  }
}

function getLocalFolders(): DriveFolder[] {
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_FOLDERS_KEY));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFolders(folders: DriveFolder[]) {
  try {
    localStorage.setItem(wsKey(STORAGE_FOLDERS_KEY), JSON.stringify(folders));
  } catch (e) {
    console.error("Failed to save folders", e);
  }
}

function getStarredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_STARRED_KEY));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveStarredIds(ids: Set<string>) {
  try {
    localStorage.setItem(wsKey(STORAGE_STARRED_KEY), JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error("Failed to save starred IDs", e);
  }
}

function getPinnedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_PINNED_KEY));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function savePinnedIds(ids: Set<string>) {
  try {
    localStorage.setItem(wsKey(STORAGE_PINNED_KEY), JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error("Failed to save pinned IDs", e);
  }
}

function getTrashedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_TRASHED_KEY));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveTrashedIds(ids: Set<string>) {
  try {
    localStorage.setItem(wsKey(STORAGE_TRASHED_KEY), JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error("Failed to save trashed IDs", e);
  }
}

function getItemFolders(): Record<string, string> {
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_ITEM_FOLDERS_KEY));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveItemFolders(mapping: Record<string, string>) {
  try {
    localStorage.setItem(wsKey(STORAGE_ITEM_FOLDERS_KEY), JSON.stringify(mapping));
  } catch (e) {
    console.error("Failed to save item folders mapping", e);
  }
}

function getItemNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_ITEM_NAMES_KEY));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveItemNames(names: Record<string, string>) {
  try {
    localStorage.setItem(wsKey(STORAGE_ITEM_NAMES_KEY), JSON.stringify(names));
  } catch (e) {
    console.error("Failed to save item names", e);
  }
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 KB";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(dm);
  return formatted + " " + sizes[i];
}

function jsonSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value ?? null)).byteLength;
}

function logDriveActivity(action: string, name: string) {
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_ACTIVITY_KEY));
    const list: ActivityEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      name,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(wsKey(STORAGE_ACTIVITY_KEY), JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error("Failed to log drive activity", e);
  }
}

export default function DriveList() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth() as any;
  const workspaceSession = useWorkspaceSession();
  const driveUserId = workspaceSession.userId || user?.id || "";

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<DriveUploadedFile[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(getStarredIds());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(getPinnedIds());
  const [trashedIds, setTrashedIds] = useState<Set<string>>(getTrashedIds());
  const [itemFolders, setItemFolders] = useState<Record<string, string>>(getItemFolders());
  const [itemNames, setItemNames] = useState<Record<string, string>>(getItemNames());
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([]);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_SIDEBAR_COLLAPSED_KEY) === "true";
  });

  // Custom main drive name
  const [driveName, setDriveName] = useState<string>(() => {
    return localStorage.getItem(wsKey(STORAGE_DRIVE_NAME_KEY)) || "My Drive";
  });

  // Sidebar navigation tab state - defaulted to "home" now!
  const [activeTab, setActiveTab] = useState<"home" | "my-drive" | "recent" | "starred" | "trash" | "shared-with-me" | "activity">("home");

  // Content Filter state (top horizontal filter bar)
  const [contentFilter, setContentFilter] = useState<"all" | "doc" | "sheet" | "slide" | "form" | "upload">("all");

  // Five View Modes
  const [viewMode, setViewMode] = useState<"large-grid" | "medium-grid" | "small-grid" | "compact-list" | "detailed-list">(() => {
    return (localStorage.getItem(STORAGE_VIEW_MODE_KEY) as any) || "medium-grid";
  });

  // Filters & Search
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);
  const [menuForId, setMenuForId] = useState<string | null>(null);

  // Drag & drop highlight states
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Dialog states for folder actions
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<DriveItem | null>(null);
  const [isMultiMoveOpen, setIsMultiMoveOpen] = useState(false);

  // Restore destination chooser states
  const [restoreTarget, setRestoreTarget] = useState<DriveItem | null>(null);
  const [isRestoreDestOpen, setIsRestoreDestOpen] = useState(false);

  // Backup state to DB helper
  const syncWithDatabase = async (
    updatedFolders: DriveFolder[],
    updatedUploads: DriveUploadedFile[],
    updatedStarred: Set<string>,
    updatedPinned: Set<string>,
    updatedTrashed: Set<string>,
    updatedItemFolders: Record<string, string>,
    updatedItemNames: Record<string, string>,
    updatedDriveName: string
  ) => {
    setSyncing(true);
    await saveDriveToDatabase({
      folders: updatedFolders,
      uploadedFiles: updatedUploads,
      starredIds: Array.from(updatedStarred),
      pinnedIds: Array.from(updatedPinned),
      trashedIds: Array.from(updatedTrashed),
      itemFolders: updatedItemFolders,
      itemNames: updatedItemNames,
      driveName: updatedDriveName
    });
    setSyncing(false);
  };

  // Main wrapper for state updates to immediately persist changes (Requirement: PERSISTENCE FIX)
  const updateAndSaveState = (
    nextFolders: DriveFolder[],
    nextUploads: DriveUploadedFile[],
    nextStarred: Set<string>,
    nextPinned: Set<string>,
    nextTrashed: Set<string>,
    nextItemFolders: Record<string, string>,
    nextItemNames: Record<string, string>,
    nextDriveName: string
  ) => {
    setFolders(nextFolders);
    setUploadedFiles(nextUploads);
    setStarredIds(nextStarred);
    setPinnedIds(nextPinned);
    setTrashedIds(nextTrashed);
    setItemFolders(nextItemFolders);
    setItemNames(nextItemNames);
    setDriveName(nextDriveName);

    saveLocalFolders(nextFolders);
    saveLocalUploadedFiles(nextUploads);
    saveStarredIds(nextStarred);
    savePinnedIds(nextPinned);
    saveTrashedIds(nextTrashed);
    saveItemFolders(nextItemFolders);
    saveItemNames(nextItemNames);
    localStorage.setItem(wsKey(STORAGE_DRIVE_NAME_KEY), nextDriveName);

    // Persist immediately to Supabase
    syncWithDatabase(
      nextFolders,
      nextUploads,
      nextStarred,
      nextPinned,
      nextTrashed,
      nextItemFolders,
      nextItemNames,
      nextDriveName
    );
  };

  // Fetch unified workspace items (cached + freshly loaded)
  async function loadDriveContent() {
    // 1. Initial Instant Cache Render (Requirement: PERFORMANCE FIX)
    const localFolders = getLocalFolders();
    const uploads = getLocalUploadedFiles();
    const stars = getStarredIds();
    const pins = getPinnedIds();
    const trashed = getTrashedIds();
    const itemFlds = getItemFolders();
    const itemNms = getItemNames();

    setFolders(localFolders);
    setUploadedFiles(uploads);
    setStarredIds(stars);
    setPinnedIds(pins);
    setTrashedIds(trashed);
    setItemFolders(itemFlds);
    setItemNames(itemNms);

    try {
      const rawLogs = localStorage.getItem(wsKey(STORAGE_ACTIVITY_KEY));
      setActivityLogs(rawLogs ? JSON.parse(rawLogs) : []);
    } catch {
      setActivityLogs([]);
    }

    // Load fast cache versions of document modules to show them instantly
    const cachedDocs = JSON.parse(localStorage.getItem(wsKey("amineva_workspace_docs")) || "[]");
    const cachedSheets = JSON.parse(localStorage.getItem(wsKey("amineva_workspace_sheets")) || "[]");
    const cachedDecks = JSON.parse(localStorage.getItem(wsKey("amineva_workspace_slides")) || "[]");
    const cachedForms = JSON.parse(localStorage.getItem(wsKey("amineva_forms")) || "[]");

    buildUnifiedItems(localFolders, uploads, cachedDocs, cachedSheets, cachedDecks, cachedForms, stars, pins, itemFlds, itemNms);
    setLoading(false);

    // 2. Multi-device Database Restore on Initial Mount
    setSyncing(true);
    const hasLocalDriveState = localFolders.length > 0 || uploads.length > 0 || stars.size > 0 || pins.size > 0 || trashed.size > 0 || Object.keys(itemFlds).length > 0 || Object.keys(itemNms).length > 0;
    const dbState = hasLocalDriveState ? null : await loadDriveFromDatabase();
    let currentFolders = localFolders;
    let currentUploads = uploads;
    let currentStarred = stars;
    let currentPinned = pins;
    let currentTrashed = trashed;
    let currentItemFolders = itemFlds;
    let currentItemNames = itemNms;
    let currentDriveName = driveName;

    if (dbState) {
      currentFolders = dbState.folders || [];
      currentUploads = dbState.uploadedFiles || [];
      currentStarred = new Set(dbState.starredIds || []);
      currentPinned = new Set(dbState.pinnedIds || []);
      currentTrashed = new Set(dbState.trashedIds || []);
      currentItemFolders = dbState.itemFolders || {};
      currentItemNames = dbState.itemNames || {};
      currentDriveName = dbState.driveName || "My Drive";

      setFolders(currentFolders);
      setUploadedFiles(currentUploads);
      setStarredIds(currentStarred);
      setPinnedIds(currentPinned);
      setTrashedIds(currentTrashed);
      setItemFolders(currentItemFolders);
      setItemNames(currentItemNames);
      setDriveName(currentDriveName);

      saveLocalFolders(currentFolders);
      saveLocalUploadedFiles(currentUploads);
      saveStarredIds(currentStarred);
      savePinnedIds(currentPinned);
      saveTrashedIds(currentTrashed);
      saveItemFolders(currentItemFolders);
      saveItemNames(currentItemNames);
      localStorage.setItem(wsKey(STORAGE_DRIVE_NAME_KEY), currentDriveName);
    }

    // 3. Fresh Background Fetch Incremental Loading
    const [docs, sheets, slides, forms] = await Promise.all([
      listDocuments(),
      listSheets(),
      listDecks(),
      listForms(),
    ]);

    buildUnifiedItems(currentFolders, currentUploads, docs, sheets, slides, forms, currentStarred, currentPinned, currentItemFolders, currentItemNames);
    setSyncing(false);
  }

  function buildUnifiedItems(
    flds: DriveFolder[],
    upls: DriveUploadedFile[],
    docs: WorkspaceDocument[],
    sheets: WorkspaceSheet[],
    slides: WorkspaceSlideDoc[],
    forms: FormDocument[],
    stars: Set<string>,
    pins: Set<string>,
    itemFlds: Record<string, string>,
    itemNms: Record<string, string>
  ) {
    const unified: DriveItem[] = [];

    // Folders
    flds.forEach((f) => {
      unified.push({
        id: f.id,
        title: itemNms[f.id] || f.name,
        kind: "folder",
        sizeFormatted: "Folder",
        sizeBytes: 0,
        updatedAt: f.createdAt,
        starred: stars.has(f.id),
        pinned: pins.has(f.id) || !!f.pinned,
        folderId: f.parentId || undefined,
        originalRef: f,
      });
    });

    // Docs (Requirement: REAL-TIME STORAGE dynamically computed from text length)
    docs.forEach((d: WorkspaceDocument) => {
       const calculatedBytes = jsonSize(d);
      unified.push({
        id: d.id,
        title: itemNms[d.id] || d.title || "Untitled Document",
        kind: "doc",
        route: `/workspace/docs/${d.id}`,
        sizeFormatted: formatBytes(calculatedBytes),
        sizeBytes: calculatedBytes,
        updatedAt: d.updated_at,
        starred: stars.has(d.id),
        pinned: pins.has(d.id),
        folderId: itemFlds[d.id] || undefined,
        originalRef: d,
      });
    });

    // Sheets (Requirement: REAL-TIME STORAGE calculated dynamically from total cells)
    sheets.forEach((s: WorkspaceSheet) => {
      const calculatedBytes = jsonSize(s);
      unified.push({
        id: s.id,
        title: itemNms[s.id] || s.title || "Untitled Sheet",
        kind: "sheet",
        route: `/workspace/sheets/${s.id}`,
        sizeFormatted: formatBytes(calculatedBytes),
        sizeBytes: calculatedBytes,
        updatedAt: s.updated_at,
        starred: stars.has(s.id),
        pinned: pins.has(s.id),
        folderId: itemFlds[s.id] || undefined,
        originalRef: s,
      });
    });

    // Slides (Requirement: REAL-TIME STORAGE computed from deck slides count)
    slides.forEach((sl: WorkspaceSlideDoc) => {
      const calculatedBytes = jsonSize(sl);
      unified.push({
        id: sl.id,
        title: itemNms[sl.id] || sl.title || "Untitled Presentation",
        kind: "slide",
        route: `/workspace/slides/${sl.id}`,
        sizeFormatted: formatBytes(calculatedBytes),
        sizeBytes: calculatedBytes,
        updatedAt: sl.updated_at,
        starred: stars.has(sl.id),
        pinned: pins.has(sl.id),
        folderId: itemFlds[sl.id] || undefined,
        originalRef: sl,
      });
    });

    // Forms (Requirement: REAL-TIME STORAGE computed from total questions)
    forms.forEach((fm: FormDocument) => {
      const calculatedBytes = jsonSize(fm);
      unified.push({
        id: fm.id,
        title: itemNms[fm.id] || fm.title || "Untitled Form",
        kind: "form",
        route: `/workspace/forms/${fm.id}`,
        sizeFormatted: formatBytes(calculatedBytes),
        sizeBytes: calculatedBytes,
        updatedAt: fm.updatedAt,
        starred: stars.has(fm.id),
        pinned: pins.has(fm.id),
        folderId: itemFlds[fm.id] || undefined,
        originalRef: fm,
      });
    });

    // Uploads
    upls.forEach((u: DriveUploadedFile) => {
      unified.push({
        id: u.id,
        title: itemNms[u.id] || u.name,
        kind: "upload",
        sizeFormatted: formatBytes(u.size),
        sizeBytes: u.size,
        updatedAt: u.updatedAt,
        starred: stars.has(u.id) || !!u.starred,
        pinned: pins.has(u.id),
        folderId: itemFlds[u.id] || u.folderId || undefined,
        originalRef: u,
      });
    });

    setItems(unified);
  }

  useEffect(() => {
    loadDriveContent();
  }, [activeTab]);

  useEffect(() => {
    const flushQueuedUploads = async () => {
      if (!navigator.onLine || workspaceSession.offline || isWorkspaceOfflineMode() || !driveUserId) return;
      const prefix = `${driveUserId}/`;
      const queued = (await listQueuedDriveUploads()).filter((upload) => upload.path.startsWith(prefix));
      const syncedPaths = new Set<string>();

      for (const upload of queued) {
        try {
          const { error } = await supabase.storage.from("workspace-drive").upload(upload.path, upload.file, {
            contentType: upload.type,
            upsert: true,
          });
          if (!error) {
            await removeQueuedDriveUpload(upload.path);
            syncedPaths.add(upload.path);
          }
        } catch (error) {
          console.warn("[drive-sync] Queued upload will retry", error);
        }
      }

      // Backups include the account-scoped blob store. Rebuild any missing
      // upload queue entries from local metadata + the original local bytes.
      const localFiles = getLocalUploadedFiles();
      for (const file of localFiles) {
        if (!file.storagePath || !file.storagePath.startsWith(prefix) || file.syncStatus === "synced" || syncedPaths.has(file.storagePath)) continue;
        const local = await getWorkspaceBlob(file.id).catch(() => null);
        if (!local) continue;
        try {
          const { error } = await supabase.storage.from("workspace-drive").upload(file.storagePath, local.blob, {
            contentType: file.type || local.type,
            upsert: true,
          });
          if (!error) syncedPaths.add(file.storagePath);
        } catch (error) {
          console.warn("[drive-sync] Restored local file will retry", error);
        }
      }

      if (syncedPaths.size) {
        const next = getLocalUploadedFiles().map((file) =>
          file.storagePath && syncedPaths.has(file.storagePath)
            ? { ...file, syncStatus: "synced" as const, updatedAt: new Date().toISOString() }
            : file
        );
        saveLocalUploadedFiles(next);
        setUploadedFiles(next);
      }

      const queuedDeletes = (await listQueuedDriveDeletes()).filter((item) => item.path.startsWith(prefix));
      for (const item of queuedDeletes) {
        try {
          const { error } = await supabase.storage.from("workspace-drive").remove([item.path]);
          if (!error) await removeQueuedDriveDelete(item.path);
        } catch (error) {
          console.warn("[drive-sync] Queued file deletion will retry", error);
        }
      }
    };
    void flushQueuedUploads();
    window.addEventListener("online", flushQueuedUploads);
    return () => window.removeEventListener("online", flushQueuedUploads);
  }, [driveUserId, workspaceSession.offline]);


  const handleDownloadFile = async (file: DriveUploadedFile) => {
    try {
      let blob = (await getWorkspaceBlob(file.id))?.blob ?? null;
      if (!blob && file.storagePath && navigator.onLine && !workspaceSession.offline && !isWorkspaceOfflineMode()) {
        const { data, error } = await supabase.storage.from("workspace-drive").download(file.storagePath);
        if (!error && data) {
          blob = data;
          await putWorkspaceBlob(file.id, data, file.name);
        }
      }
      if (!blob) {
        toast({ title: "File is not available on this device", description: "Reconnect to the account's Drive storage and try again.", variant: "destructive" });
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name || "download";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("[drive] File download failed", error);
      toast({ title: "Download failed", description: "The local file could not be opened.", variant: "destructive" });
    }
  };

  // Handlers
  const toggleStar = (id: string) => {
    const next = new Set(starredIds);
    const item = items.find((i) => i.id === id);
    if (next.has(id)) {
      next.delete(id);
      toast({ title: "Removed from Starred" });
      if (item) logDriveActivity("Removed Star", item.title);
    } else {
      next.add(id);
      toast({ title: "Added to Starred" });
      if (item) logDriveActivity("Starred Item", item.title);
    }
    updateAndSaveState(folders, uploadedFiles, next, pinnedIds, trashedIds, itemFolders, itemNames, driveName);
  };

  const togglePin = (id: string) => {
    const next = new Set(pinnedIds);
    const item = items.find((i) => i.id === id);
    if (next.has(id)) {
      next.delete(id);
      toast({ title: "Removed from Pins" });
      if (item) logDriveActivity("Unpinned Item", item.title);
    } else {
      next.add(id);
      toast({ title: "Pinned to Quick Access" });
      if (item) logDriveActivity("Pinned Item", item.title);
    }
    updateAndSaveState(folders, uploadedFiles, starredIds, next, trashedIds, itemFolders, itemNames, driveName);
  };

  const handleCreateFolder = () => {
    const name = window.prompt("Enter new folder name:", "New Folder");
    if (!name || !name.trim()) return;

    const newFolder: DriveFolder = {
      id: `folder-${Date.now()}`,
      name: name.trim(),
      parentId: currentFolderId || undefined,
      createdAt: new Date().toISOString(),
      color: "blue",
    };

    const nextFolders = [newFolder, ...folders];
    logDriveActivity("Created folder", newFolder.name);
    toast({ title: "Folder created", description: `Created folder "${newFolder.name}"` });
    updateAndSaveState(nextFolders, uploadedFiles, starredIds, pinnedIds, trashedIds, itemFolders, itemNames, driveName);
    loadDriveContent();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    const added: DriveUploadedFile[] = [];
    for (const file of Array.from(filesList)) {
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const storagePath = driveUserId ? `${driveUserId}/root/${uploadId}-${file.name}` : undefined;
      // Persist the original bytes locally before attempting any network upload.
      await putWorkspaceBlob(uploadId, file, file.name);
      const record: DriveUploadedFile = {
        id: uploadId,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        folderId: currentFolderId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storagePath,
        syncStatus: "pending",
      };

      if (storagePath && navigator.onLine && !workspaceSession.offline && !isWorkspaceOfflineMode()) {
        try {
          const { error } = await supabase.storage.from("workspace-drive").upload(storagePath, file, { upsert: true });
          if (!error) record.syncStatus = "synced";
          else await queueDriveUpload(storagePath, file);
        } catch {
          await queueDriveUpload(storagePath, file);
        }
      } else if (storagePath) {
        await queueDriveUpload(storagePath, file);
      }
      added.push(record);
      logDriveActivity("Uploaded file", file.name);
    }

    const nextUploads = [...added, ...uploadedFiles];
    toast({ title: "Files uploaded", description: `${added.length} file(s) added to Drive.` });
    updateAndSaveState(folders, nextUploads, starredIds, pinnedIds, trashedIds, itemFolders, itemNames, driveName);
    loadDriveContent();
  };

  const handleCreateNewDocument = async (kind: "doc" | "sheet" | "slide" | "form") => {
    if (kind === "doc") {
      const doc = await createDocument("New Drive Document");
      if (doc) {
        logDriveActivity("Created document", doc.title || "Untitled Document");
        navigate(`/workspace/docs/${doc.id}`);
      }
    } else if (kind === "sheet") {
      const sheet = await createSheet("New Drive Sheet");
      if (sheet) {
        logDriveActivity("Created sheet", sheet.title || "Untitled Sheet");
        navigate(`/workspace/sheets/${sheet.id}`);
      }
    } else if (kind === "slide") {
      const deck = await createDeck("New Drive Presentation");
      if (deck) {
        logDriveActivity("Created deck", deck.title || "Untitled Presentation");
        navigate(`/workspace/slides/${deck.id}`);
      }
    } else if (kind === "form") {
      const form = await createForm("New Drive Form");
      if (form) {
        logDriveActivity("Created form", form.title || "Untitled Form");
        navigate(`/workspace/forms/${form.id}`);
      }
    }
  };

  const handleDuplicateItem = async (item: DriveItem) => {
    try {
      let newId = "";
      const newTitle = `Copy of ${item.title}`;
      if (item.kind === "doc") {
        const copy = await duplicateDocument(item.originalRef);
        if (copy) {
          newId = copy.id;
          const nextItemNames = { ...itemNames };
          nextItemNames[copy.id] = newTitle;
          setItemNames(nextItemNames);
        }
      } else if (item.kind === "sheet") {
        const copy = await duplicateSheet(item.originalRef);
        if (copy) {
          newId = copy.id;
          const nextItemNames = { ...itemNames };
          nextItemNames[copy.id] = newTitle;
          setItemNames(nextItemNames);
        }
      } else if (item.kind === "slide") {
        const copy = await duplicateDeck(item.originalRef);
        if (copy) {
          newId = copy.id;
          const nextItemNames = { ...itemNames };
          nextItemNames[copy.id] = newTitle;
          setItemNames(nextItemNames);
        }
      } else if (item.kind === "form") {
        const copy = await duplicateForm(item.originalRef);
        if (copy) {
          newId = copy.id;
          const nextItemNames = { ...itemNames };
          nextItemNames[copy.id] = newTitle;
          setItemNames(nextItemNames);
        }
      } else if (item.kind === "upload") {
        const fileRef = item.originalRef as DriveUploadedFile;
        const newUpload: DriveUploadedFile = {
          ...fileRef,
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: newTitle,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const nextUploads = [newUpload, ...uploadedFiles];
        setUploadedFiles(nextUploads);
        newId = newUpload.id;
      }

      if (newId) {
        const nextItemFlds = { ...itemFolders };
        if (item.folderId) {
          nextItemFlds[newId] = item.folderId;
        }
        logDriveActivity("Duplicated item", newTitle);
        toast({ title: "Item duplicated", description: `Created copy "${newTitle}"` });
        updateAndSaveState(folders, uploadedFiles, starredIds, pinnedIds, trashedIds, nextItemFlds, itemNames, driveName);
        loadDriveContent();
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Duplication failed", variant: "destructive" });
    }
  };

  // Move to Trash (Soft Delete)
  const handleTrashItem = (item: DriveItem) => {
    const nextTrashed = new Set(trashedIds);
    nextTrashed.add(item.id);

    const nextSelection = new Set(selectedIds);
    nextSelection.delete(item.id);
    setSelectedIds(nextSelection);

    logDriveActivity("Moved to Trash", item.title);
    toast({ title: "Moved to Trash", description: `"${item.title}" resides in trash.` });
    updateAndSaveState(folders, uploadedFiles, starredIds, pinnedIds, nextTrashed, itemFolders, itemNames, driveName);
    loadDriveContent();
  };

  // Recycle Bin Empty Trash (Requirement: TRASH REQUIREMENTS - Empty Trash)
  const handleEmptyTrash = async () => {
    if (trashedIds.size === 0) {
      toast({ title: "Trash is already empty" });
      return;
    }
    if (!window.confirm(`Permanently delete all ${trashedIds.size} items in the trash? This cannot be undone.`)) return;

    const trashedArray = Array.from(trashedIds);
    const nextFolders = folders.filter((f) => !trashedIds.has(f.id));
    const nextUploads = uploadedFiles.filter((u) => !trashedIds.has(u.id));
    const storedPaths = uploadedFiles
      .filter((u) => trashedIds.has(u.id) && u.storagePath)
      .map((u) => u.storagePath)
      .filter((path): path is string => Boolean(path));
    if (storedPaths.length > 0 && navigator.onLine && !workspaceSession.offline && !isWorkspaceOfflineMode()) {
      const { error } = await supabase.storage.from("workspace-drive").remove(storedPaths);
      if (error) {
        toast({ title: "Stored files could not be removed", description: "Trash was not emptied. Please try again when the connection is stable.", variant: "destructive" });
        return;
      }
      for (const path of storedPaths) await removeQueuedDriveUpload(path);
    } else {
      for (const path of storedPaths) await queueDriveDelete(path);
    }
    for (const file of uploadedFiles.filter((item) => trashedIds.has(item.id))) {
      await deleteWorkspaceBlob(file.id);
    }

    const nextItemFlds = { ...itemFolders };
    const nextItemNames = { ...itemNames };
    const nextStarred = new Set(starredIds);
    const nextPinned = new Set(pinnedIds);

    trashedArray.forEach((id) => {
      delete nextItemFlds[id];
      delete nextItemNames[id];
      nextStarred.delete(id);
      nextPinned.delete(id);
    });

    logDriveActivity("Emptied trash", `${trashedIds.size} items purged`);
    toast({ title: "Trash Emptied", description: "All trashed items have been permanently deleted." });
    updateAndSaveState(nextFolders, nextUploads, nextStarred, nextPinned, new Set(), nextItemFlds, nextItemNames, driveName);
    loadDriveContent();
  };

  // Restore from Trash (Requirement: TRASH REQUIREMENTS - Auto parent folder check)
  const handleRestoreItem = (item: DriveItem) => {
    // 1. Identify the parent folder ID
    let parentFolderId = item.folderId;
    if (item.kind === "folder") {
      const folderObj = folders.find((f) => f.id === item.id);
      parentFolderId = folderObj?.parentId;
    }

    // 2. Check if the parent folder exists and is not trashed
    const parentExistsAndActive = parentFolderId
      ? folders.some((f) => f.id === parentFolderId && !trashedIds.has(f.id))
      : true; // Root is always active

    if (parentExistsAndActive) {
      // Restore automatically
      const nextTrashed = new Set(trashedIds);
      nextTrashed.delete(item.id);

      logDriveActivity("Restored from Trash", item.title);
      toast({ title: "Item restored", description: `"${item.title}" restored to original folder.` });
      updateAndSaveState(folders, uploadedFiles, starredIds, pinnedIds, nextTrashed, itemFolders, itemNames, driveName);
      loadDriveContent();
    } else {
      // Ask user to choose destination
      setRestoreTarget(item);
      setIsRestoreDestOpen(true);
    }
  };

  // Perform manual restore to selected folder
  const handlePerformRestoreToFolder = (item: DriveItem, targetFolderId: string | null) => {
    const nextTrashed = new Set(trashedIds);
    nextTrashed.delete(item.id);

    const nextItemFlds = { ...itemFolders };
    let nextFolders = [...folders];

    if (item.kind === "folder") {
      nextFolders = folders.map((f) => f.id === item.id ? { ...f, parentId: targetFolderId || undefined } : f);
    } else {
      if (targetFolderId === null) {
        delete nextItemFlds[item.id];
      } else {
        nextItemFlds[item.id] = targetFolderId;
      }
    }

    logDriveActivity("Restored with new destination", item.title);
    toast({ title: "Item restored", description: `"${item.title}" restored successfully.` });
    setIsRestoreDestOpen(false);
    setRestoreTarget(null);
    updateAndSaveState(nextFolders, uploadedFiles, starredIds, pinnedIds, nextTrashed, nextItemFlds, itemNames, driveName);
    loadDriveContent();
  };

  // Permanent Purge
  const handlePurgeItem = async (item: DriveItem) => {
    if (!window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) return;

    let nextFolders = [...folders];
    let nextUploads = [...uploadedFiles];

    if (item.kind === "folder") {
      nextFolders = folders.filter((f) => f.id !== item.id);
    } else if (item.kind === "upload") {
      const file = item.originalRef as DriveUploadedFile;
      if (file.storagePath) {
        if (navigator.onLine && !workspaceSession.offline && !isWorkspaceOfflineMode()) {
          const { error } = await supabase.storage.from("workspace-drive").remove([file.storagePath]);
          if (error) {
            toast({ title: "File could not be deleted from Drive", description: "The local copy has been kept. Try again when the connection is stable.", variant: "destructive" });
            return;
          }
          await removeQueuedDriveUpload(file.storagePath);
        } else {
          await queueDriveDelete(file.storagePath);
        }
      }
      await deleteWorkspaceBlob(item.id);
      nextUploads = uploadedFiles.filter((u) => u.id !== item.id);
    }

    const nextTrashed = new Set(trashedIds);
    nextTrashed.delete(item.id);

    const nextItemFlds = { ...itemFolders };
    delete nextItemFlds[item.id];

    const nextItemNames = { ...itemNames };
    delete nextItemNames[item.id];

    const nextStarred = new Set(starredIds);
    nextStarred.delete(item.id);

    const nextPinned = new Set(pinnedIds);
    nextPinned.delete(item.id);

    logDriveActivity("Permanently deleted item", item.title);
    toast({ title: "Item permanently deleted", description: `"${item.title}" was completely purged.` });
    updateAndSaveState(nextFolders, nextUploads, nextStarred, nextPinned, nextTrashed, nextItemFlds, nextItemNames, driveName);
    loadDriveContent();
  };

  // Rename folder/file
  const handleRenameItem = (item: DriveItem) => {
    const newTitle = window.prompt("Rename item", item.title);
    if (!newTitle || !newTitle.trim() || newTitle === item.title) return;

    const trimmed = newTitle.trim();
    let nextFolders = [...folders];
    let nextUploads = [...uploadedFiles];

    if (item.kind === "folder") {
      nextFolders = folders.map((f) => f.id === item.id ? { ...f, name: trimmed } : f);
    } else if (item.kind === "upload") {
      nextUploads = uploadedFiles.map((u) => u.id === item.id ? { ...u, name: trimmed, updatedAt: new Date().toISOString() } : u);
    }

    const nextItemNames = { ...itemNames };
    nextItemNames[item.id] = trimmed;

    logDriveActivity("Renamed item", trimmed);
    toast({ title: "Item renamed", description: `Successfully renamed to "${trimmed}".` });
    updateAndSaveState(nextFolders, nextUploads, starredIds, pinnedIds, trashedIds, itemFolders, nextItemNames, driveName);
    loadDriveContent();
  };

  // Move single item
  const handleMoveItem = (item: DriveItem, targetFolderId: string | null) => {
    if (item.id === targetFolderId) {
      toast({ title: "Error", description: "Cannot move a folder into itself.", variant: "destructive" });
      return;
    }

    let nextFolders = [...folders];
    const nextItemFlds = { ...itemFolders };

    if (item.kind === "folder") {
      nextFolders = folders.map((f) => f.id === item.id ? { ...f, parentId: targetFolderId || undefined } : f);
    } else {
      if (targetFolderId === null) {
        delete nextItemFlds[item.id];
      } else {
        nextItemFlds[item.id] = targetFolderId;
      }
    }

    setIsMoveOpen(false);
    setMoveTarget(null);
    logDriveActivity("Moved item", item.title);
    toast({ title: "Item moved successfully" });
    updateAndSaveState(nextFolders, uploadedFiles, starredIds, pinnedIds, trashedIds, nextItemFlds, itemNames, driveName);
    loadDriveContent();
  };

  // Move multiple items
  const handleMoveSelectedItems = (targetFolderId: string | null) => {
    const selectedList = items.filter((i) => selectedIds.has(i.id));
    if (selectedList.length === 0) return;

    let movedCount = 0;
    const nextItemFlds = { ...itemFolders };
    let nextFolders = [...folders];

    selectedList.forEach((item) => {
      if (item.id === targetFolderId) return;

      if (item.kind === "folder") {
        nextFolders = nextFolders.map((f) => f.id === item.id ? { ...f, parentId: targetFolderId || undefined } : f);
        movedCount++;
      } else {
        if (targetFolderId === null) {
          delete nextItemFlds[item.id];
        } else {
          nextItemFlds[item.id] = targetFolderId;
        }
        movedCount++;
      }
    });

    setSelectedIds(new Set());
    logDriveActivity("Moved multiple items", `${movedCount} items`);
    toast({ title: "Items moved", description: `Successfully moved ${movedCount} item(s).` });
    updateAndSaveState(nextFolders, uploadedFiles, starredIds, pinnedIds, trashedIds, nextItemFlds, itemNames, driveName);
    loadDriveContent();
  };

  // Share Item Link
  const handleShareItem = (item: DriveItem) => {
    const shareLink = `${window.location.origin}/drive/shared/${item.id}`;
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Share link copied",
      description: `Link for "${item.title}" has been copied to your clipboard.`,
    });
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, item: DriveItem) => {
    let draggedIds = Array.from(selectedIds);
    if (!selectedIds.has(item.id)) {
      draggedIds = [item.id];
      setSelectedIds(new Set([item.id]));
    }
    e.dataTransfer.setData("application/json", JSON.stringify(draggedIds));
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const draggedIds: string[] = JSON.parse(dataStr);
      if (!Array.isArray(draggedIds)) return;

      const selectedList = items.filter((i) => draggedIds.includes(i.id));
      let movedCount = 0;
      const nextItemFlds = { ...itemFolders };
      let nextFolders = [...folders];

      selectedList.forEach((item) => {
        if (item.id === targetFolderId) return;

        if (item.kind === "folder") {
          nextFolders = nextFolders.map((f) => f.id === item.id ? { ...f, parentId: targetFolderId || undefined } : f);
          movedCount++;
        } else {
          if (targetFolderId === null) {
            delete nextItemFlds[item.id];
          } else {
            nextItemFlds[item.id] = targetFolderId;
          }
          movedCount++;
        }
      });

      setSelectedIds(new Set());
      logDriveActivity("Moved items via drag/drop", `${movedCount} items`);
      toast({ title: "Items moved", description: `Successfully moved ${movedCount} item(s).` });
      updateAndSaveState(nextFolders, uploadedFiles, starredIds, pinnedIds, trashedIds, nextItemFlds, itemNames, driveName);
      loadDriveContent();
    } catch (err) {
      console.error(err);
    }
  };

  // Rename custom drive name
  const handleRenameDrive = () => {
    const newName = window.prompt("Rename your main Drive space:", driveName);
    if (newName !== null && newName.trim() !== "") {
      const trimmed = newName.trim();
      updateAndSaveState(folders, uploadedFiles, starredIds, pinnedIds, trashedIds, itemFolders, itemNames, trimmed);
      toast({
        title: "Drive renamed",
        description: `Your main Drive space is now named "${trimmed}".`,
      });
    }
  };

  // Filtered Items logic based on activeTab, folder, search, contentFilter
  const filteredItems = items.filter((item) => {
    const isItemTrashed = trashedIds.has(item.id);
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());

    // 1. Sidebar tab filter
    if (activeTab === "trash") {
      if (!isItemTrashed) return false;
    } else {
      if (isItemTrashed) return false;
    }

    if (activeTab === "starred") {
      if (!item.starred) return false;
    }

    // 2. Folder matching filter (My Drive only)
    if (activeTab === "my-drive" && !searchQuery) {
      if ((item.folderId || null) !== currentFolderId) return false;
    }

    // 3. Top Horizontal Content Filter bar
    if (contentFilter !== "all") {
      if (item.kind !== contentFilter) return false;
    }

    return matchesSearch;
  });

  // Calculate Real-Time Storage Stats (Requirement: REAL-TIME STORAGE quota calculation)
  const activeFiles = items.filter((i) => i.kind !== "folder" && !trashedIds.has(i.id));
  const storageBytesUsed = activeFiles.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  const storageBytesQuota = 10 * 1024 * 1024 * 1024; // 10 GB
  const usedPercentage = Math.min(100, (storageBytesUsed / storageBytesQuota) * 100);

  // Storage category sizes
  const docBytes = activeFiles.filter((f) => f.kind === "doc").reduce((acc, curr) => acc + curr.sizeBytes, 0);
  const sheetBytes = activeFiles.filter((f) => f.kind === "sheet").reduce((acc, curr) => acc + curr.sizeBytes, 0);
  const slideBytes = activeFiles.filter((f) => f.kind === "slide").reduce((acc, curr) => acc + curr.sizeBytes, 0);
  const formBytes = activeFiles.filter((f) => f.kind === "form").reduce((acc, curr) => acc + curr.sizeBytes, 0);
  const uploadBytes = activeFiles.filter((f) => f.kind === "upload").reduce((acc, curr) => acc + curr.sizeBytes, 0);

  // Current folder breadcrumb trail
  const currentFolderObj = folders.find((f) => f.id === currentFolderId);

  // Continue working files (most recently updated active files)
  const continueWorkingFiles = [...activeFiles]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Pinned/Frequently used folders
  const activeFolders = folders.filter((f) => !trashedIds.has(f.id));
  const pinnedFolders = activeFolders.filter((f) => pinnedIds.has(f.id));
  const quickAccessFolders = pinnedFolders.length > 0 ? pinnedFolders : activeFolders.slice(0, 4);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Collapsible left navigation panel */}
      <aside className={`border-r border-border bg-card flex flex-col sticky top-0 h-screen transition-all duration-300 shrink-0 ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
        {/* Header with name and collapse toggle */}
        <div className="p-4 border-b border-border flex items-center justify-between min-h-[70px]">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 truncate">
              <HardDrive className="h-5 w-5 text-sky-500 shrink-0 animate-pulse" />
              <span className="font-bold text-foreground truncate text-sm">{driveName}</span>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="flex justify-center w-full">
              <HardDrive className="h-5 w-5 text-sky-500 animate-pulse" />
            </div>
          )}
          <button
            onClick={() => {
              const nextCollapsed = !isSidebarCollapsed;
              setIsSidebarCollapsed(nextCollapsed);
              localStorage.setItem(STORAGE_SIDEBAR_COLLAPSED_KEY, String(nextCollapsed));
            }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition ml-auto"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <SidebarItem
            active={activeTab === "home"}
            onClick={() => { setActiveTab("home"); setContentFilter("all"); setCurrentFolderId(null); }}
            icon={HomeIcon}
            label="Home"
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            active={activeTab === "my-drive"}
            onClick={() => { setActiveTab("my-drive"); setContentFilter("all"); }}
            icon={HardDrive}
            label={driveName}
            collapsed={isSidebarCollapsed}
            onRename={handleRenameDrive}
          />
          <SidebarItem
            active={activeTab === "recent"}
            onClick={() => { setActiveTab("recent"); setContentFilter("all"); setCurrentFolderId(null); }}
            icon={Clock}
            label="Recent"
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            active={activeTab === "starred"}
            onClick={() => { setActiveTab("starred"); setContentFilter("all"); setCurrentFolderId(null); }}
            icon={Star}
            label="Starred"
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            active={activeTab === "trash"}
            onClick={() => { setActiveTab("trash"); setContentFilter("all"); setCurrentFolderId(null); }}
            icon={Trash2}
            label="Trash"
            collapsed={isSidebarCollapsed}
          />

          <div className="my-4 border-t border-border" />

          <SidebarItem
            active={activeTab === "shared-with-me"}
            onClick={() => { setActiveTab("shared-with-me"); setContentFilter("all"); setCurrentFolderId(null); }}
            icon={UsersIcon}
            label="Shared with Me"
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem
            active={activeTab === "activity"}
            onClick={() => { setActiveTab("activity"); setContentFilter("all"); setCurrentFolderId(null); }}
            icon={ActivityIcon}
            label="Activity"
            collapsed={isSidebarCollapsed}
          />
        </nav>

        {/* Real-time Storage Indicator */}
        <div className="p-4 border-t border-border bg-card/60">
          <DriveStorageIndicator
            used={storageBytesUsed}
            quota={storageBytesQuota}
            collapsed={isSidebarCollapsed}
            percentage={usedPercentage}
          />
        </div>
      </aside>

      {/* Main workspace section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="max-w-7xl w-full mx-auto p-6 md:p-8 relative min-h-screen flex flex-col"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (activeTab === "trash") {
              toast({ title: "Uploads are disabled in Trash bin.", variant: "destructive" });
              return;
            }
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
            }
          }}
        >
          {/* Hidden file input for uploads */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Drag & drop overlay */}
          {isDragging && activeTab !== "trash" && (
            <div className="fixed inset-0 z-50 bg-accent/20 backdrop-blur-sm border-4 border-dashed border-accent flex flex-col items-center justify-center text-accent pointer-events-none">
              <UploadCloud className="h-16 w-16 animate-bounce mb-3" />
              <h2 className="text-2xl font-bold">Drop files here to upload to Drive</h2>
            </div>
          )}

          {/* Back button to return to workspace */}
          <div className="mb-4">
            <button
              onClick={() => navigate("/workspace")}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Workspace
            </button>
          </div>

          {/* Header section */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 text-xs font-semibold mb-2">
                <HardDrive className="h-3.5 w-3.5 animate-pulse" /> Drive Cloud
                {syncing && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Syncing with DB...
                  </span>
                )}
                {!syncing && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Synced
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>
                  {activeTab === "my-drive" ? driveName : activeTab === "home" ? "Home" : activeTab === "recent" ? "Recent" : activeTab === "starred" ? "Starred" : activeTab === "trash" ? "Trash" : activeTab === "shared-with-me" ? "Shared with Me" : "Activity"}
                </span>
                {activeTab === "my-drive" && (
                  <button
                    onClick={handleRenameDrive}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                    title={`Rename ${driveName}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "home" ? "Welcome back! Your daily overview of files, folders, and workspace activities." : "Secure workspace cloud storage and document assets."}
              </p>
            </div>

            {/* Actions list (Requirement: TRASH REQUIREMENTS - Hide creation controls, show Empty Trash) */}
            <div className="flex flex-wrap items-center gap-3">
              {activeTab === "trash" ? (
                <button
                  onClick={handleEmptyTrash}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-white font-semibold text-sm hover:bg-red-600 transition shadow-sm"
                >
                  <Trash2 className="h-4 w-4" /> Empty Trash
                </button>
              ) : (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-500 transition shadow-sm"
                  >
                    <UploadCloud className="h-4 w-4" /> Upload File
                  </button>

                  <button
                    onClick={handleCreateFolder}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent/10 hover:border-accent/40 transition"
                  >
                    <FolderPlus className="h-4 w-4 text-sky-500" /> New Folder
                  </button>
                </>
              )}

              {selectedIds.size > 0 && activeTab !== "trash" && (
                <button
                  onClick={() => setIsMultiMoveOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 transition shadow-sm animate-pulse"
                >
                  <FolderOpen className="h-4 w-4" /> Move Selected ({selectedIds.size})
                </button>
              )}
            </div>
          </header>

          {/* Selection Summary banner */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5 rounded-xl border border-border mb-4 text-xs font-medium text-muted-foreground animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-sky-500" />
                <span>{selectedIds.size} item(s) selected</span>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sky-500 hover:text-sky-600 font-bold"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Navigation & Actions Bar (Hidden when Home Page is active) */}
          {activeTab !== "home" && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
              {/* Search & Breadcrumbs */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {currentFolderId && activeTab === "my-drive" && (
                  <button
                    onClick={() => setCurrentFolderId(currentFolderObj?.parentId || null)}
                    className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    title="Back to parent folder"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}

                <div className="relative flex-1 max-w-md">
                  <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files and folders…"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {currentFolderObj && activeTab === "my-drive" && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                    <span className="cursor-pointer hover:text-foreground" onClick={() => setCurrentFolderId(null)}>
                      {driveName}
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-medium text-foreground truncate">{currentFolderObj.name}</span>
                  </div>
                )}
              </div>

              {/* View switcher dropdown with 5 options (Hidden in Trash) */}
              {activeTab !== "trash" && (
                <div className="flex items-center gap-2">
                  {/* Quick creators */}
                  <div className="hidden sm:flex items-center gap-1 border border-border rounded-xl bg-card p-1">
                    <button
                      onClick={() => handleCreateNewDocument("doc")}
                      className="p-1.5 rounded-lg text-xs font-medium text-blue-500 hover:bg-blue-500/10 transition"
                      title="New Doc"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCreateNewDocument("sheet")}
                      className="p-1.5 rounded-lg text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 transition"
                      title="New Sheet"
                    >
                      <SheetIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCreateNewDocument("slide")}
                      className="p-1.5 rounded-lg text-xs font-medium text-amber-500 hover:bg-amber-500/10 transition"
                      title="New Presentation"
                    >
                      <Presentation className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCreateNewDocument("form")}
                      className="p-1.5 rounded-lg text-xs font-medium text-fuchsia-500 hover:bg-fuchsia-500/10 transition"
                      title="New Form"
                    >
                      <ClipboardList className="h-4 w-4" />
                    </button>
                  </div>

                  {/* View switcher select dropdown */}
                  <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1.5 text-xs">
                    <span className="text-muted-foreground pl-1.5 pr-1 font-semibold">View:</span>
                    <select
                      value={viewMode}
                      onChange={(e) => {
                        const mode = e.target.value as any;
                        setViewMode(mode);
                        localStorage.setItem(STORAGE_VIEW_MODE_KEY, mode);
                      }}
                      className="bg-transparent border-none text-foreground focus:outline-none font-bold cursor-pointer"
                    >
                      <option value="large-grid">Large Grid</option>
                      <option value="medium-grid">Medium Grid</option>
                      <option value="small-grid">Small Grid</option>
                      <option value="compact-list">Compact List</option>
                      <option value="detailed-list">Detailed List</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category Filter Bar (Hidden when Home Page is active) */}
          {activeTab !== "home" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-border">
              <CategoryTab
                active={contentFilter === "all"}
                onClick={() => setContentFilter("all")}
                icon={HardDrive}
                label="All Files"
              />
              <CategoryTab
                active={contentFilter === "doc"}
                onClick={() => setContentFilter("doc")}
                icon={FileText}
                label="Documents"
                count={items.filter(i => i.kind === "doc" && !trashedIds.has(i.id)).length}
                color="text-blue-500"
              />
              <CategoryTab
                active={contentFilter === "sheet"}
                onClick={() => setContentFilter("sheet")}
                icon={SheetIcon}
                label="Sheets"
                count={items.filter(i => i.kind === "sheet" && !trashedIds.has(i.id)).length}
                color="text-emerald-500"
              />
              <CategoryTab
                active={contentFilter === "slide"}
                onClick={() => setContentFilter("slide")}
                icon={Presentation}
                label="Slides"
                count={items.filter(i => i.kind === "slide" && !trashedIds.has(i.id)).length}
                color="text-amber-500"
              />
              <CategoryTab
                active={contentFilter === "form"}
                onClick={() => setContentFilter("form")}
                icon={ClipboardList}
                label="Forms"
                count={items.filter(i => i.kind === "form" && !trashedIds.has(i.id)).length}
                color="text-fuchsia-500"
              />
              <CategoryTab
                active={contentFilter === "upload"}
                onClick={() => setContentFilter("upload")}
                icon={UploadCloud}
                label="Uploaded Assets"
                count={items.filter(i => i.kind === "upload" && !trashedIds.has(i.id)).length}
                color="text-sky-500"
              />
            </div>
          )}

          {/* Render content based on selected sidebar tab */}
          {activeTab === "home" ? (
            /* HOME TAB (Requirement: HOME PAGE REQUIREMENTS - Unique dashboard style layout) */
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 1. Welcome Section */}
              <div className="p-6 bg-gradient-to-r from-sky-600/10 via-sky-500/5 to-transparent rounded-3xl border border-sky-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Welcome back, {user?.name || user?.email || "User"}!
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-sky-500" />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                </div>
                <button
                  onClick={() => navigate("/workspace")}
                  className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 text-sky-500 text-xs font-semibold hover:bg-sky-500/20 transition"
                >
                  Workspace Panel <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 2. Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left columns: Main workspace features */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Continue Working section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Clock className="h-5 w-5 text-sky-500" /> Continue Working
                    </h3>
                    {continueWorkingFiles.length === 0 ? (
                      <div className="p-8 bg-card border border-border rounded-2xl text-center flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <p className="text-xs font-medium text-muted-foreground">No recently opened files found</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1">Create documents or upload files to see them here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {continueWorkingFiles.map((file) => {
                          const Icon = getKindIcon(file.kind);
                          const color = getKindBadgeColor(file.kind);
                          return (
                            <div
                              key={file.id}
                              onClick={() => {
                                if (file.route) navigate(file.route);
                                else setSelectedItem(file);
                              }}
                              className="p-4 bg-card border border-border hover:border-sky-500/40 rounded-2xl hover:shadow-md transition cursor-pointer flex items-center gap-3.5 relative group"
                            >
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-foreground truncate">{file.title}</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">{file.kind} · {file.sizeFormatted}</p>
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition absolute right-3">
                                <ArrowUpRight className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Access Folders section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-sky-500" /> Quick Access Folders
                      </h3>
                      <button
                        onClick={() => setActiveTab("my-drive")}
                        className="text-xs text-sky-500 hover:text-sky-600 font-bold"
                      >
                        See All
                      </button>
                    </div>
                    {quickAccessFolders.length === 0 ? (
                      <div className="p-8 bg-card border border-border rounded-2xl text-center flex flex-col items-center justify-center">
                        <FolderPlus className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <p className="text-xs font-medium text-muted-foreground">No folders found</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1">Create a folder to organize your files.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {quickAccessFolders.map((folder) => {
                          const isPinned = pinnedIds.has(folder.id);
                          return (
                            <div
                              key={folder.id}
                              onClick={() => {
                                setCurrentFolderId(folder.id);
                                setActiveTab("my-drive");
                              }}
                              className="p-4 bg-card border border-border hover:border-sky-500/40 rounded-2xl hover:shadow-sm transition cursor-pointer flex flex-col justify-between h-28 relative group"
                            >
                              <div className="flex items-start justify-between">
                                <FolderOpen className="h-8 w-8 text-sky-500 fill-sky-500/5" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePin(folder.id);
                                  }}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-sky-500 opacity-0 group-hover:opacity-100 transition"
                                  title={isPinned ? "Unpin Folder" : "Pin to Quick Access"}
                                >
                                  <Pin className={`h-3.5 w-3.5 ${isPinned ? "fill-sky-500 text-sky-500 rotate-45" : ""}`} />
                                </button>
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{itemNames[folder.id] || folder.name}</h4>
                                <p className="text-[9px] text-muted-foreground mt-0.5">Folder</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Shared with Me Preview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-sky-500" /> Shared with Me
                    </h3>
                    <div className="p-8 bg-card border border-border rounded-2xl text-center flex flex-col items-center justify-center">
                      <UsersIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-xs font-medium text-muted-foreground">Shared space is currently clean</p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">Files shared by other workspace team members will show up here.</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Storage overview, Activity Feed, Insights */}
                <div className="space-y-8">
                  {/* Storage overview */}
                  <div className="p-6 bg-card border border-border rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Storage Overview</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500">10 GB Plan</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{usedPercentage.toFixed(1)}% Used</span>
                        <span className="text-muted-foreground">{formatBytes(storageBytesUsed)} of 10 GB</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${usedPercentage >= 90 ? "bg-amber-500" : "bg-sky-500"}`}
                          style={{ width: `${usedPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Category Breakdown list */}
                    <div className="pt-2 border-t border-border/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-blue-500" /> Documents</span>
                        <span className="font-semibold">{formatBytes(docBytes)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><SheetIcon className="h-3.5 w-3.5 text-emerald-500" /> Sheets</span>
                        <span className="font-semibold">{formatBytes(sheetBytes)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Presentation className="h-3.5 w-3.5 text-amber-500" /> Presentations</span>
                        <span className="font-semibold">{formatBytes(slideBytes)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5 text-fuchsia-500" /> Forms</span>
                        <span className="font-semibold">{formatBytes(formBytes)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><UploadCloud className="h-3.5 w-3.5 text-sky-500" /> Uploaded Assets</span>
                        <span className="font-semibold">{formatBytes(uploadBytes)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Feed */}
                  <div className="p-6 bg-card border border-border rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Activity</h3>
                      <Clock className="h-4 w-4 text-sky-500" />
                    </div>
                    <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                      {activityLogs.slice(0, 6).map((log) => (
                        <div key={log.id} className="text-xs flex flex-col gap-0.5 p-2 bg-muted/40 rounded-xl border border-border/20">
                          <p className="text-foreground font-semibold truncate">
                            {log.action}: <span className="text-sky-500">{log.name}</span>
                          </p>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      {activityLogs.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No recent drive activity.</p>
                      )}
                    </div>
                  </div>

                  {/* Workspace Insights */}
                  <div className="p-6 bg-card border border-border rounded-3xl space-y-4">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Workspace Insights</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/40 border border-border/60 rounded-2xl text-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Files</span>
                        <p className="text-lg font-black mt-1 text-sky-500">{activeFiles.length}</p>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border/60 rounded-2xl text-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Folders</span>
                        <p className="text-lg font-black mt-1 text-sky-500">{activeFolders.length}</p>
                      </div>
                      <div className="p-3 bg-muted/40 border border-border/60 rounded-2xl text-center col-span-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Sync Status</span>
                        <p className="text-xs font-semibold mt-1 text-emerald-500 flex items-center justify-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Backed up to Supabase
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "shared-with-me" ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-3xl text-center">
              <UsersIcon className="h-12 w-12 text-sky-500/40 mb-3" />
              <p className="font-semibold text-sm">Shared space is clean</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Folders or files shared with you by other workspace members will appear here.
              </p>
            </div>
          ) : activeTab === "activity" ? (
            <div className="border border-border rounded-3xl p-6 bg-card/40 space-y-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-500" /> Recent Activity Timeline
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {activityLogs.map((act) => (
                  <div key={act.id} className="text-xs flex justify-between items-center p-3 bg-muted/40 rounded-2xl border border-border/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></div>
                      <p className="text-foreground">
                        <span className="font-bold">{act.action}</span>: {act.name}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-[10px] shrink-0">
                      {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {activityLogs.length === 0 && (
                  <p className="text-xs text-muted-foreground p-4 text-center">No recent drive actions logged.</p>
                )}
              </div>
            </div>
          ) : (
            /* Standard files list browser with selected viewMode style */
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading Drive contents…</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/20 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-semibold text-foreground">No files found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                  {activeTab === "trash" ? "Your trash bin is completely empty." : "No items matching the selected filters. Upload files or create folders to get started!"}
                </p>
                {activeTab !== "trash" && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-500 transition"
                  >
                    <UploadCloud className="h-4 w-4" /> Upload File
                  </button>
                )}
              </div>
            ) : (viewMode === "large-grid" || viewMode === "medium-grid" || viewMode === "small-grid") ? (
              /* GRID VIEWS */
              <div className={
                viewMode === "large-grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                  : viewMode === "medium-grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3"
              }>
                {filteredItems.map((item) => {
                  const Icon = getKindIcon(item.kind);
                  const badgeColor = getKindBadgeColor(item.kind);
                  const isHighlighted = dragOverFolderId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="relative group"
                      draggable={activeTab !== "trash"}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) => {
                        if (item.kind === "folder" && activeTab !== "trash") {
                          handleDragOver(e, item.id);
                        }
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        if (item.kind === "folder" && activeTab !== "trash") {
                          handleDrop(e, item.id);
                        }
                      }}
                    >
                      <div
                        onClick={() => {
                          if (item.kind === "folder") {
                            setCurrentFolderId(item.id);
                          } else if (item.route && activeTab !== "trash") {
                            navigate(item.route);
                          } else {
                            setSelectedItem(item);
                          }
                        }}
                        className={`w-full rounded-2xl border bg-card hover:shadow-lg transition overflow-hidden flex flex-col cursor-pointer relative ${
                          viewMode === "large-grid" ? "p-5 min-h-[160px]" : viewMode === "medium-grid" ? "p-4 min-h-[140px]" : "p-2.5 min-h-[100px]"
                        } ${
                          isHighlighted
                            ? "border-sky-500 bg-sky-500/15 scale-105 shadow-md ring-2 ring-sky-500/50"
                            : "border-border hover:border-sky-500/60"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {activeTab !== "trash" && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const next = new Set(selectedIds);
                                  if (next.has(item.id)) {
                                    next.delete(item.id);
                                  } else {
                                    next.add(item.id);
                                  }
                                  setSelectedIds(next);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            )}
                            <div className={`rounded-xl flex items-center justify-center ${
                              viewMode === "large-grid" ? "h-12 w-12" : viewMode === "medium-grid" ? "h-10 w-10" : "h-7 w-7"
                            } ${badgeColor}`}>
                              <Icon className={viewMode === "large-grid" ? "h-6 w-6" : viewMode === "medium-grid" ? "h-5 w-5" : "h-3.5 w-3.5"} />
                            </div>
                          </div>
                          {activeTab !== "trash" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(item.id);
                              }}
                              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-amber-400 transition"
                            >
                              <Star className={`h-4 w-4 ${item.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-foreground truncate group-hover:text-sky-500 transition-colors ${
                            viewMode === "large-grid" ? "text-base" : viewMode === "medium-grid" ? "text-sm" : "text-xs"
                          }`}>
                            {item.title}
                          </h4>
                          {viewMode !== "small-grid" && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{item.sizeFormatted}</p>
                          )}
                        </div>

                        {viewMode !== "small-grid" && (
                          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                            <span className="uppercase tracking-wider font-semibold opacity-75">{item.kind}</span>
                            <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Options Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuForId(menuForId === item.id ? null : item.id);
                        }}
                        className="absolute top-3 right-3 h-7 w-7 rounded-lg bg-card/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted border border-border transition shadow-sm z-10"
                      >
                        <MoreVertical className="h-3.5 w-3.5 text-foreground" />
                      </button>

                      {menuForId === item.id && (
                        <div
                          onMouseLeave={() => setMenuForId(null)}
                          className="absolute top-10 right-3 z-30 w-48 rounded-xl border border-border bg-popover shadow-xl py-1 text-xs"
                        >
                          {activeTab === "trash" ? (
                            /* Options for Trash bin items only */
                            <>
                              <button
                                onClick={() => { setMenuForId(null); handleRestoreItem(item); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sky-500 font-semibold"
                              >
                                <Check className="h-3.5 w-3.5" /> Restore
                              </button>
                              <button
                                onClick={() => { setMenuForId(null); handlePurgeItem(item); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-destructive font-semibold border-t border-border/50"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete Permanently
                              </button>
                            </>
                          ) : (
                            /* Standard active item options */
                            <>
                              {item.route && (
                                <button
                                  onClick={() => { setMenuForId(null); navigate(item.route!); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground font-medium"
                                >
                                  <Eye className="h-3.5 w-3.5 text-sky-500" /> Open Interface
                                </button>
                              )}
                              {item.kind === "folder" && (
                                <button
                                  onClick={() => { setMenuForId(null); setCurrentFolderId(item.id); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground font-medium"
                                >
                                  <FolderOpen className="h-3.5 w-3.5 text-sky-500" /> Open Folder
                                </button>
                              )}
                              <button
                                onClick={() => { setMenuForId(null); toggleStar(item.id); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground font-medium"
                              >
                                <Star className={`h-3.5 w-3.5 ${item.starred ? "text-amber-400 fill-amber-400" : ""}`} />
                                {item.starred ? "Unstar" : "Star"}
                              </button>
                              {item.kind === "folder" && (
                                <button
                                  onClick={() => { setMenuForId(null); togglePin(item.id); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground font-medium"
                                >
                                  <Pin className={`h-3.5 w-3.5 ${pinnedIds.has(item.id) ? "text-sky-500 fill-sky-500" : ""}`} />
                                  {pinnedIds.has(item.id) ? "Unpin" : "Pin Quick Access"}
                                </button>
                              )}
                              {item.kind !== "folder" && (
                                <button
                                  onClick={() => { setMenuForId(null); handleDuplicateItem(item); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                                >
                                  <Copy className="h-3.5 w-3.5 text-blue-500" /> Duplicate
                                </button>
                              )}
                              <button
                                onClick={() => { setMenuForId(null); handleRenameItem(item); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Rename
                              </button>
                              <button
                                onClick={() => { setMenuForId(null); setMoveTarget(item); setIsMoveOpen(true); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                              >
                                <FolderOpen className="h-3.5 w-3.5" /> Move Item
                              </button>
                              <button
                                onClick={() => { setMenuForId(null); handleShareItem(item); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sky-500 font-medium"
                              >
                                <Share2 className="h-3.5 w-3.5 text-sky-500" /> Share Link
                              </button>
                              <button
                                onClick={() => { setMenuForId(null); setSelectedItem(item); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                              >
                                <Info className="h-3.5 w-3.5" /> View Details
                              </button>
                              <button
                                onClick={() => { setMenuForId(null); handleTrashItem(item); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-destructive font-medium border-t border-border/50"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Move to Trash
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEWS (Compact or Detailed) */
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {activeTab !== "trash" && <th className="py-2.5 px-4 w-10">Select</th>}
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Kind</th>
                      <th className="py-2.5 px-4">Size</th>
                      {viewMode === "detailed-list" && <th className="py-2.5 px-4">Last Modified</th>}
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs sm:text-sm">
                    {filteredItems.map((item) => {
                      const Icon = getKindIcon(item.kind);
                      const badgeColor = getKindBadgeColor(item.kind);
                      const isHighlighted = dragOverFolderId === item.id;

                      return (
                        <tr
                          key={item.id}
                          draggable={activeTab !== "trash"}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragOver={(e) => {
                            if (item.kind === "folder" && activeTab !== "trash") {
                              handleDragOver(e, item.id);
                            }
                          }}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => {
                            if (item.kind === "folder" && activeTab !== "trash") {
                              handleDrop(e, item.id);
                            }
                          }}
                          onClick={() => {
                            if (item.kind === "folder") setCurrentFolderId(item.id);
                            else if (item.route && activeTab !== "trash") navigate(item.route);
                            else setSelectedItem(item);
                          }}
                          className={`hover:bg-muted/50 cursor-pointer transition ${
                            viewMode === "compact-list" ? "text-xs" : ""
                          } ${isHighlighted ? "bg-sky-500/15 ring-2 ring-sky-500/50" : ""}`}
                        >
                          {activeTab !== "trash" && (
                            <td className="py-1.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={(e) => {
                                  const next = new Set(selectedIds);
                                  if (next.has(item.id)) {
                                    next.delete(item.id);
                                  } else {
                                    next.add(item.id);
                                  }
                                  setSelectedIds(next);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="py-1.5 px-4 flex items-center gap-3 min-w-0">
                            <div className={`rounded-lg flex items-center justify-center flex-shrink-0 ${badgeColor} ${
                              viewMode === "compact-list" ? "h-6 w-6" : "h-8 w-8"
                            }`}>
                              <Icon className={viewMode === "compact-list" ? "h-3.5 w-3.5" : "h-4 w-4"} />
                            </div>
                            <span className="font-semibold text-foreground truncate max-w-md">{item.title}</span>
                            {item.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                            {pinnedIds.has(item.id) && <Pin className="h-3.5 w-3.5 text-sky-500 flex-shrink-0" />}
                          </td>
                          <td className="py-1.5 px-4 text-xs font-medium uppercase text-muted-foreground">{item.kind}</td>
                          <td className="py-1.5 px-4 text-xs text-muted-foreground">{item.sizeFormatted}</td>
                          {viewMode === "detailed-list" && (
                            <td className="py-1.5 px-4 text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString()}</td>
                          )}
                          <td className="py-1.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {activeTab === "trash" ? (
                                /* Restrictive actions for Trash list */
                                <>
                                  <button
                                    onClick={() => handleRestoreItem(item)}
                                    className="p-1.5 rounded-lg hover:bg-sky-500/10 text-sky-500 font-semibold flex items-center gap-1"
                                    title="Restore"
                                  >
                                    <Check className="h-4 w-4" /> Restore
                                  </button>
                                  <button
                                    onClick={() => handlePurgeItem(item)}
                                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive font-semibold flex items-center gap-1"
                                    title="Delete Permanently"
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </button>
                                </>
                              ) : (
                                /* Active items actions */
                                <>
                                  <button
                                    onClick={() => toggleStar(item.id)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-amber-400"
                                  >
                                    <Star className={`h-4 w-4 ${item.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                                  </button>
                                  {item.kind === "folder" && (
                                    <button
                                      onClick={() => togglePin(item.id)}
                                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-sky-500"
                                      title="Pin Folder"
                                    >
                                      <Pin className={`h-4 w-4 ${pinnedIds.has(item.id) ? "fill-sky-500 text-sky-500" : ""}`} />
                                    </button>
                                  )}
                                  {item.kind !== "folder" && (
                                    <button
                                      onClick={() => handleDuplicateItem(item)}
                                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                                      title="Duplicate"
                                    >
                                      <Copy className="h-4 w-4 text-blue-500" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRenameItem(item)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                                    title="Rename"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => { setMoveTarget(item); setIsMoveOpen(true); }}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                                    title="Move"
                                  >
                                    <FolderOpen className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleShareItem(item)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                                    title="Share Link"
                                  >
                                    <Share2 className="h-4 w-4 text-sky-500" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedItem(item)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                                    title="Details"
                                  >
                                    <Info className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleTrashItem(item)}
                                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                    title="Move to Trash"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Selected Item Detail Modal */}
          {selectedItem && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${getKindBadgeColor(selectedItem.kind)}`}>
                    {(() => { const Icon = getKindIcon(selectedItem.kind); return <Icon className="h-6 w-6" />; })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{selectedItem.title}</h3>
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
                      {selectedItem.kind}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground border-y border-border py-4 my-4">
                  <div className="flex justify-between"><span>Name:</span> <span className="font-medium text-foreground truncate max-w-[200px]">{selectedItem.title}</span></div>
                  <div className="flex justify-between"><span>Kind:</span> <span className="font-medium text-foreground uppercase">{selectedItem.kind}</span></div>
                  <div className="flex justify-between"><span>Size / Type:</span> <span className="font-medium text-foreground">{selectedItem.sizeFormatted}</span></div>
                  <div className="flex justify-between"><span>Last Modified:</span> <span className="font-medium text-foreground">{new Date(selectedItem.updatedAt).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Storage Location:</span> <span className="font-medium text-foreground">Drive Cloud Directory</span></div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                  >
                    Close
                  </button>
                  {selectedItem.kind === "upload" && (
                    <button
                      onClick={() => {
                        void handleDownloadFile(selectedItem.originalRef as DriveUploadedFile);
                        setSelectedItem(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-500"
                    >
                      Download File
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Move Item Dialog */}
          {isMoveOpen && moveTarget && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
                <button
                  onClick={() => { setIsMoveOpen(false); setMoveTarget(null); }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <h3 className="font-bold text-lg text-foreground mb-4">Move "{moveTarget.title}"</h3>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Select Destination Folder:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4 border border-border rounded-xl p-2 bg-muted/20">
                  <button
                    onClick={() => handleMoveItem(moveTarget, null)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-xs font-semibold flex items-center gap-2"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-sky-500" />
                    <span>/ Root Directory</span>
                  </button>
                  {folders
                    .filter((f) => f.id !== moveTarget.id && !trashedIds.has(f.id))
                    .map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleMoveItem(moveTarget, f.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-xs flex items-center gap-2"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-sky-500 fill-sky-500/10" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setIsMoveOpen(false); setMoveTarget(null); }}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Choose Restore Destination Modal (Requirement: TRASH REQUIREMENTS - original folder missing) */}
          {isRestoreDestOpen && restoreTarget && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
                <button
                  onClick={() => { setIsRestoreDestOpen(false); setRestoreTarget(null); }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <h3 className="font-bold text-lg text-foreground mb-1">Restore Destination Missing</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  The original folder for "{restoreTarget.title}" no longer exists or is currently in the trash. Please select a new restore destination:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4 border border-border rounded-xl p-2 bg-muted/20">
                  <button
                    onClick={() => handlePerformRestoreToFolder(restoreTarget, null)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-xs font-semibold flex items-center gap-2"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-sky-500" />
                    <span>/ Root Directory</span>
                  </button>
                  {folders
                    .filter((f) => !trashedIds.has(f.id) && f.id !== restoreTarget.id)
                    .map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handlePerformRestoreToFolder(restoreTarget, f.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-xs flex items-center gap-2"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-sky-500 fill-sky-500/10" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setIsRestoreDestOpen(false); setRestoreTarget(null); }}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Move Items Dialog */}
          {isMultiMoveOpen && selectedIds.size > 0 && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
                <button
                  onClick={() => setIsMultiMoveOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <h3 className="font-bold text-lg text-foreground mb-4">Move {selectedIds.size} Selected Item(s)</h3>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Select Destination Folder:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4 border border-border rounded-xl p-2 bg-muted/20">
                  <button
                    onClick={() => { handleMoveSelectedItems(null); setIsMultiMoveOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-xs font-semibold flex items-center gap-2"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-sky-500" />
                    <span>/ Root Directory</span>
                  </button>
                  {folders
                    .filter((f) => !selectedIds.has(f.id) && !trashedIds.has(f.id))
                    .map((f) => (
                      <button
                        key={f.id}
                        onClick={() => { handleMoveSelectedItems(f.id); setIsMultiMoveOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-xs flex items-center gap-2"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-sky-500 fill-sky-500/10" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsMultiMoveOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Category tabs inside the filter bar
function CategoryTab({ active, onClick, icon: Icon, label, count, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex-shrink-0 ${
        active
          ? "bg-sky-500/15 text-sky-500 border border-sky-500/30"
          : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${color || ""}`} />
      <span>{label}</span>
      {typeof count === "number" && (
        <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-bold text-foreground">
          {count}
        </span>
      )}
    </button>
  );
}

// Collapsible Sidebar Navigation Item
function SidebarItem({ active, onClick, icon: Icon, label, collapsed, onRename }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  collapsed: boolean;
  onRename?: () => void;
}) {
  return (
    <div className="group relative flex items-center w-full">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
          active
            ? "bg-sky-500/10 text-sky-500 font-semibold"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        } ${collapsed ? "justify-center" : ""}`}
        title={collapsed ? label : undefined}
      >
        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-sky-500" : "text-muted-foreground"}`} />
        {!collapsed && <span className="truncate flex-1 text-left">{label}</span>}
      </button>

      {!collapsed && onRename && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
          title={`Rename ${label}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Real-time Storage Indicator component
function DriveStorageIndicator({ used, quota, collapsed, percentage }: {
  used: number;
  quota: number;
  collapsed: boolean;
  percentage: number;
}) {
  const showWarning = percentage >= 90;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 relative group cursor-help">
        <HardDrive className={`h-5 w-5 ${showWarning ? "text-amber-500" : "text-sky-500"}`} />
        <span className="text-[10px] font-bold text-foreground">{percentage.toFixed(0)}%</span>
        <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg border border-border bg-popover shadow-xl text-[10px] text-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          <p className="font-bold">Storage Status</p>
          <p>{formatBytes(used)} of {formatBytes(quota)} used</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <HardDrive className="h-3.5 w-3.5 text-sky-500" />
          <span>Storage</span>
        </div>
        <span className="font-semibold text-foreground">
          {percentage.toFixed(1)}% used
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            showWarning ? "bg-amber-500" : "bg-sky-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="text-[10px] text-muted-foreground flex justify-between">
        <span>{formatBytes(used)}</span>
        <span>of {formatBytes(quota)}</span>
      </div>

      {showWarning && (
        <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-1.5 items-start text-amber-500 animate-pulse">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div className="text-[9px] leading-relaxed">
            <p className="font-bold">Almost Full!</p>
            <p>You have reached {percentage.toFixed(0)}% of capacity. Free up space or upgrade.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function getKindIcon(kind: string) {
  switch (kind) {
    case "folder": return FolderOpen;
    case "doc": return FileText;
    case "sheet": return SheetIcon;
    case "slide": return Presentation;
    case "form": return ClipboardList;
    case "upload": return UploadCloud;
    default: return File;
  }
}

function getKindBadgeColor(kind: string) {
  switch (kind) {
    case "folder": return "bg-blue-500/15 text-blue-500";
    case "doc": return "bg-blue-500/15 text-blue-500";
    case "sheet": return "bg-emerald-500/15 text-emerald-500";
    case "slide": return "bg-amber-500/15 text-amber-500";
    case "form": return "bg-fuchsia-500/15 text-fuchsia-500";
    case "upload": return "bg-sky-500/15 text-sky-500";
    default: return "bg-gray-500/15 text-gray-500";
  }
}
