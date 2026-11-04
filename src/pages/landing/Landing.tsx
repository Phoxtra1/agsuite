import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Settings } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import amvLogo from "@/assets/amv_global_logo.png";

const navLinks = [
  { label: "Info Discovery", to: "/info-discovery" },
  { label: "About Us", to: "/about-us" },
  { label: "FAQs", to: "/faqs" },
  { label: "Support", to: "/support" },
  { label: "Workspace", to: "/workspace" },
];

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {!isHome && (
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
              <Link to="/workspace" className={`text-sm font-medium transition ${location.pathname.startsWith("/workspace") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Workspace</Link>
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
                  <Link to="/workspace" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10">Workspace</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      <Outlet />

      {!isHome && (
        <footer className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <img src={amvLogo} alt="Amineva Global" className="h-8 w-8 rounded-full" />
                  <span className="font-semibold text-foreground">Amineva Global</span>
                </div>
                <p className="text-sm text-muted-foreground">An Information Discovery System for clearer understanding and informed decisions.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-sm">Explore</h4>
                <div className="space-y-2">
                  <Link to="/info-discovery" className="block text-sm text-muted-foreground hover:text-foreground transition">Info Discovery</Link>
                  <Link to="/about-us" className="block text-sm text-muted-foreground hover:text-foreground transition">About Us</Link>
                  <Link to="/faqs" className="block text-sm text-muted-foreground hover:text-foreground transition">FAQs</Link>
                  <Link to="/support" className="block text-sm text-muted-foreground hover:text-foreground transition">Support</Link>
                  <Link to="/workspace" className="block text-sm text-muted-foreground hover:text-foreground transition">Workspace</Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-sm">Legal</h4>
                <div className="space-y-2">
                  <Link to="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition">Terms of Service</Link>
                  <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition">Privacy Policy</Link>
                </div>
              </div>
            </div>
            <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Amineva <span onClick={(e) => { if (e.detail === 3) navigate("/seal"); }} className="cursor-default select-none">Global</span>. All Rights Reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
