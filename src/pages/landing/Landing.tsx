import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Settings } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import amvLogo from "@/assets/amv_global_logo.png";
import GlobalFooter from "@/components/layout/GlobalFooter";

const navLinks = [
  { label: "Info Discovery", to: "/info-discovery" },
  { label: "About Us", to: "/about-us" },
  { label: "FAQs", to: "/faqs" },
  { label: "Support", to: "/support" },
];

export default function Landing() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isAccountPortal = location.pathname.startsWith("/info-discovery") || location.pathname.startsWith("/payments");

  return (
    <div className="min-h-screen bg-background">
      {!isHome && !isAccountPortal && (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={amvLogo} alt="Amineva Global" className="h-9 w-9 rounded-full" />
              <span className="font-semibold text-foreground text-lg tracking-tight">Amineva Global</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.slice(0, 4).map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`text-sm font-medium transition ${
                    location.pathname === link.to ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground" aria-label="Toggle appearance settings"><Settings className="h-4 w-4" /> Settings</button>
              <Link
                to="/info-discovery"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Get Started
              </Link>
            </nav>

            <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-t border-border overflow-hidden"
              >
                <div className="p-4 space-y-1">
                  <div className="border-t border-border my-2" />
                  {navLinks.slice(0, 4).map((link) => (
                    <Link key={link.label} to={link.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg">
                      {link.label}
                    </Link>
                  ))}
                  <button type="button" onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setMobileOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent/10"><Settings className="h-4 w-4" /> Settings <span className="ml-auto text-xs text-muted-foreground">{theme === "dark" ? "Dark mode" : "Light mode"}</span></button>
                  <Link
                    to="/info-discovery"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Get Started
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      <Outlet />

      {!isHome && !isAccountPortal && <GlobalFooter />}
    </div>
  );
}
