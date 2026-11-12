import { useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Compass, BriefcaseBusiness, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import amvLogo from "@/assets/amv_global_logo.png";

const links = [
  { to: "/info-discovery", label: "Info Discovery", icon: Compass },
  { to: "/workspace", label: "Workspace", icon: BriefcaseBusiness },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

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

          </div>
        )}
      </header>

      {children}

    </div>
  );
}
