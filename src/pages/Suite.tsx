import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { SuiteNav } from "@/components/suite/SuiteNav";

import { OverviewPage } from "@/components/suite/pages/OverviewPage";
import { WhyAminevaPage } from "@/components/suite/pages/WhyAminevaPage";
import { HowItWorksPage } from "@/components/suite/pages/HowItWorksPage";
import { ProfilePage } from "@/components/suite/pages/ProfilePage";
import { SettingsPage } from "@/components/suite/pages/SettingsPage";

import { AminevaConsole } from "@/components/admin/AminevaConsole";
import { ComsSystem } from "@/components/coms/ComsSystem";

type TabView =
  | "overview"
  | "why"
  | "how"
  | "console"
  | "coms"
  | "profile"
  | "settings";

export default function Suite() {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Determine active tab from suite-relative path
   */
  const getCurrentTab = (): TabView => {
    const path = location.pathname.replace("/suite", "");

    if (path.startsWith("/why")) return "why";
    if (path.startsWith("/how")) return "how";
    if (path.startsWith("/console")) return "console";
    if (path.startsWith("/coms")) return "coms";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/settings")) return "settings";

    return "overview";
  };

  const currentTab = getCurrentTab();

  /**
   * Stable dashboard navigation
   */
  const handleTabChange = (tab: TabView) => {
    const paths: Record<TabView, string> = {
      overview: "/suite",
      why: "/suite/why",
      how: "/suite/how",
      console: "/suite/console",
      coms: "/suite/coms",
      profile: "/suite/profile",
      settings: "/suite/settings",
    };

    navigate(paths[tab]);
  };

  return (
  <div className="min-h-screen bg-background relative">
    <div className="relative z-10 pointer-events-auto">
      <SuiteNav ... />
      <main className="ml-64 p-8 pointer-events-auto">
        {/* routes */}
      </main>
    </div>
  </div>
);
      <main className="ml-64 p-8">
        <Routes>
          {/* Dashboard home */}
          <Route index element={<OverviewPage />} />

          {/* Informational */}
          <Route path="why" element={<WhyAminevaPage />} />
          <Route path="how" element={<HowItWorksPage />} />

          {/* Admin systems */}
          <Route path="console" element={<AminevaConsole />} />
          <Route path="coms" element={<ComsSystem />} />

          {/* User */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Safety net: never escape dashboard */}
          <Route path="*" element={<Navigate to="/suite" replace />} />
        </Routes>
      </main>
    </div>
  );
}
