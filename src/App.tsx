import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { is2FAVerifiedThisSession } from "@/lib/stepUpAuth";

/* =========================
   LAZY PAGES (TSX ONLY)
   ========================= */

/* Landing Controller */
const Landing = lazy(() => import("./pages/landing/Landing"));

/* Landing Pages */
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutUs = lazy(() => import("./pages/landing/AboutUs"));

/* Suite */
const Suite = lazy(() => import("./pages/Suite"));

/* Auth / Utility */
const InviteBridge = lazy(() => import("./pages/InviteBridge"));
const Verify2FA = lazy(() => import("./pages/auth/Verify2FA"));
const Recovery = lazy(() => import("./pages/auth/Recovery"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/suite/AuthCallback"));

/* Fallback */
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

/* =========================
   PREVIEW DETECTION
   ========================= */
const isPreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return ["lovable.app", "lovableproject.com", "localhost", "127.0.0.1"].some(h =>
    host.includes(h)
  );
};

/* =========================
   LOADER
   ========================= */
const AminevaLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-accent/20 animate-pulse" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-accent animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        Loading Amineva Global…
      </p>
    </div>
  </div>
);

/* =========================
   HASH NORMALIZER
   ========================= */
function HashNormalizer() {
  useEffect(() => {
    if (window.location.hash === "#" || window.location.hash === "#/") {
      window.history.replaceState(
        {},
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);
  return null;
}

/* =========================
   SUITE GUARD
   ========================= */
function SuiteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isPreview()) return <Suite />;

  if (isLoading) return <AminevaLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  const isManager =
    user?.role === "super_admin" || user?.role === "manager";

  if (!isManager) return <Navigate to="/" replace />;

  return <Suite />;
}

/* =========================
   PUBLIC HOME CONTROLLER
   ========================= */
function PublicHome() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <AminevaLoader />;

  if (!isPreview() && isAuthenticated && is2FAVerifiedThisSession()) {
    const isManager =
      user?.role === "super_admin" || user?.role === "manager";
    if (isManager) return <Navigate to="/suite" replace />;
  }

  return <HomePage />;
}

/* =========================
   ROUTES (SLC-CORRECT)
   ========================= */
function AppRoutes() {
  return (
    <Suspense fallback={<AminevaLoader />}>
      <Routes>

        {/* LANDING (SINGLE CONTROLLER) */}
        <Route path="/" element={<Landing />}>
          <Route index element={<PublicHome />} />
          <Route path="about-us" element={<AboutUs />} />
        </Route>

        {/* AUTH / INVITE */}
        <Route path="/invite/:product" element={<InviteBridge />} />
        <Route path="/auth/verify-2fa" element={<Verify2FA />} />
        <Route path="/auth/recovery" element={<Recovery />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* SUITE */}
        <Route path="/suite/*" element={<SuiteGuard />} />

        {/* LEGACY REDIRECTS */}
        <Route path="/admin/*" element={<Navigate to="/suite" replace />} />
        <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  );
}

/* =========================
   APP ROOT
   ========================= */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashNormalizer />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
