import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";

import { SuiteNav } from "@/components/suite/SuiteNav";
import { OverviewPage } from "@/components/suite/pages/OverviewPage";
import { ProfilePage } from "@/components/suite/pages/ProfilePage";
import { SettingsPage } from "@/components/suite/pages/SettingsPage";
import { AminevaConsole } from "@/components/admin/AminevaConsole";
import { ComsSystem } from "@/components/coms/ComsSystem";
import { ACSModule } from "@/components/acs/ACSModule";

import { EmailVerificationBanner } from "@/components/suite/EmailVerificationBanner";
import { useAppSession } from "@/components/auth/AppAuthGate";
import { getSealSession } from "@/lib/sealAuth";

type TabView = "overview" | "console" | "coms" | "acs" | "profile" | "settings";

const isPreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return ["lovable.app", "lovableproject.com", "localhost", "127.0.0.1"].some(h => host.includes(h));
};

export default function Suite() {
  const navigate = useNavigate();
  const location = useLocation();
  const { access } = useAppSession();
  const sealSession = getSealSession();
  const isAdmin = isPreview() || !!sealSession || ["manager", "super_admin"].includes(access?.role ?? "");

  const getCurrentTab = (): TabView => {
    const path = location.pathname.replace("/suite", "");
    if (path.startsWith("/console")) return "console";
    if (path.startsWith("/coms")) return "coms";
    if (path.startsWith("/acs")) return "acs";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/settings")) return "settings";
    return "overview";
  };

  const currentTab = getCurrentTab();
  const [searchParams] = useSearchParams();
  const viewportUrl = searchParams.get("viewport");
  const viewportName = searchParams.get("name") || "Application";
  const targetApp = searchParams.get("app");

  const [securedUrl, setSecuredUrl] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewportUrl || !targetApp) {
      setSecuredUrl(null);
      setGateError(null);
      return;
    }

    setSecuredUrl(viewportUrl);
    setGeneratingToken(false);
    setGateError(null);
  }, [viewportUrl, targetApp]);

  const handleTabChange = (tab: TabView) => {
    if (["console", "coms", "acs"].includes(tab) && !isAdmin) {
      navigate("/access-denied", { replace: true });
      return;
    }
    const paths: Record<TabView, string> = {
      overview: "/suite",
      console: "/suite/console",
      coms: "/suite/coms",
      acs: "/suite/acs",
      profile: "/suite/profile",
      settings: "/suite/settings",
    };
    navigate(paths[tab]);
  };

  if (viewportUrl) {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden select-none animate-in fade-in duration-500">
        {/* Secure Enclave Top Bar */}
        <div className="h-14 bg-slate-900 border-b border-white/5 px-6 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 animate-pulse" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-wide">{viewportName}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Secure Enclave
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden md:inline">
              Session locked to Amineva Suite container
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/suite", { replace: true })}
              className="h-8 border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-xs gap-1.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Close Sandbox
            </Button>
          </div>
        </div>

        {/* Dynamic Sandbox Viewport */}
        <div className="flex-1 w-full h-full bg-slate-900 relative flex items-center justify-center">
          {generatingToken && (
            <div className="flex flex-col items-center gap-3 text-slate-400 text-sm">
              <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Authenticating Secure SSO Session...</span>
            </div>
          )}
          
          {gateError && (
            <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
              <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <X className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Enclave Auth Failed</h3>
                <p className="text-xs text-slate-400">{gateError}</p>
              </div>
              <Button size="sm" onClick={() => navigate("/suite", { replace: true })} className="bg-white/10 hover:bg-white/15 text-white">
                Back to Dashboard
              </Button>
            </div>
          )}

          {!generatingToken && !gateError && securedUrl && (
            <iframe
              src={securedUrl}
              title={viewportName}
              className="w-full h-full border-none bg-slate-900"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SuiteNav currentTab={currentTab} onTabChange={handleTabChange} isAdmin={isAdmin} />

      <main className="ml-64 p-8">
        <EmailVerificationBanner />

        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="console" element={isAdmin ? <AminevaConsole /> : <Navigate to="/access-denied" replace />} />
          <Route path="coms" element={isAdmin ? <ComsSystem /> : <Navigate to="/access-denied" replace />} />
          <Route path="acs" element={isAdmin ? <ACSModule /> : <Navigate to="/access-denied" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/suite" replace />} />
        </Routes>
      </main>
    </div>
  );
}
