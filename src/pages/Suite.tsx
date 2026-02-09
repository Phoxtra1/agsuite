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

export default function SuitePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Detect mode from URL
  const isAdmin = location.pathname.startsWith("/admin");

  // ✅ Base depends on mode
  const base = isAdmin ? "/admin" : "";

  const getCurrentTab = (): TabView => {
    const path = location.pathname.replace(base, "");
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
      overview: `${base || "/"}`,
      products: `${base}/products`,
      why: `${base}/why`,
      how: `${base}/how`,
      console: `${base}/console`,
      coms: `${base}/coms`,
      profile: `${base}/profile`,
      settings: `${base}/settings`,
    };

    // ✅ In public mode, block admin-only tabs from navigating anywhere
    if (!isAdmin && (tab === "console" || tab === "coms")) {
      navigate(base || "/", { replace: true });
      return;
    }

    navigate(paths[tab]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ✅ isAdmin is now dynamic */}
      <SuiteNav currentTab={currentTab} onTabChange={handleTabChange} isAdmin={isAdmin} />

      <main className="ml-64 p-8">
        <Routes>
          {/* Index route:
              - /admin shows OverviewPage (admin mode)
              - / shows OverviewPage (public mode homepage) */}
          <Route index element={<OverviewPage />} />

          <Route path="products" element={<ProductsPage />} />

          {/* ✅ Admin-only routes: if someone hits these outside /admin, push back to / */}
          <Route
            path="console"
            element={isAdmin ? <AminevaConsole /> : <Navigate to="/" replace />}
          />
          <Route
            path="coms"
            element={isAdmin ? <ComsSystem /> : <Navigate to="/" replace />}
          />

          <Route path="why" element={<WhyAminevaPage />} />
          <Route path="how" element={<HowItWorksPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* ✅ IMPORTANT:
              - In admin mode, unknown inside dashboard returns to /admin
              - In public mode, unknown returns to / */}
          <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
        </Routes>
      </main>
    </div>
  );
}
