import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, FileText, Sheet as SheetIcon, Presentation, ClipboardList, ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import amvLogo from "@/assets/amv_global_logo.png";

const items = [
  { to: "/workspace", icon: LayoutGrid, label: "Dashboard", end: true },
  { to: "/workspace/docs", icon: FileText, label: "Amineva Docs" },
  { to: "/workspace/sheets", icon: SheetIcon, label: "Amineva Sheets" },
  { to: "/workspace/slides", icon: Presentation, label: "Amineva Slides" },
  { to: "/workspace/forms", icon: ClipboardList, label: "Amineva Forms" },
];

export function WorkspaceNav() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
        <img src={amvLogo} alt="" className="h-9 w-9 rounded-full" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-foreground">Workspace</div>
          <div className="text-[11px] text-muted-foreground">Amineva Suite</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end as any}
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
          onClick={() => logout?.()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </aside>
  );
}
