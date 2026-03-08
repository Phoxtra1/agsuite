import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import { SuiteNav } from "@/components/suite/SuiteNav";
import { OverviewPage } from "@/components/suite/pages/OverviewPage";
import { ProfilePage } from "@/components/suite/pages/ProfilePage";
import { SettingsPage } from "@/components/suite/pages/SettingsPage";
import { AminevaConsole } from "@/components/admin/AminevaConsole";
import { ComsSystem } from "@/components/coms/ComsSystem";
import { ACSModule } from "@/components/acs/ACSModule";

import { BackendToggle } from "@/components/suite/pages/BackendToggle";
import { EmailVerificationBanner } from "@/components/suite/EmailVerificationBanner";

type TabView = "overview" | "console" | "coms" | "acs" | "profile" | "settings";

export default function Suite() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleTabChange = (tab: TabView) => {
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

  return (
    <div className="min-h-screen bg-background">
      <SuiteNav currentTab={currentTab} onTabChange={handleTabChange} isAdmin={true} />

      <main className="ml-64 p-8">
        <BackendToggle />

        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="console" element={<AminevaConsole />} />
          <Route path="coms" element={<ComsSystem />} />
          <Route path="acs" element={<ACSModule />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/suite" replace />} />
        </Routes>
      </main>
    </div>
  );
}
