import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen, FolderPlus, UploadCloud, Plus, Search, LayoutGrid, List as ListIcon,
  FileText, Sheet as SheetIcon, Presentation, ClipboardList, File, MoreVertical,
  Trash2, Copy, Pencil, Star, Download, HardDrive, ArrowLeft, Eye, Check, X,
  ChevronRight, Filter, Clock, Share2, Info, ArrowUpRight
} from "lucide-react";
import { listDocuments, createDocument, type WorkspaceDocument } from "@/lib/workspace/documents";
import { listSheets, createSheet, type WorkspaceSheet } from "@/lib/workspace/sheets/documents";
import { listDecks, createDeck, type WorkspaceSlideDoc } from "@/lib/workspace/slides/documents";
import { listForms, createForm, type FormDocument } from "@/lib/workspace/forms/documents";
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
  updatedAt: string;
  starred: boolean;
  folderId?: string;
  originalRef?: any;
}

const STORAGE_FILES_KEY = "amineva_drive_uploaded_files";
const STORAGE_FOLDERS_KEY = "amineva_drive_folders";
const STORAGE_STARRED_KEY = "amineva_drive_starred_ids";
const STORAGE_TRASHED_KEY = "amineva_drive_trashed_ids";
const STORAGE_ITEM_FOLDERS_KEY = "amineva_drive_item_folders";
const STORAGE_ITEM_NAMES_KEY = "amineva_drive_item_names";

