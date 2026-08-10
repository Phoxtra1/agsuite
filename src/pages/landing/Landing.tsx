import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import amvLogo from "@/assets/amv_global_logo.png";

const apps: Array<{ label: string; to: string; external?: boolean }> = [
  { label: "Dipa AI", to: "/apps/dipa-ai" },
  { label: "Inventra", to: "/apps/inventra" },
  { label: "Agyenkwa", to: "/apps/agyenkwa" },
  { label: "Adesua", to: "/apps/adesua" },
];

const explainerItems = [
  { label: "Innovation Ecosystem", to: "/about-us" },
  { label: "DataLens", to: "/explainer/datalens" },
  { label: "ABI", to: "/explainer/abi" },
  { label: "Sikasɛm", to: "/explainer/sikasɛm" },
];

const navLinks = [
  { label: "About Us", to: "/about-us" },
  { label: "FAQs", to: "/faqs" },
  { label: "Support", to: "/support" },
];

function DropdownMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition">
        {label} <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 min-w-[220px] rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <DropdownMenu label="Apps">
                <div className="p-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Our Platforms</p>
                  {apps.map((app) => (
                    app.external ? (
                      <a
                        key={app.label}
                        href={app.to}
                        target="_blank"
                        rel="noreferrer"
                        className="block px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg transition"
                      >
                        {app.label}
                      </a>
                    ) : (
                      <Link
                        key={app.label}
                        to={app.to}
                        className="block px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg transition"
                      >
                        {app.label}
                      </Link>
                    )
                  ))}
                </div>
              </DropdownMenu>

              <DropdownMenu label="Explainer">
                <div className="p-2">
                  {explainerItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="block px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </DropdownMenu>

              {navLinks.map((link) => (
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase px-3 py-1">Apps</p>
                  {apps.map((app) => (
                    app.external ? (
                      <a key={app.label} href={app.to} target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg">
                        {app.label}
                      </a>
                    ) : (
                      <Link key={app.label} to={app.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg">
                        {app.label}
                      </Link>
                    )
                  ))}
                  <p className="text-xs font-semibold text-muted-foreground uppercase px-3 py-1 mt-2">Explainer</p>
                  {explainerItems.map((item) => (
                    <Link key={item.label} to={item.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg">
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-border my-2" />
                  {navLinks.map((link) => (
                    <Link key={link.label} to={link.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg">
                      {link.label}
                    </Link>
                  ))}
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
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <img src={amvLogo} alt="Amineva Global" className="h-8 w-8 rounded-full" />
                  <span className="font-semibold text-foreground">Amineva Global</span>
                </div>
                <p className="text-sm text-muted-foreground">Digital infrastructure for confident decisions.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-sm">Products</h4>
                <div className="space-y-2">
                  {explainerItems.map((item) => (
                    <Link key={item.label} to={item.to} className="block text-sm text-muted-foreground hover:text-foreground transition">{item.label}</Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-sm">Company</h4>
                <div className="space-y-2">
                  <Link to="/about-us" className="block text-sm text-muted-foreground hover:text-foreground transition">About Us</Link>
                  <Link to="/support" className="block text-sm text-muted-foreground hover:text-foreground transition">Support</Link>
                  <Link to="/faqs" className="block text-sm text-muted-foreground hover:text-foreground transition">FAQs</Link>
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
