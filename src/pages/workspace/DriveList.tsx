import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen, FolderPlus, UploadCloud, Plus, Search, LayoutGrid, List as ListIcon,
  FileText, Sheet as SheetIcon, Presentation, ClipboardList, File, MoreVertical,
  Trash2, Copy, Pencil, Star, Download, HardDrive, ArrowLeft, Eye, Check, X,
  ChevronRight, ChevronLeft, Filter, Clock, Share2, Info, ArrowUpRight,
  Home as HomeIcon, Users as UsersIcon, Activity as ActivityIcon, AlertCircle
} from "lucide-react";
import { listDocuments, createDocument, duplicateDocument, type WorkspaceDocument } from "@/lib/workspace/documents";
import { listSheets, createSheet, duplicateSheet, type WorkspaceSheet } from "@/lib/workspace/sheets/documents";
import { listDecks, createDeck, duplicateDeck, type WorkspaceSlideDoc } from "@/lib/workspace/slides/documents";
import { listForms, createForm, duplicateForm, type FormDocument } from "@/lib/workspace/forms/documents";
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
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  color?: string;
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

function getLocalUploadedFiles(): DriveUploadedFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_FILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUploadedFiles(files: DriveUploadedFile[]) {
  try {
    localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(files));
  } catch (e) {
    console.error("Failed to save uploaded files", e);
  }
}

function getLocalFolders(): DriveFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFolders(folders: DriveFolder[]) {
  try {
    localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {
    console.error("Failed to save folders", e);
  }
}

function getStarredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_STARRED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveStarredIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_STARRED_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error("Failed to save starred IDs", e);
  }
}

function getTrashedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_TRASHED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveTrashedIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_TRASHED_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error("Failed to save trashed IDs", e);
  }
}

function getItemFolders(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_ITEM_FOLDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveItemFolders(mapping: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_ITEM_FOLDERS_KEY, JSON.stringify(mapping));
  } catch (e) {
    console.error("Failed to save item folders mapping", e);
  }
}

function getItemNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_ITEM_NAMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveItemNames(names: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_ITEM_NAMES_KEY, JSON.stringify(names));
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

function logDriveActivity(action: string, name: string) {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITY_KEY);
    const list: ActivityEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      name,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_ACTIVITY_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error("Failed to log drive activity", e);
  }
}

