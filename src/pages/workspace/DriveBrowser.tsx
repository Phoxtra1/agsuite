import React, { useState, useEffect, useMemo } from "react";
import {
  listFolder,
  createFolder,
  uploadFile,
  renameItem,
  moveItem,
  toggleStar,
  trashItem,
  restoreItem,
  purgeItem,
  storageUsage,
  searchDrive,
  listActivity,
  DriveFolder,
  DriveFile,
  DriveActivity
} from "@/lib/workspace/drive/documents";
import { DriveSidebar } from "@/components/workspace/drive/DriveSidebar";
import { DriveToolbar } from "@/components/workspace/drive/DriveToolbar";
import { DriveBreadcrumbs } from "@/components/workspace/drive/DriveBreadcrumbs";
import { DriveGrid } from "@/components/workspace/drive/DriveGrid";
import { DriveTable } from "@/components/workspace/drive/DriveTable";
import { DriveContextMenu } from "@/components/workspace/drive/DriveContextMenu";
import { DriveUploadDropzone } from "@/components/workspace/drive/DriveUploadDropzone";
import { DrivePreviewDialog } from "@/components/workspace/drive/DrivePreviewDialog";
import { DriveShareDialog } from "@/components/workspace/drive/DriveShareDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Search, Sparkles, FolderPlus, HelpCircle, HardDrive, Trash2, Clock, Star, Layout, Users, FileQuestion, ArrowRight } from "lucide-react";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function DriveBrowser() {
  const [currentTab, setCurrentTab] = useState("my-drive");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [storage, setStorage] = useState({ used: 0, quota: 0 });
  const [activities, setActivities] = useState<DriveActivity[]>([]);

  // Modals & Dialog states
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DriveFile | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<DriveFile | null>(null);

  // Right-click context menu states
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; item: any; type: "file" | "folder" | null }>({
    isOpen: false,
    x: 0,
    y: 0,
    item: null,
    type: null,
  });

  // Rename states
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<any>(null);
  const [renameType, setRenameType] = useState<"file" | "folder" | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Move states
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<any>(null);
  const [moveType, setMoveType] = useState<"file" | "folder" | null>(null);
  const [moveSelectedFolderId, setMoveSelectedFolderId] = useState<string | null>(null);

  // Details states
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<any>(null);
  const [detailsType, setDetailsType] = useState<"file" | "folder" | null>(null);

  // Load active folder items & metadata on Mount/FolderChange/TabChange
  const loadData = async () => {
    try {
      const { folders: fld, files: fls } = await listFolder(currentFolderId);

      // Determine what to show based on selected Tab
      if (currentTab === "my-drive") {
        setFolders(fld.filter(f => !(f as any).trashed_at));
        setFiles(fls.filter(f => !f.trashed_at));
      } else if (currentTab === "recent") {
        setFolders([]);
        const sorted = [...fls].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setFiles(sorted.slice(0, 50));
      } else if (currentTab === "favorites") {
        setFolders(fld.filter(f => f.starred && !(f as any).trashed_at));
        setFiles(fls.filter(f => f.starred && !f.trashed_at));
      } else if (currentTab === "trash") {
        const allLocalFiles = await listFolder(null); // Load root trashed fallback or fetch directly
        setFolders(allLocalFiles.folders.filter(f => (f as any).trashed_at));
        setFiles(allLocalFiles.files.filter(f => f.trashed_at));
      } else {
        setFolders(fld);
        setFiles(fls);
      }

      const usage = await storageUsage();
      setStorage(usage);

      const logs = await listActivity();
      setActivities(logs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFolderId, currentTab]);

  // Handle Breadcrumbs trail navigation updates
  const handleNavigateBreadcrumbs = (id: string | null) => {
    setCurrentFolderId(id);
    if (id === null) {
      setBreadcrumbs([]);
    } else {
      const idx = breadcrumbs.findIndex(b => b.id === id);
      if (idx >= 0) {
        setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
      }
    }
  };

  const handleOpenFolder = (id: string) => {
    const fld = folders.find(f => f.id === id);
    if (fld) {
      setBreadcrumbs([...breadcrumbs, { id: fld.id, name: fld.name }]);
    }
    setCurrentFolderId(id);
  };

  // Create folder logic
  const handleCreateFolderCommit = async () => {
    if (!newFolderName.trim()) return;
    const res = await createFolder(newFolderName.trim(), currentFolderId);
    if (res) {
      toast({
        title: "Folder Created",
        description: `Successfully added "${newFolderName}" to the workspace.`,
      });
      setNewFolderName("");
      setIsNewFolderOpen(false);
      loadData();
    }
  };

  // Upload file logic callback
  const handleUploadFileCommit = async (uploadedFiles: File[]) => {
    for (const file of uploadedFiles) {
      await uploadFile(file, currentFolderId);
    }
    loadData();
  };

  const handleImportDocumentCommit = async (type: "doc" | "sheet" | "slide" | "form") => {
    // Simulated registration
    const mockFile = {
      name: `Untitled ${type.toUpperCase()} Template`,
      size: 1024,
      type: `application/x-amineva-${type}`
    };
    await uploadFile(mockFile, currentFolderId, type);
    toast({
      title: "Document Registered",
      description: `Amineva ${type.toUpperCase()} file successfully registered in Drive.`,
    });
    loadData();
  };

  // Action / Context menu callback handlers
  const handleContextMenuTrigger = (e: React.MouseEvent, item: any, type: "file" | "folder") => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      item,
      type,
    });
  };

  const handleToggleStarCommit = async (id: string, type: "file" | "folder") => {
    await toggleStar(id, type);
    loadData();
  };

  const handleTrashCommit = async (id: string, type: "file" | "folder") => {
    await trashItem(id, type);
    toast({
      title: "Moved to Trash",
      description: "Item resides in trash bin. You can restore it anytime.",
    });
    loadData();
  };

  const handleRestoreCommit = async (id: string, type: "file" | "folder") => {
    await restoreItem(id, type);
    toast({
      title: "Item Restored",
      description: "Item restored successfully back to active drive.",
    });
    loadData();
  };

  const handlePurgeCommit = async (id: string, type: "file" | "folder") => {
    await purgeItem(id, type);
    toast({
      title: "Permanently Deleted",
      description: "The item has been deleted from Drive completely.",
    });
    loadData();
  };

  const handleRenameCommit = async () => {
    if (!renameValue.trim() || !renameTarget || !renameType) return;
    await renameItem(renameTarget.id, renameValue.trim(), renameType);
    setIsRenameOpen(false);
    setRenameTarget(null);
    setRenameType(null);
    setRenameValue("");
    loadData();
  };

  const handleMoveCommit = async () => {
    if (!moveTarget || !moveType) return;
    await moveItem(moveTarget.id, moveSelectedFolderId, moveType);
    toast({
      title: "Item Moved",
      description: "Item moved inside selected folder directory.",
    });
    setIsMoveOpen(false);
    setMoveTarget(null);
    setMoveType(null);
    setMoveSelectedFolderId(null);
    loadData();
  };

  const handleOpenFile = (file: DriveFile) => {
    setSelectedFileForPreview(file);
    setIsPreviewOpen(true);
  };

  const handleShareFile = (file: DriveFile) => {
    setSelectedFileForShare(file);
    setIsShareOpen(true);
  };

  // Client side sorting and searching filter engine
  const processedFiles = useMemo(() => {
    let list = [...files];
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(lower));
    }

    list.sort((a, b) => {
      if (sortField === "name") return a.name.localeCompare(b.name);
      if (sortField === "size") return b.size_bytes - a.size_bytes;
      if (sortField === "type") return a.kind.localeCompare(b.kind);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return list;
  }, [files, searchQuery, sortField]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar navigation */}
      <DriveSidebar
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          setCurrentFolderId(null);
          setBreadcrumbs([]);
        }}
        used={storage.used}
        quota={storage.quota}
      />

      {/* Main Drive Workspace content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
        {/* Search header & smart panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by filename, tags, owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl bg-muted/30 border-border focus-visible:ring-sky-500 text-sm h-10 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1 bg-muted/40 py-1.5 px-3 rounded-full">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Branded under Dipa AI
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Tabs Content renders */}
        {currentTab === "my-drive" || currentTab === "favorites" || currentTab === "recent" || currentTab === "trash" ? (
          <div className="space-y-6">
            {/* Toolbar controls */}
            <DriveToolbar
              viewMode={viewMode}
              onToggleViewMode={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              onNewFolder={() => setIsNewFolderOpen(true)}
              onUploadFile={() => setIsUploadOpen(true)}
              onImportDocument={handleImportDocumentCommit}
              sortField={sortField}
              onSortChange={setSortField}
              onOpenDipaAI={() => {
                toast({
                  title: "Dipa AI Panel",
                  description: "Dipa content search, OCR, and AI translation triggers will activate with enterprise integration.",
                });
              }}
            />

            {/* Breadcrumb pathing */}
            {currentTab === "my-drive" && (
              <DriveBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={handleNavigateBreadcrumbs} />
            )}

            {/* Core listing Grid vs Table */}
            {viewMode === "grid" ? (
              <DriveGrid
                folders={folders}
                files={processedFiles}
                onOpenFolder={handleOpenFolder}
                onOpenFile={handleOpenFile}
                onContextMenu={handleContextMenuTrigger}
                onToggleStar={handleToggleStarCommit}
              />
            ) : (
              <DriveTable
                folders={folders}
                files={processedFiles}
                onOpenFolder={handleOpenFolder}
                onOpenFile={handleOpenFile}
                onContextMenu={handleContextMenuTrigger}
                onToggleStar={handleToggleStarCommit}
              />
            )}
          </div>
        ) : null}

        {/* Workspaces Display */}
        {currentTab === "workspaces" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Layout className="h-5 w-5 text-sky-500" /> Organizational Workspaces
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {["Personal", "Business", "Finance", "Legal", "Projects", "Research"].map((ws) => (
                <div key={ws} className="p-6 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col justify-between h-44">
                  <div>
                    <h3 className="font-bold text-foreground text-base">{ws} Workspace</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Collaborative area for managing all files tied to {ws.toLowerCase()} scopes.
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/60 pt-3">
                    <span>Members: 1 (Me)</span>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-sky-500" onClick={() => {
                      setCurrentTab("my-drive");
                      toast({ title: `Switched view to ${ws} workspace files` });
                    }}>
                      Open Area <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Folder Dashboard */}
        {currentTab === "shared" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-sky-500" /> Shared Files & Folders
            </h2>
            <div className="flex flex-col items-center justify-center py-20 bg-card/40 border border-dashed border-border rounded-3xl">
              <Users className="h-12 w-12 text-sky-500/40 mb-3" />
              <p className="font-semibold text-sm">Shared space is clean</p>
              <p className="text-xs text-muted-foreground mt-1">
                Any folders or files shared with you by other team workspace members will appear here.
              </p>
            </div>
          </div>
        )}

        {/* Storage Insights & Analytics */}
        {currentTab === "storage" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-sky-500" /> Storage on this device
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Files currently listed in Drive</p>
                <p className="mt-2 text-2xl font-black text-foreground">{formatBytes(storage.used)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Calculated from the sizes of non-trashed Drive files. Documents and editor data are stored separately.</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Browser storage estimate</p>
                <p className="mt-2 text-2xl font-black text-foreground">{storage.quota > 0 ? formatBytes(storage.quota) : "Not reported"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Capacity reported by the browser for this website's origin. It is not an Amineva subscription allowance and may include other site data.</p>
              </div>
            </div>
            <p className="rounded-xl border border-border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground">
              Drive keeps file details and local file copies on this device where browser storage is available. Cloud synchronisation and backup depend on the connected account service. Export important files and keep a separate backup before clearing browser data or changing devices.
            </p>

            {/* Activity History Logs */}
            <div className="border border-border rounded-3xl p-6 bg-card/40 space-y-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-500" /> Recent Activity Timeline
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {activities.map((act) => (
                  <div key={act.id} className="text-xs flex justify-between items-center p-3 bg-muted/40 rounded-2xl border border-border/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></div>
                      <p className="text-foreground">
                        <span className="font-bold">{act.action}</span>: {act.item_name}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-[10px] shrink-0">{new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-xs text-muted-foreground">No recent Drive actions registered.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Settings */}
        {currentTab === "settings" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Drive System Settings</h2>
            <div className="p-6 bg-card border border-border rounded-3xl space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Local-first file handling</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Drive keeps file metadata and available file bytes on this device first. When an account backend is connected, files can also be uploaded to the configured cloud storage. A failed upload must not remove the local copy.
                </p>
              </div>
              <div className="pt-3 border-t border-border">
                <h3 className="font-semibold text-sm text-foreground">Branded AI Integration</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Integrations with Dipa AI for document translations, instant text summarizes, OCR scanner captures, and intelligent keywords query indexing are ready.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Dialog / Modals */}

      {/* Create Folder Modal */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="rounded-3xl max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-sky-500" /> Create Workspace Folder
            </DialogTitle>
            <DialogDescription className="text-xs">
              Organize your file hierarchy beautifully. Give this folder a nice descriptive name.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="text"
              placeholder="e.g. Q3 Financial Reports"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="rounded-xl border-border focus-visible:ring-sky-500"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsNewFolderOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button onClick={handleCreateFolderCommit} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs">
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Right-click Context Actions Menu */}
      <DriveContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0, item: null, type: null })}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        targetItem={contextMenu.item}
        targetType={contextMenu.type}
        onOpen={(item, type) => {
          if (type === "folder") {
            handleOpenFolder(item.id);
          } else {
            handleOpenFile(item);
          }
        }}
        onRename={(item, type) => {
          setRenameTarget(item);
          setRenameType(type);
          setRenameValue(item.name);
          setIsRenameOpen(true);
        }}
        onMove={(item, type) => {
          setMoveTarget(item);
          setMoveType(type);
          setIsMoveOpen(true);
        }}
        onToggleStar={handleToggleStarCommit}
        onShare={handleShareFile}
        onDownload={handleOpenFile}
        onTrash={handleTrashCommit}
        onDetails={(item, type) => {
          setDetailsTarget(item);
          setDetailsType(type);
          setIsDetailsOpen(true);
        }}
      />

      {/* Upload Drops Zone Dialog */}
      <DriveUploadDropzone
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadFileCommit}
      />

      {/* File Quick Preview Canvas */}
      <DrivePreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={selectedFileForPreview}
      />

      {/* Sharing link modal */}
      <DriveShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        file={selectedFileForShare}
      />

      {/* Rename Action Modal */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="rounded-3xl max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">Rename Item</DialogTitle>
            <DialogDescription className="text-xs">Provide a new descriptor identifier for your workspace object.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="rounded-xl border-border focus-visible:ring-sky-500"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsRenameOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button onClick={handleRenameCommit} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move or Copy Modal */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent className="rounded-3xl max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">Move Item</DialogTitle>
            <DialogDescription className="text-xs">Choose a directory folder pathway to restructure your files.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Select Folder:</p>
            <Button
              variant={moveSelectedFolderId === null ? "default" : "outline"}
              onClick={() => setMoveSelectedFolderId(null)}
              className="w-full justify-start rounded-xl text-xs"
            >
              / Root Directory
            </Button>
            {folders.map((f) => (
              <Button
                key={f.id}
                variant={moveSelectedFolderId === f.id ? "default" : "outline"}
                onClick={() => setMoveSelectedFolderId(f.id)}
                className="w-full justify-start rounded-xl text-xs"
              >
                /{f.name}
              </Button>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsMoveOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button onClick={handleMoveCommit} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs">
              Move Item Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Details View Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="rounded-3xl max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">Item Details</DialogTitle>
          </DialogHeader>
          {detailsTarget && (
            <div className="space-y-3 py-3 text-xs leading-relaxed text-foreground">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold text-right max-w-[200px] truncate">{detailsTarget.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Kind:</span>
                <span className="font-semibold">{detailsType === "folder" ? "Folder" : (detailsTarget.kind || "File")}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-semibold">{new Date(detailsTarget.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-semibold">{new Date(detailsTarget.updated_at).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs w-full">
              Close Panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
