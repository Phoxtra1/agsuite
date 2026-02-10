import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import { SuiteNav } from "@/components/suite/SuiteNav";

import { OverviewPage } from "@/components/suite/pages/OverviewPage";
import { ProductsPage } from "@/components/suite/pages/ProductsPage";
import { WhyAminevaPage } from "@/components/suite/pages/WhyAminevaPage";
import { HowItWorksPage } from "@/components/suite/pages/HowItWorksPage";
import { ProfilePage } from "@/components/suite/pages/ProfilePage";
import { SettingsPage } from "@/components/suite/pages/SettingsPage";

import { AminevaConsole } from "@/components/admin/AminevaConsole";
import { ComsSystem } from "@/components/coms/ComsSystem";

type TabView =
  | "overview"
  | "products"
  | "why"
  | "how"
  | "console"
  | "coms"
  | "profile"
  | "settings";

export default function Suite() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = (): TabView => {
    const path = location.pathname.replace("/suite", "");
    if (path.startsWith("/products")) return "products";
    if (path.startsWith("/why")) return "why";
    if (path.startsWith("/how")) return "how";
    if (path.startsWith("/console")) return "console";
    if (path.startsWith("/coms")) return "coms";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/settings")) return "settings";

    return "overview";
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (tab: TabView) => {
    const paths: Record<TabView, string> = {
      overview: "/suite",
      products: "/suite/products",
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
    <div className="min-h-screen bg-background">
      <SuiteNav currentTab={currentTab} onTabChange={handleTabChange} isAdmin={true} />

      <main className="ml-64 p-8">
        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="why" element={<WhyAminevaPage />} />
          <Route path="how" element={<HowItWorksPage />} />

          <Route path="console" element={<AminevaConsole />} />
          <Route path="coms" element={<ComsSystem />} />

          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<Navigate to="/suite" replace />} />
        </Routes>
      </main>
    </div>
  );
}
