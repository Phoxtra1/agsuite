import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, FolderOpen, FileText, Sheet as SheetIcon, Presentation, ClipboardList, ArrowLeft, LogOut, Menu, X, Download, Upload, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceSession } from "@/components/workspace/WorkspaceGate";
import { createWorkspaceLocalBackup, restoreWorkspaceLocalBackup } from "@/lib/workspace/localStore";
import { toast } from "sonner";
import amvLogo from "@/assets/amv_global_logo.png";

const items = [
  { to: "/workspace", icon: LayoutGrid, label: "Dashboard", end: true },
  { to: "/workspace/docs", icon: FileText, label: "Amineva Docs" },
  { to: "/workspace/sheets", icon: SheetIcon, label: "Amineva Sheets" },
  { to: "/workspace/slides", icon: Presentation, label: "Amineva Slides" },
  { to: "/workspace/forms", icon: ClipboardList, label: "Amineva Forms" },
  { to: "/workspace/drive", icon: FolderOpen, label: "Amineva Drive" },
];

export function WorkspaceNav() {
  const { user, logout } = useAuth() as any;
  const workspaceSession = useWorkspaceSession();
  const navigate = useNavigate();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [open, setOpen] = useState(false);


  const exportBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await createWorkspaceLocalBackup();
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `amineva-workspace-${backup.userId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Workspace backup exported.");
    } catch (error: any) {
      toast.error(error?.message || "Could not export Workspace backup.");
    } finally {
      setBackupBusy(false);
    }
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBackupBusy(true);
    try {
      const raw = await file.text();
      const backup = JSON.parse(raw);
      const confirmed = window.confirm(
        "Restore this backup into the currently active account? Newer local records will be kept; matching older records and cached files may be replaced."
      );
      if (!confirmed) return;
      const result = await restoreWorkspaceLocalBackup(backup);
      toast.success(`Backup restored: ${result.records} records, ${result.blobs} Drive files, ${result.settings} settings.`);
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || "Could not restore Workspace backup.");
    } finally {
      setBackupBusy(false);
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const preload = () => {
      void import("@/pages/workspace/DocsList");
      void import("@/pages/workspace/DocsEditor");
      void import("@/pages/workspace/SheetsList");
      void import("@/pages/workspace/SheetsEditor");
      void import("@/pages/workspace/SlidesList");
      void import("@/pages/workspace/SlidesEditor");
    };
    const timer = window.setTimeout(preload, 50);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 h-14 flex items-center gap-3 px-4 border-b border-border bg-card">
        <button
          aria-label="Open workspace menu"
          onClick={() => setOpen(true)}
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src={amvLogo} alt="" className="h-8 w-8 rounded-full" />
        <div className="text-sm font-semibold text-foreground">Workspace</div>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <img src={amvLogo} alt="" className="h-9 w-9 rounded-full" />
          <div className="leading-tight flex-1">
            <div className="text-sm font-semibold text-foreground">Workspace</div>
            <div className="text-[11px] text-muted-foreground">Amineva Suite</div>
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end as any}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <i.icon className="h-4 w-4" />
              {i.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={restoreBackup}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={exportBackup}
              disabled={backupBusy}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Export backup
            </button>
            <button
              type="button"
              onClick={() => restoreInputRef.current?.click()}
              disabled={backupBusy}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" /> Restore backup
            </button>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
            <div className="h-8 w-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-semibold">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="min-w-0 text-xs">
              <div className="font-medium text-foreground truncate">{user?.email || "Signed in"}</div>
              <div className="text-muted-foreground">Workspace account</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/suite")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Suite
          </button>
          <button
            onClick={() => workspaceSession.offline ? window.location.reload() : logout?.()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
          >
            {workspaceSession.offline ? <Lock className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
            {workspaceSession.offline ? "Lock Workspace" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