export default function DriveList() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<DriveUploadedFile[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(getStarredIds());
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
    return localStorage.getItem(STORAGE_DRIVE_NAME_KEY) || "My Drive";
  });

  // Sidebar navigation tab state
  const [activeTab, setActiveTab] = useState<"home" | "my-drive" | "recent" | "starred" | "trash" | "shared-with-me" | "activity">("my-drive");

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

  // Fetch all unified workspace items
  async function loadDriveContent() {
    setLoading(true);
    const localFolders = getLocalFolders();
    setFolders(localFolders);

    const uploads = getLocalUploadedFiles();
    setUploadedFiles(uploads);

    const [docs, sheets, slides, forms] = await Promise.all([
      listDocuments(),
      listSheets(),
      listDecks(),
      listForms(),
    ]);

    const stars = getStarredIds();
    const trashed = getTrashedIds();
    const itemFlds = getItemFolders();
    const itemNms = getItemNames();

    setStarredIds(stars);
    setTrashedIds(trashed);
    setItemFolders(itemFlds);
    setItemNames(itemNms);

    // Load local activity logs
    try {
      const rawLogs = localStorage.getItem(STORAGE_ACTIVITY_KEY);
      setActivityLogs(rawLogs ? JSON.parse(rawLogs) : []);
    } catch {
      setActivityLogs([]);
    }

    const unified: DriveItem[] = [];

    // Add folders
    localFolders.forEach((f) => {
      unified.push({
        id: f.id,
        title: itemNms[f.id] || f.name,
        kind: "folder",
        sizeFormatted: "Folder",
        sizeBytes: 0,
        updatedAt: f.createdAt,
        starred: stars.has(f.id),
        folderId: f.parentId || undefined,
        originalRef: f,
      });
    });

    // Add Docs
    docs.forEach((d: WorkspaceDocument) => {
      const textLen = d.content_text?.length || 50;
      const calculatedBytes = textLen * 12 + 1024;
      unified.push({
        id: d.id,
        title: itemNms[d.id] || d.title || "Untitled Document",
        kind: "doc",
        route: `/workspace/docs/${d.id}`,
        sizeFormatted: formatBytes(calculatedBytes),
        sizeBytes: calculatedBytes,
        updatedAt: d.updated_at,
        starred: stars.has(d.id),
        folderId: itemFlds[d.id] || undefined,
        originalRef: d,
      });
    });

    // Add Sheets
    sheets.forEach((s: WorkspaceSheet) => {
      const calculatedBytes = 124000;
      unified.push({
        id: s.id,
        title: itemNms[s.id] || s.title || "Untitled Sheet",
        kind: "sheet",
        route: `/workspace/sheets/${s.id}`,
        sizeFormatted: formatBytes(calculatedBytes),
        sizeBytes: calculatedBytes,
        updatedAt: s.updated_at,
        starred: stars.has(s.id),
        folderId: itemFlds[s.id] || undefined,
        originalRef: s,
      });
    });

    // Add Slides
    slides.forEach((sl: WorkspaceSlideDoc) => {
      const calculatedBytes = 2450000;
      unified.push({
        id: sl.id,
        title: itemNms[sl.id] || sl.title || "Untitled Presentation",
        kind: "slide",
        route: `/workspace/slides/${sl.id}`,
        sizeFormatted: formatBytes(calculatedBytes),
        sizeBytes: calculatedBytes,
        updatedAt: sl.updated_at,
        starred: stars.has(sl.id),
        folderId: itemFlds[sl.id] || undefined,
        originalRef: sl,
      });
    });

    // Add Forms
    forms.forEach((fm: FormDocument) => {
      const calculatedBytes = 84000;
      unified.push({
        id: fm.id,
        title: itemNms[fm.id] || fm.title || "Untitled Form",
        kind: "form",
        route: `/workspace/forms/${fm.id}`,
        sizeFormatted: formatBytes(calculatedBytes),
        sizeBytes: calculatedBytes,
        updatedAt: fm.updatedAt,
        starred: stars.has(fm.id),
        folderId: itemFlds[fm.id] || undefined,
        originalRef: fm,
      });
    });

    // Add Uploads
    uploads.forEach((u: DriveUploadedFile) => {
      unified.push({
        id: u.id,
        title: itemNms[u.id] || u.name,
        kind: "upload",
        sizeFormatted: formatBytes(u.size),
        sizeBytes: u.size,
        updatedAt: u.updatedAt,
        starred: stars.has(u.id) || !!u.starred,
        folderId: itemFlds[u.id] || u.folderId || undefined,
        originalRef: u,
      });
    });

    setItems(unified);
    setLoading(false);
  }

  useEffect(() => {
    loadDriveContent();
  }, []);

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
    setStarredIds(next);
    saveStarredIds(next);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, starred: next.has(id) } : item)));
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

    const updated = [newFolder, ...folders];
    setFolders(updated);
    saveLocalFolders(updated);
    logDriveActivity("Created folder", newFolder.name);
    toast({ title: "Folder created", description: `Created folder "${newFolder.name}"` });
    loadDriveContent();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const added: DriveUploadedFile[] = [];
    Array.from(files).forEach((file) => {
      added.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: file.size || 1024 * 50,
        type: file.type || "application/octet-stream",
        folderId: currentFolderId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logDriveActivity("Uploaded file", file.name);
    });

    const updatedList = [...added, ...uploadedFiles];
    setUploadedFiles(updatedList);
    saveLocalUploadedFiles(updatedList);
    toast({ title: "Files uploaded", description: `${added.length} file(s) added to Drive.` });
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

  // Duplication functionality (requirement 6 / 8)
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
          saveItemNames(nextItemNames);
          setItemNames(nextItemNames);
        }
      } else if (item.kind === "sheet") {
        const copy = await duplicateSheet(item.originalRef);
        if (copy) {
          newId = copy.id;
          const nextItemNames = { ...itemNames };
          nextItemNames[copy.id] = newTitle;
          saveItemNames(nextItemNames);
          setItemNames(nextItemNames);
        }
      } else if (item.kind === "slide") {
        const copy = await duplicateDeck(item.originalRef);
        if (copy) {
          newId = copy.id;
          const nextItemNames = { ...itemNames };
          nextItemNames[copy.id] = newTitle;
          saveItemNames(nextItemNames);
          setItemNames(nextItemNames);
        }
      } else if (item.kind === "form") {
        const copy = await duplicateForm(item.originalRef);
        if (copy) {
          newId = copy.id;
          const nextItemNames = { ...itemNames };
          nextItemNames[copy.id] = newTitle;
          saveItemNames(nextItemNames);
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
        const updatedList = [newUpload, ...uploadedFiles];
        setUploadedFiles(updatedList);
        saveLocalUploadedFiles(updatedList);
        newId = newUpload.id;
      }

      if (newId) {
        // preserve folder structure
        if (item.folderId) {
          const nextItemFlds = { ...itemFolders };
          nextItemFlds[newId] = item.folderId;
          saveItemFolders(nextItemFlds);
          setItemFolders(nextItemFlds);
        }
        logDriveActivity("Duplicated item", newTitle);
        toast({ title: "Item duplicated", description: `Created copy "${newTitle}"` });
        loadDriveContent();
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Duplication failed", variant: "destructive" });
    }
  };

  // Move to Trash (Soft Delete)
  const handleTrashItem = (item: DriveItem) => {
    const next = new Set(trashedIds);
    next.add(item.id);
    setTrashedIds(next);
    saveTrashedIds(next);

    // Also clear from selection
    const nextSelection = new Set(selectedIds);
    nextSelection.delete(item.id);
    setSelectedIds(nextSelection);

    logDriveActivity("Moved to Trash", item.title);
    toast({ title: "Moved to Trash", description: `"${item.title}" resides in trash.` });
    loadDriveContent();
  };

  // Restore from Trash
  const handleRestoreItem = (item: DriveItem) => {
    const next = new Set(trashedIds);
    next.delete(item.id);
    setTrashedIds(next);
    saveTrashedIds(next);

    logDriveActivity("Restored from Trash", item.title);
    toast({ title: "Item restored", description: `"${item.title}" restored successfully.` });
    loadDriveContent();
  };

  // Permanent Purge
  const handlePurgeItem = (item: DriveItem) => {
    if (!window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) return;

    if (item.kind === "folder") {
      const updatedFolders = folders.filter((f) => f.id !== item.id);
      setFolders(updatedFolders);
      saveLocalFolders(updatedFolders);
    } else if (item.kind === "upload") {
      const updatedUploads = uploadedFiles.filter((u) => u.id !== item.id);
      setUploadedFiles(updatedUploads);
      saveLocalUploadedFiles(updatedUploads);
    }

    const nextTrash = new Set(trashedIds);
    nextTrash.delete(item.id);
    setTrashedIds(nextTrash);
    saveTrashedIds(nextTrash);

    // Remove custom folder assignment & name mapping
    const nextItemFlds = { ...itemFolders };
    delete nextItemFlds[item.id];
    setItemFolders(nextItemFlds);
    saveItemFolders(nextItemFlds);

    const nextItemNames = { ...itemNames };
    delete nextItemNames[item.id];
    setItemNames(nextItemNames);
    saveItemNames(nextItemNames);

    logDriveActivity("Permanently deleted item", item.title);
    toast({ title: "Item permanently deleted", description: `"${item.title}" was completely purged.` });
    loadDriveContent();
  };

  // Rename folder/file
  const handleRenameItem = (item: DriveItem) => {
    const newTitle = window.prompt("Rename item", item.title);
    if (!newTitle || !newTitle.trim() || newTitle === item.title) return;

    const trimmed = newTitle.trim();
    if (item.kind === "folder") {
      const updated = folders.map((f) => f.id === item.id ? { ...f, name: trimmed } : f);
      setFolders(updated);
      saveLocalFolders(updated);
    } else if (item.kind === "upload") {
      const updated = uploadedFiles.map((u) => u.id === item.id ? { ...u, name: trimmed, updatedAt: new Date().toISOString() } : u);
      setUploadedFiles(updated);
      saveLocalUploadedFiles(updated);
    }

    // Save rename mappings persistently for all kinds
    const nextItemNames = { ...itemNames };
    nextItemNames[item.id] = trimmed;
    setItemNames(nextItemNames);
    saveItemNames(nextItemNames);

    logDriveActivity("Renamed item", trimmed);
    toast({ title: "Item renamed", description: `Successfully renamed to "${trimmed}".` });
    loadDriveContent();
  };

  // Move single item
  const handleMoveItem = (item: DriveItem, targetFolderId: string | null) => {
    if (item.id === targetFolderId) {
      toast({ title: "Error", description: "Cannot move a folder into itself.", variant: "destructive" });
      return;
    }

    if (item.kind === "folder") {
      const updated = folders.map((f) => f.id === item.id ? { ...f, parentId: targetFolderId || undefined } : f);
      setFolders(updated);
      saveLocalFolders(updated);
    } else {
      const nextItemFlds = { ...itemFolders };
      if (targetFolderId === null) {
        delete nextItemFlds[item.id];
      } else {
        nextItemFlds[item.id] = targetFolderId;
      }
      setItemFolders(nextItemFlds);
      saveItemFolders(nextItemFlds);
    }

    setIsMoveOpen(false);
    setMoveTarget(null);
    logDriveActivity("Moved item", item.title);
    toast({ title: "Item moved successfully" });
    loadDriveContent();
  };

  // Move multiple items
  const handleMoveSelectedItems = (targetFolderId: string | null) => {
    const selectedList = items.filter((i) => selectedIds.has(i.id));
    if (selectedList.length === 0) return;

    let movedCount = 0;
    const nextItemFlds = { ...itemFolders };
    let updatedFolders = [...folders];

    selectedList.forEach((item) => {
      if (item.id === targetFolderId) return;

      if (item.kind === "folder") {
        updatedFolders = updatedFolders.map((f) => f.id === item.id ? { ...f, parentId: targetFolderId || undefined } : f);
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

    setFolders(updatedFolders);
    saveLocalFolders(updatedFolders);
    setItemFolders(nextItemFlds);
    saveItemFolders(nextItemFlds);
    setSelectedIds(new Set());

    logDriveActivity("Moved multiple items", `${movedCount} items`);
    toast({ title: "Items moved", description: `Successfully moved ${movedCount} item(s).` });
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
      let updatedFolders = [...folders];

      selectedList.forEach((item) => {
        if (item.id === targetFolderId) return;

        if (item.kind === "folder") {
          updatedFolders = updatedFolders.map((f) => f.id === item.id ? { ...f, parentId: targetFolderId || undefined } : f);
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

      setFolders(updatedFolders);
      saveLocalFolders(updatedFolders);
      setItemFolders(nextItemFlds);
      saveItemFolders(nextItemFlds);
      setSelectedIds(new Set());

      logDriveActivity("Moved items via drag/drop", `${movedCount} items`);
      toast({ title: "Items moved", description: `Successfully moved ${movedCount} item(s).` });
      loadDriveContent();
    } catch (err) {
      console.error(err);
    }
  };

  // Rename custom drive name (requirement 2)
  const handleRenameDrive = () => {
    const newName = window.prompt("Rename your main Drive space:", driveName);
    if (newName !== null && newName.trim() !== "") {
      const trimmed = newName.trim();
      setDriveName(trimmed);
      localStorage.setItem(STORAGE_DRIVE_NAME_KEY, trimmed);
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

    // 3. Top Horizontal Content Filter bar (requirement 3)
    if (contentFilter !== "all") {
      if (item.kind !== contentFilter) return false;
    }

    return matchesSearch;
  });

  // Calculate Real-Time Storage Stats (requirement 5 / 6 / 7)
  // Get active files that are NOT folders and NOT trashed
  const activeFiles = items.filter((i) => i.kind !== "folder" && !trashedIds.has(i.id));
  const storageBytesUsed = activeFiles.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  const storageBytesQuota = 10 * 1024 * 1024 * 1024; // 10 GB
  const usedPercentage = Math.min(100, (storageBytesUsed / storageBytesQuota) * 100);

  // Current folder breadcrumb trail
  const currentFolderObj = folders.find((f) => f.id === currentFolderId);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 1. Permanent, collapsible left navigation panel */}
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

        {/* Real-time Storage Indicator at the bottom of the sidebar */}
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
          {isDragging && (
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
                <HardDrive className="h-3.5 w-3.5" /> Drive Cloud
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
                Secure workspace cloud storage and document assets.
              </p>
            </div>

            {/* Actions list */}
            <div className="flex flex-wrap items-center gap-3">
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

              {selectedIds.size > 0 && (
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

          {/* Navigation & Actions Bar */}
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

            {/* View switcher dropdown with 5 options */}
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

              {/* View switcher select dropdown (requirement 4) */}
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
          </div>

          {/* 3. Keep the existing top horizontal content filter bar */}
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

          {/* Render content based on selected sidebar tab */}
          {activeTab === "shared-with-me" ? (
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
                  No items matching the selected filters. Upload files or create folders to get started!
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-500 transition"
                >
                  <UploadCloud className="h-4 w-4" /> Upload File
                </button>
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
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) => {
                        if (item.kind === "folder") {
                          handleDragOver(e, item.id);
                        }
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => {
                        if (item.kind === "folder") {
                          handleDrop(e, item.id);
                        }
                      }}
                    >
                      <div
                        onClick={() => {
                          if (item.kind === "folder") {
                            setCurrentFolderId(item.id);
                          } else if (item.route) {
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
                            <div className={`rounded-xl flex items-center justify-center ${
                              viewMode === "large-grid" ? "h-12 w-12" : viewMode === "medium-grid" ? "h-10 w-10" : "h-7 w-7"
                            } ${badgeColor}`}>
                              <Icon className={viewMode === "large-grid" ? "h-6 w-6" : viewMode === "medium-grid" ? "h-5 w-5" : "h-3.5 w-3.5"} />
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(item.id);
                            }}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-amber-400 transition"
                          >
                            <Star className={`h-4 w-4 ${item.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>
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
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                          >
                            <Share2 className="h-3.5 w-3.5 text-sky-500" /> Share Link
                          </button>
                          <button
                            onClick={() => { setMenuForId(null); setSelectedItem(item); }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground"
                          >
                            <Info className="h-3.5 w-3.5" /> View Details
                          </button>

                          {trashedIds.has(item.id) ? (
                            <>
                              <button
                                onClick={() => { setMenuForId(null); handleRestoreItem(item); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sky-500 font-medium"
                              >
                                <Check className="h-3.5 w-3.5" /> Restore
                              </button>
                              <button
                                onClick={() => { setMenuForId(null); handlePurgeItem(item); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-destructive font-medium border-t border-border/50"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete Permanently
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setMenuForId(null); handleTrashItem(item); }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-destructive font-medium border-t border-border/50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Move to Trash
                            </button>
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
                      <th className="py-2.5 px-4 w-10">Select</th>
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
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragOver={(e) => {
                            if (item.kind === "folder") {
                              handleDragOver(e, item.id);
                            }
                          }}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => {
                            if (item.kind === "folder") {
                              handleDrop(e, item.id);
                            }
                          }}
                          onClick={() => {
                            if (item.kind === "folder") setCurrentFolderId(item.id);
                            else if (item.route) navigate(item.route);
                            else setSelectedItem(item);
                          }}
                          className={`hover:bg-muted/50 cursor-pointer transition ${
                            viewMode === "compact-list" ? "text-xs" : ""
                          } ${isHighlighted ? "bg-sky-500/15 ring-2 ring-sky-500/50" : ""}`}
                        >
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
                          <td className="py-1.5 px-4 flex items-center gap-3 min-w-0">
                            <div className={`rounded-lg flex items-center justify-center flex-shrink-0 ${badgeColor} ${
                              viewMode === "compact-list" ? "h-6 w-6" : "h-8 w-8"
                            }`}>
                              <Icon className={viewMode === "compact-list" ? "h-3.5 w-3.5" : "h-4 w-4"} />
                            </div>
                            <span className="font-semibold text-foreground truncate max-w-md">{item.title}</span>
                            {item.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                          </td>
                          <td className="py-1.5 px-4 text-xs font-medium uppercase text-muted-foreground">{item.kind}</td>
                          <td className="py-1.5 px-4 text-xs text-muted-foreground">{item.sizeFormatted}</td>
                          {viewMode === "detailed-list" && (
                            <td className="py-1.5 px-4 text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString()}</td>
                          )}
                          <td className="py-1.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => toggleStar(item.id)}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-amber-400"
                              >
                                <Star className={`h-4 w-4 ${item.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                              </button>
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

                              {trashedIds.has(item.id) ? (
                                <>
                                  <button
                                    onClick={() => handleRestoreItem(item)}
                                    className="p-1.5 rounded-lg hover:bg-sky-500/10 text-sky-500"
                                    title="Restore"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handlePurgeItem(item)}
                                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                                    title="Delete Permanently"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleTrashItem(item)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  title="Move to Trash"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
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
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
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
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
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
                        toast({ title: "Downloading file...", description: selectedItem.title });
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
              <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
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

          {/* Multi-Move Items Dialog */}
          {isMultiMoveOpen && selectedIds.size > 0 && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
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
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
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
