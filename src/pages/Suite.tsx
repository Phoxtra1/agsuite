import React from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SuiteNav } from "@/components/suite/SuiteNav";

import { OverviewPage } from "@/components/suite/pages/OverviewPage";
import { ProductsPage } from "@/components/suite/pages/ProductsPage";
import { WhyAminevaPage } from "@/components/suite/pages/WhyAminevaPage";
import { HowItWorksPage } from "@/components/suite/pages/HowItWorksPage";
import { ProfilePage } from "@/components/suite/pages/ProfilePage";
import { SettingsPage } from "@/components/suite/pages/SettingsPage";

import { AminevaConsole } from "@/components/admin/AminevaConsole";
import { ComsSystem } from "@/components/coms/ComsSystem";

import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";
import { toast } from "sonner";

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
  const { user, mfaState, completeMfaSetup, completeMfaVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // In preview mode (lovable.app, localhost), grant admin access for testing
  const isPreviewMode =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("lovable.app") ||
      window.location.hostname.includes("lovableproject.com") ||
      window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1"));

  const isAdmin =
    isPreviewMode || user?.role === "super_admin" || user?.role === "manager";

  // Handle 2FA setup complete
  const handleMfaSetupComplete = () => {
    completeMfaSetup();
    toast.success("Two-factor authentication enabled!");
  };

  // Handle 2FA verification complete
  const handleMfaVerifyComplete = () => {
    completeMfaVerification();
    toast.success("Verification successful!");
  };

  // Handle recovery request
  const handleMfaRecovery = () => {
    toast.info("Please contact an administrator to reset your 2FA.");
  };

  // Block access until 2FA is complete
  if (mfaState?.required) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {mfaState.setupRequired ? (
            <TwoFactorSetup onSetupComplete={handleMfaSetupComplete} />
          ) : (
            <TwoFactorVerify
              challengeId={mfaState.challengeId || ""}
              onVerifyComplete={handleMfaVerifyComplete}
              onRecovery={handleMfaRecovery}
            />
          )}
        </div>
      </div>
    );
  }

  // Determine current tab from URL (relative to /suite)
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

  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "manager"
      ? "Manager"
      : isAdmin
      ? "Manager"
      : "User";

  return (
    <div className="min-h-screen bg-background">
      <SuiteNav currentTab={currentTab} onTabChange={handleTabChange} isAdmin={isAdmin} />

      {/* Main content area - offset by sidebar width */}
      <main className="ml-64 p-8">
        {/* Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Akwaaba, {roleLabel}</h1>
          <p className="text-muted-foreground">
            Welcome to Amineva Global. Access your products, insights, and operational tools.
          </p>
        </div>

        {/* ✅ IMPORTANT: nested routes must be RELATIVE (no leading "/") */}
        <Routes>
          {/* /suite */}
          <Route index element={<OverviewPage />} />

          {/* /suite/products */}
          <Route path="products" element={<ProductsPage />} />

          {/* /suite/why */}
          <Route path="why" element={<WhyAminevaPage />} />

          {/* /suite/how */}
          <Route path="how" element={<HowItWorksPage />} />

          {/* /suite/profile */}
          <Route path="profile" element={<ProfilePage />} />

          {/* /suite/settings */}
          <Route path="settings" element={<SettingsPage />} />

          {/* /suite/console (admin only) */}
          <Route
            path="console"
            element={isAdmin ? <AminevaConsole /> : <Navigate to="/suite" replace />}
          />

          {/* /suite/coms (admin only) */}
          <Route
            path="coms"
            element={isAdmin ? <ComsSystem /> : <Navigate to="/suite" replace />}
          />

          {/* Legacy suite-admin path: /suite/admin -> /suite/console */}
          <Route path="admin" element={<Navigate to="/suite/console" replace />} />

          {/* Optional: catch unknown suite paths */}
          <Route path="*" element={<Navigate to="/suite" replace />} />
        </Routes>
      </main>
    </div>
  );
}
