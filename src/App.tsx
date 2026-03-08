import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { isSealAuthenticated } from "@/lib/sealAuth";
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
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const AuthCallback = lazy(() => import("./pages/suite/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Seal = lazy(() => import("./pages/Seal"));

const queryClient = new QueryClient();

const isPreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return ["lovable.app", "lovableproject.com", "localhost", "127.0.0.1"].some(h => host.includes(h));
};

const AminevaLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      {/* Logo with pulse-glow animation */}
      <div className="relative flex items-center justify-center">
        {/* Orbiting ring */}
        <div className="absolute w-24 h-24 rounded-full border-2 border-accent/20 animate-[spin_3s_linear_infinite]" />
        <div className="absolute w-24 h-24 rounded-full border-2 border-transparent border-t-accent border-r-accent/50 animate-[spin_2s_linear_infinite_reverse]" />
        {/* Logo */}
        <img
          src="/favicon.png"
          alt="Amineva Global"
          className="w-14 h-14 rounded-xl animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] drop-shadow-[0_0_12px_hsl(38_92%_50%/0.4)]"
        />
      </div>
      {/* Animated text */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm font-medium text-foreground tracking-wide animate-fade-in">
          Amineva Global
        </p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[bounce_1s_ease-in-out_infinite]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[bounce_1s_ease-in-out_0.15s_infinite]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[bounce_1s_ease-in-out_0.3s_infinite]" />
        </div>
      </div>
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
  // In preview mode, allow direct access for development
  if (isPreview()) return <Suite />;

  // Production: require seal (admin OTP) authentication
  if (!isSealAuthenticated()) return <Navigate to="/" replace />;

  return <Suite />;
}

function PublicHome() {
  // If seal-authenticated, redirect to Suite
  if (!isPreview() && isSealAuthenticated()) {
    return <Navigate to="/suite" replace />;
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
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Suite */}
        <Route path="/suite/*" element={<SuiteGuard />} />

        {/* Legacy Redirects */}
        <Route path="/admin/*" element={<Navigate to="/suite" replace />} />
        <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />
        <Route path="/auth/verify-2fa" element={<Navigate to="/" replace />} />

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
