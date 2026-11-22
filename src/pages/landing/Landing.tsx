import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Settings } from "lucide-react";
import amvLogo from "@/assets/amv_global_logo.png";
import GlobalFooter from "@/components/layout/GlobalFooter";

export default function Landing() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isAccountPortal = location.pathname === "/payments" || location.pathname === "/switch";
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSoftwareEnvironment = location.pathname.startsWith("/explore");
  const solutionsLink = "/explore";

  return (
    <div className="min-h-screen bg-background">
      {!isHome && !isAccountPortal && (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={amvLogo} alt="Amineva Global" className="h-9 w-9 rounded-full" />
              <span className="text-lg font-semibold tracking-tight text-foreground">Amineva Global</span>
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              {isSoftwareEnvironment ? (
                <>
                  <Link to="/explore" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Solutions</Link>
                  <Link to="/account-settings" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"><Settings className="h-4 w-4" /> Settings</Link>
                </>
              ) : (
                <>
                  <Link to={solutionsLink} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Solutions</Link>
                  <Link to="/impact" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Amineva Impact</Link>
                  <Link to="/about-us" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">About Us</Link>
                  <Link to="/faqs" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">FAQs</Link>
                  <Link to="/explore/appointments" className="inline-flex items-center justify-center rounded-lg bg-[#101D32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2b46]">Appointment</Link>
                </>
              )}
            </nav>
            <button type="button" aria-label="Toggle navigation" className="text-foreground lg:hidden" onClick={() => setMobileOpen(value => !value)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          <AnimatePresence>
            {mobileOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border lg:hidden">
                <div className="space-y-1 p-4">
                  {isSoftwareEnvironment ? (
                    <>
                      <Link to="/explore" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10">Solutions</Link>
                      <Link to="/account-settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10"><Settings className="h-4 w-4" /> Settings</Link>
                    </>
                  ) : (
                    <>
                      <Link to={solutionsLink} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10">Solutions</Link>
                      <Link to="/impact" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10">Amineva Impact</Link>
                      <Link to="/about-us" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10">About Us</Link>
                      <Link to="/faqs" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10">FAQs</Link>
                      <Link to="/explore/appointments" onClick={() => setMobileOpen(false)} className="block rounded-lg bg-[#101D32] px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#1a2b46]">Appointment</Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}
      <Outlet />
      {isSoftwareEnvironment && <div className="flex h-9 shrink-0 items-center justify-center bg-[#101D32] px-4 text-center text-[11px] font-medium tracking-wide text-white">© {new Date().getFullYear()} Amineva Global. All Rights Reserved.</div>}
      {!isHome && !isSoftwareEnvironment && <GlobalFooter />}
    </div>
  );
}
