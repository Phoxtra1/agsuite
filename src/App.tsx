import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

/* Lazy Pages */
const Landing = lazy(() => import("./pages/landing/Landing"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutUs = lazy(() => import("./pages/landing/AboutUs"));
const AGStockPage = lazy(() => import("./pages/landing/AGStockPage"));
const AGISPage = lazy(() => import("./pages/landing/AGISPage"));
const AmnivaPage = lazy(() => import("./pages/landing/AmnivaPage"));
const AgroClimatePage = lazy(() => import("./pages/landing/AgroClimatePage"));
const SupportPage = lazy(() => import("./pages/landing/SupportPage"));
const FAQsPage = lazy(() => import("./pages/landing/FAQsPage"));
const TermsPage = lazy(() => import("./pages/landing/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/landing/PrivacyPage"));

const Suite = lazy(() => import("./pages/Suite"));
const InviteBridge = lazy(() => import("./pages/InviteBridge"));

const Recovery = lazy(() => import("./pages/auth/Recovery"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/suite/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const isPreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return ["lovable.app", "lovableproject.com", "localhost", "127.0.0.1"].some(h => host.includes(h));
};

const AminevaLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-accent/20 animate-pulse" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-accent animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading Amineva Global…</p>
    </div>
  </div>
);

function HashNormalizer() {
  useEffect(() => {
    if (window.location.hash === "#" || window.location.hash === "#/") {
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
  }, []);
  return null;
}

function SuiteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isPreview()) return <Suite />;
  if (isLoading) return <AminevaLoader />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location.pathname }} />;

  const isManager = user?.role === "super_admin" || user?.role === "manager";
  if (!isManager) return <Navigate to="/" replace />;

  return <Suite />;
}

function PublicHome() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <AminevaLoader />;

  // 2FA check removed - redirect authenticated managers directly
  if (!isPreview() && isAuthenticated) {
    const isManager = user?.role === "super_admin" || user?.role === "manager";
    if (isManager) return <Navigate to="/suite" replace />;
  }

  return (
    <Suspense fallback={<AminevaLoader />}>
      <HomePage />
    </Suspense>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<AminevaLoader />}>
      <Routes>
        {/* Landing pages */}
        <Route path="/" element={<Landing />}>
          <Route index element={<PublicHome />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="explainer/agstock" element={<AGStockPage />} />
          <Route path="explainer/agis" element={<AGISPage />} />
          <Route path="explainer/amniva" element={<AmnivaPage />} />
          <Route path="explainer/agroclimate" element={<AgroClimatePage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="faqs" element={<FAQsPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
        </Route>

        {/* Auth */}
        <Route path="/invite/:product" element={<InviteBridge />} />
        
        <Route path="/auth/recovery" element={<Recovery />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Suite */}
        <Route path="/suite/*" element={<SuiteGuard />} />

        {/* Legacy Redirects */}
        <Route path="/admin/*" element={<Navigate to="/suite" replace />} />
        <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

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
