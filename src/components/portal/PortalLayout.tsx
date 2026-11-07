import { useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Compass, BriefcaseBusiness, Wallet, LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import amvLogo from "@/assets/amv_global_logo.png";

const links = [
  { to: "/info-discovery", label: "Information Discovery", icon: Compass },
  { to: "/workspace", label: "Workspace", icon: BriefcaseBusiness },
  { to: "/payments", label: "Payments & Billing", icon: Wallet },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const navLinks = (mobile = false) => links.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={() => mobile && setMobileOpen(false)}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-accent/15 text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`
      }
    >
      <item.icon className="h-4 w-4" /> {item.label}
    </NavLink>
  ));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/info-discovery" className="flex shrink-0 items-center gap-2.5">
            <img src={amvLogo} alt="Amineva Global" className="h-9 w-9 rounded-full" />
            <span className="text-base font-semibold tracking-tight">Amineva Global</span>
          </Link>

          <nav aria-label="Your Amineva portal" className="hidden items-center gap-1 lg:flex">
            {navLinks()}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Toggle appearance"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden xl:inline">Appearance</span>
            </button>
            <div className="max-w-48 truncate border-l border-border pl-3 text-xs text-muted-foreground" title={user?.email || ""}>
              {user?.email || "Signed in"}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm transition hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close portal navigation" : "Open portal navigation"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
            <nav aria-label="Mobile portal navigation" className="flex flex-col gap-1">
              {navLinks(true)}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="max-w-[65%] truncate text-xs text-muted-foreground">{user?.email || "Signed in"}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-lg border border-border p-2"
                  aria-label="Toggle appearance"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {children}
    </div>
  );
}
