import React from "react";
import {
  Folder,
  Clock,
  Star,
  Trash2,
  HardDrive,
  Settings,
  Users,
  Layout,
  Sparkles
} from "lucide-react";
import { DriveStorageMeter } from "./DriveStorageMeter";

interface DriveSidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  used: number;
  quota: number;
}

export function DriveSidebar({ currentTab, onChangeTab, used, quota }: DriveSidebarProps) {
  const menuItems = [
    { id: "my-drive", label: "My Drive", icon: HardDrive },
    { id: "shared", label: "Shared", icon: Users },
    { id: "workspaces", label: "Workspaces", icon: Layout },
    { id: "recent", label: "Recent", icon: Clock },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "trash", label: "Trash", icon: Trash2 },
    { id: "storage", label: "Storage", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/40 flex flex-col h-[calc(100vh-3.5rem)] md:sticky md:top-14">
      {/* Navigation section */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Amineva Drive
        </h2>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? "bg-sky-500/10 text-sky-500 font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${active ? "text-sky-500" : "text-muted-foreground"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Storage and Plan display */}
      <div className="p-4 border-t border-border bg-card/60">
        <DriveStorageMeter used={used} quota={quota} />
      </div>
    </aside>
  );
}
