import React, { Suspense, lazy, useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { isSealAuthenticated } from "@/lib/sealAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ACSEmitter, startACSEmitter, stopACSEmitter } from "@/core/acs/emitter";
import { AppAuthGate } from "@/components/auth/AppAuthGate";

/* Lazy Pages */
const Landing = lazy(() => import("./pages/landing/Landing"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutUs = lazy(() => import("./pages/landing/AboutUs"));
const AGStockPage = lazy(() => import("./pages/landing/AGStockPage"));
const AGISPage = lazy(() => import("./pages/landing/AGISPage"));
const AmnivaPage = lazy(() => import("./pages/landing/AmnivaPage"));
const AgroClimatePage = lazy(() => import("./pages/landing/AgroClimatePage"));
const AminevaOpsPage = lazy(() => import("./pages/landing/AminevaOpsPage"));
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
const AccessDenied = lazy(() => import("./pages/AccessDenied"));

const queryClient = new QueryClient();

const isPreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return ["lovable.app", "lovableproject.com", "localhost", "127.0.0.1"].some(h => host.includes(h));
};

const AminevaLoader = ({ onFinish }: { onFinish?: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Animate progress over ~7 seconds
    const duration = 7000;
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      // Ease-out curve for natural feel
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t >= 1) {
        clearInterval(timer);
        setTimeout(() => onFinish?.(), 400);
      }
    }, interval);

    // Phase cycling for text
    const phaseTimer = setInterval(() => setPhase((p) => (p + 1) % 3), 2200);

    return () => { clearInterval(timer); clearInterval(phaseTimer); };
  }, [onFinish]);

  const phases = ["Initializing systems…", "Loading modules…", "Almost ready…"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        {/* Logo with orbiting rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer orbit */}
          <div className="absolute w-28 h-28 rounded-full border border-accent/10 animate-[spin_6s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent/40" />
          </div>
          {/* Inner orbit */}
          <div className="absolute w-20 h-20 rounded-full border border-accent/20 animate-[spin_3s_linear_infinite_reverse]">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent/60" />
          </div>
          {/* Glow pulse */}
          <div className="absolute w-16 h-16 rounded-xl bg-accent/10 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
          {/* Logo */}
          <img
            src="/favicon.png"
            alt="Amineva Global"
            className="w-14 h-14 rounded-xl relative z-10 drop-shadow-[0_0_20px_hsl(var(--accent)/0.5)]"
          />
        </div>

        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-base font-semibold text-foreground tracking-widest uppercase animate-fade-in">
            Amineva Global
          </p>

          {/* Progress bar */}
          <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Phase text */}
          <p className="text-xs text-muted-foreground h-4 transition-opacity duration-300">
            {phases[phase]}
          </p>
        </div>
      </div>
    </div>
  );
};

function HashNormalizer() {
  useEffect(() => {
    if (window.location.hash === "#" || window.location.hash === "#/") {
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
  }, []);
  return null;
}

function AppTelemetry() {
  const location = useLocation();

  useEffect(() => {
    startACSEmitter();
    return () => stopACSEmitter();
  }, []);

  useEffect(() => {
    ACSEmitter.trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

function SuiteGuard() {
  // In preview mode, allow direct access for development
  if (isPreview()) {
    return (
      <AppAuthGate>
        <Suite />
      </AppAuthGate>
    );
  }

  // Production: require seal (admin OTP) authentication
  if (!isSealAuthenticated()) return <Navigate to="/" replace />;

  return (
    <AppAuthGate>
      <Suite />
    </AppAuthGate>
  );
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
          <Route path="/apps/agstock" element={<AGStockPage />} />
          <Route path="/apps/agroclimate" element={<AgroClimatePage />} />
          <Route path="/apps/odeneho-ai" element={<OdenehoAIPage />} />
          <Route path="explainer/agis" element={<AGISPage />} />
          <Route path="explainer/amniva" element={<AmnivaPage />} />
          <Route path="explainer/aminevaops" element={<AminevaOpsPage />} />
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

        {/* Seal (hidden admin entry) */}
        <Route path="/seal" element={<Seal />} />

        {/* Suite */}
        <Route path="/suite/*" element={<SuiteGuard />} />

        {/* Legacy Redirects */}
        <Route path="/admin/*" element={<Navigate to="/suite" replace />} />
        <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />
        <Route path="/auth/verify-2fa" element={<Navigate to="/" replace />} />

        <Route path="/access-denied" element={<AccessDenied />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const handleFinish = useCallback(() => setReady(true), []);

  if (!ready) {
    return (
      <ThemeProvider>
        <AminevaLoader onFinish={handleFinish} />
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashNormalizer />
            <AppTelemetry />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