function getLocalUploadedFiles(): DriveUploadedFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_FILES_KEY);
    return raw ? JSON.parse(raw) : []; // No dummy default files as requested
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
    return raw ? JSON.parse(raw) : []; // No placeholder/demo folders by default as requested
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters & State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "doc" | "sheet" | "slide" | "form" | "upload" | "starred" | "trash">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

    const unified: DriveItem[] = [];

    // Add folders
    localFolders.forEach((f) => {
      unified.push({
        id: f.id,
        title: itemNms[f.id] || f.name,
        kind: "folder",
        sizeFormatted: "Folder",
        updatedAt: f.createdAt,
        starred: stars.has(f.id),
        folderId: f.parentId || undefined,
        originalRef: f,
      });
    });

    // Add Docs
    docs.forEach((d: WorkspaceDocument) => {
      unified.push({
        id: d.id,
        title: itemNms[d.id] || d.title || "Untitled Document",
        kind: "doc",
        route: `/workspace/docs/${d.id}`,
        sizeFormatted: formatBytes((d.content_text?.length || 50) * 12 + 1024),
        updatedAt: d.updated_at,
        starred: stars.has(d.id),
        folderId: itemFlds[d.id] || undefined,
        originalRef: d,
      });
    });

    // Add Sheets
    sheets.forEach((s: WorkspaceSheet) => {
      unified.push({
        id: s.id,
        title: itemNms[s.id] || s.title || "Untitled Sheet",
        kind: "sheet",
        route: `/workspace/sheets/${s.id}`,
        sizeFormatted: formatBytes(124000),
        updatedAt: s.updated_at,
        starred: stars.has(s.id),
        folderId: itemFlds[s.id] || undefined,
        originalRef: s,
      });
    });

    // Add Slides
    slides.forEach((sl: WorkspaceSlideDoc) => {
      unified.push({
        id: sl.id,
        title: itemNms[sl.id] || sl.title || "Untitled Presentation",
        kind: "slide",
        route: `/workspace/slides/${sl.id}`,
        sizeFormatted: formatBytes(2450000),
        updatedAt: sl.updated_at,
        starred: stars.has(sl.id),
        folderId: itemFlds[sl.id] || undefined,
        originalRef: sl,
      });
    });

    // Add Forms
    forms.forEach((fm: FormDocument) => {
      unified.push({
        id: fm.id,
        title: itemNms[fm.id] || fm.title || "Untitled Form",
        kind: "form",
        route: `/workspace/forms/${fm.id}`,
        sizeFormatted: formatBytes(84000),
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
    if (next.has(id)) {
      next.delete(id);
      toast({ title: "Removed from Starred" });
    } else {
      next.add(id);
      toast({ title: "Added to Starred" });
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
    });

    const updatedList = [...added, ...uploadedFiles];
    setUploadedFiles(updatedList);
    saveLocalUploadedFiles(updatedList);
    toast({ title: "Files uploaded", description: `${added.length} file(s) added to Amineva Drive.` });
    loadDriveContent();
  };

  const handleCreateNewDocument = async (kind: "doc" | "sheet" | "slide" | "form") => {
    if (kind === "doc") {
      const doc = await createDocument("New Drive Document");
      if (doc) navigate(`/workspace/docs/${doc.id}`);
    } else if (kind === "sheet") {
      const sheet = await createSheet("New Drive Sheet");
      if (sheet) navigate(`/workspace/sheets/${sheet.id}`);
    } else if (kind === "slide") {
      const deck = await createDeck("New Drive Presentation");
      if (deck) navigate(`/workspace/slides/${deck.id}`);
    } else if (kind === "form") {
      const form = await createForm("New Drive Form");
      if (form) navigate(`/workspace/forms/${form.id}`);
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

    toast({ title: "Moved to Trash", description: `"${item.title}" resides in trash.` });
    loadDriveContent();
  };

  // Restore from Trash
  const handleRestoreItem = (item: DriveItem) => {
    const next = new Set(trashedIds);
    next.delete(item.id);
    setTrashedIds(next);
    saveTrashedIds(next);
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

      toast({ title: "Items moved", description: `Successfully moved ${movedCount} item(s).` });
      loadDriveContent();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Items logic
  const filteredItems = items.filter((item) => {
    const isItemTrashed = trashedIds.has(item.id);
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "trash") {
      if (!isItemTrashed) return false;
    } else {
      if (isItemTrashed) return false;
    }

    let matchesTab = true;
    if (activeTab === "starred") matchesTab = item.starred;
    else if (activeTab !== "all" && activeTab !== "trash") matchesTab = item.kind === activeTab;

    let matchesFolder = true;
    if (!searchQuery && (activeTab === "all" || activeTab === "doc" || activeTab === "sheet" || activeTab === "slide" || activeTab === "form" || activeTab === "upload")) {
      matchesFolder = (item.folderId || null) === currentFolderId;
    }

    return matchesSearch && matchesTab && matchesFolder;
  });

  // Calculate Storage Stats
  const totalUploadSize = uploadedFiles.reduce((acc, curr) => acc + curr.size, 0);
  const estimatedStorageUsed = totalUploadSize + items.length * 1500000 + 1200000000; // ~1.2 GB baseline
  const maxStorageGB = 100;
  const usedStorageGB = (estimatedStorageUsed / (1024 * 1024 * 1024)).toFixed(1);
  const usedPercentage = Math.min(100, Math.round((parseFloat(usedStorageGB) / maxStorageGB) * 100));

  // Current folder breadcrumb trail
  const currentFolderObj = folders.find((f) => f.id === currentFolderId);

  return (
    <div
      className="max-w-7xl mx-auto p-8 relative min-h-screen flex flex-col"
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
          <h2 className="text-2xl font-bold">Drop files here to upload to Amineva Drive</h2>
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
            <HardDrive className="h-3.5 w-3.5" /> Amineva Drive
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Amineva Drive</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Secure cloud storage and asset manager.
          </p>
        </div>

        {/* Storage Widget & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden lg:flex flex-col justify-center px-4 py-2 rounded-xl bg-card border border-border min-w-[200px]">
            <div className="flex justify-between text-xs font-medium text-foreground mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="h-3.5 w-3.5 text-sky-500" /> Storage</span>
              <span className="font-semibold">{usedStorageGB} / {maxStorageGB} GB</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${usedPercentage}%` }} />
            </div>
          </div>

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
          {currentFolderId && (
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
              placeholder="Search all files and folders…"
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

          {currentFolderObj && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <span className="cursor-pointer hover:text-foreground" onClick={() => setCurrentFolderId(null)}>
                Drive
              </span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground truncate">{currentFolderObj.name}</span>
            </div>
          )}
        </div>

        {/* View Switcher & Quick New Dropdown */}
        <div className="flex items-center gap-2">
          {/* Quick item creators */}
          <div className="hidden sm:flex items-center gap-1 border border-border rounded-xl bg-card p-1">
            <button
              onClick={() => handleCreateNewDocument("doc")}
              className="p-1.5 rounded-lg text-xs font-medium text-blue-500 hover:bg-blue-500/10 transition"
              title="New Amineva Doc"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleCreateNewDocument("sheet")}
              className="p-1.5 rounded-lg text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 transition"
              title="New Amineva Sheet"
            >
              <SheetIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleCreateNewDocument("slide")}
              className="p-1.5 rounded-lg text-xs font-medium text-amber-500 hover:bg-amber-500/10 transition"
              title="New Amineva Slide"
            >
              <Presentation className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleCreateNewDocument("form")}
              className="p-1.5 rounded-lg text-xs font-medium text-fuchsia-500 hover:bg-fuchsia-500/10 transition"
              title="New Amineva Form"
            >
              <ClipboardList className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center border border-border rounded-xl bg-card p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid" ? "bg-accent/20 text-accent font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list" ? "bg-accent/20 text-accent font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-border">
        <CategoryTab active={activeTab === "all"} onClick={() => setActiveTab("all")} icon={HardDrive} label="All Files" />
        <CategoryTab active={activeTab === "doc"} onClick={() => setActiveTab("doc")} icon={FileText} label="Docs" count={items.filter(i => i.kind === "doc" && !trashedIds.has(i.id)).length} color="text-blue-500" />
        <CategoryTab active={activeTab === "sheet"} onClick={() => setActiveTab("sheet")} icon={SheetIcon} label="Sheets" count={items.filter(i => i.kind === "sheet" && !trashedIds.has(i.id)).length} color="text-emerald-500" />
        <CategoryTab active={activeTab === "slide"} onClick={() => setActiveTab("slide")} icon={Presentation} label="Slides" count={items.filter(i => i.kind === "slide" && !trashedIds.has(i.id)).length} color="text-amber-500" />
        <CategoryTab active={activeTab === "form"} onClick={() => setActiveTab("form")} icon={ClipboardList} label="Forms" count={items.filter(i => i.kind === "form" && !trashedIds.has(i.id)).length} color="text-fuchsia-500" />
        <CategoryTab active={activeTab === "upload"} onClick={() => setActiveTab("upload")} icon={UploadCloud} label="Uploaded Assets" count={items.filter(i => i.kind === "upload" && !trashedIds.has(i.id)).length} color="text-sky-500" />
        <CategoryTab active={activeTab === "starred"} onClick={() => setActiveTab("starred")} icon={Star} label="Starred" count={items.filter(i => i.starred && !trashedIds.has(i.id)).length} color="text-amber-400" />
        <CategoryTab active={activeTab === "trash"} onClick={() => { setActiveTab("trash"); setCurrentFolderId(null); }} icon={Trash2} label="Trash" count={items.filter(i => trashedIds.has(i.id)).length} color="text-red-500" />
      </div>

      {/* Main File Browser */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading Drive contents…</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/20 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No files found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            {searchQuery
              ? `No items matching "${searchQuery}" in Amineva Drive.`
              : "Drag & drop files here or click Upload File to store files in Drive."}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-500 transition"
          >
            <UploadCloud className="h-4 w-4" /> Upload File
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
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
                  className={`w-full aspect-[4/3] rounded-2xl border bg-card hover:shadow-lg transition overflow-hidden flex flex-col cursor-pointer p-4 relative ${
                    isHighlighted
                      ? "border-sky-500 bg-sky-500/15 scale-105 shadow-md ring-2 ring-sky-500/50"
                      : "border-border hover:border-sky-500/60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
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
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${badgeColor}`}>
                        <Icon className="h-5 w-5" />
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
                    <h4 className="font-semibold text-foreground text-sm truncate group-hover:text-sky-500 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{item.sizeFormatted}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span className="uppercase tracking-wider font-semibold opacity-75">{item.kind}</span>
                    <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Options Menu Trigger */}
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
        /* LIST VIEW */
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 w-10">Select</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Kind</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Last Modified</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
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
                      isHighlighted ? "bg-sky-500/15 ring-2 ring-sky-500/50" : ""
                    }`}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
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
                    <td className="py-3 px-4 flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${badgeColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-foreground truncate max-w-md">{item.title}</span>
                      {item.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium uppercase text-muted-foreground">{item.kind}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{item.sizeFormatted}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleStar(item.id)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-amber-400"
                        >
                          <Star className={`h-4 w-4 ${item.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
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
              <div className="flex justify-between"><span>Storage Location:</span> <span className="font-medium text-foreground">Amineva Cloud Drive</span></div>
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
  );
}

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
