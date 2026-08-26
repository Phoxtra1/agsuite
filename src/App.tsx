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
import { WorkspaceGate } from "@/components/workspace/WorkspaceGate";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { useIdleSignout } from "@/hooks/useIdleSignout";

/* Lazy Pages */
const Landing = lazyWithRetry(() => import("./pages/landing/Landing"));
const HomePage = lazyWithRetry(() => import("./pages/HomePage"));
const AboutUs = lazyWithRetry(() => import("./pages/landing/AboutUs"));
const DipaAIPage = lazyWithRetry(() => import("./pages/landing/DipaAIPage"));
const InventraPage = lazyWithRetry(() => import("./pages/landing/InventraPage"));
const DataLensPage = lazyWithRetry(() => import("./pages/landing/DataLensPage"));
const ABIPage = lazyWithRetry(() => import("./pages/landing/ABIPage"));
const AgyenkwaPage = lazyWithRetry(() => import("./pages/landing/AgyenkwaPage"));
const AdesuaPage = lazyWithRetry(() => import("./pages/landing/AdesuaPage"));
const SikasɛmPage = lazyWithRetry(() => import("./pages/landing/SikasɛmPage"));
const SupportPage = lazyWithRetry(() => import("./pages/landing/SupportPage"));
const FAQsPage = lazyWithRetry(() => import("./pages/landing/FAQsPage"));
const TermsPage = lazyWithRetry(() => import("./pages/landing/TermsPage"));
const PrivacyPage = lazyWithRetry(() => import("./pages/landing/PrivacyPage"));

const Suite = lazyWithRetry(() => import("./pages/Suite"));
const Workspace = lazyWithRetry(() => import("./pages/Workspace"));
const SharedDocViewer = lazyWithRetry(() => import("./pages/workspace/SharedDocViewer"));
const FormRespondentView = lazyWithRetry(() => import("./pages/workspace/FormRespondentView"));
const SharedFileViewer = lazyWithRetry(() => import("./pages/workspace/SharedFileViewer"));
const WorkspacePage = lazyWithRetry(() => import("./pages/landing/WorkspacePage"));
const InviteBridge = lazyWithRetry(() => import("./pages/InviteBridge"));

const Recovery = lazyWithRetry(() => import("./pages/auth/Recovery"));
const ResetPassword = lazyWithRetry(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazyWithRetry(() => import("./pages/auth/VerifyEmail"));
const AuthCallback = lazyWithRetry(() => import("./pages/suite/AuthCallback"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Seal = lazyWithRetry(() => import("./pages/Seal"));
const AccessDenied = lazyWithRetry(() => import("./pages/AccessDenied"));

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
  // If preview or authenticated via Seal Auth (Admin ID & PIN), grant direct access to Suite & Amineva Console.
  if (isPreview() || isSealAuthenticated()) {
    return <Suite />;
  }

  return <Navigate to="/" replace />;
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
          <Route path="apps/dipa-ai" element={<DipaAIPage />} />
          <Route path="/apps/inventra" element={<InventraPage />} />
          <Route path="/apps/agyenkwa" element={<AgyenkwaPage />} />
          <Route path="/apps/adesua" element={<AdesuaPage />} />
          <Route path="explainer/adesua" element={<AdesuaPage />} />
          <Route path="explainer/datalens" element={<DataLensPage />} />
          <Route path="explainer/abi" element={<ABIPage />} />
          <Route path="explainer/sikasem" element={<SikasɛmPage />} />
          <Route path="explainer/workspace" element={<WorkspacePage />} />
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

        {/* Suite (canonical routes: /suite, /suite/console, /suite/coms, /suite/acs, /suite/profile, /suite/settings) */}
        <Route path="/suite/*" element={<SuiteGuard />} />

        {/* Workspace — productivity & data intelligence hub */}
        <Route
          path="/workspace/*"
          element={
            <WorkspaceGate>
              <Workspace />
            </WorkspaceGate>
          }
        />

        {/* Public shareable Amineva Docs viewer (no auth required) */}
        <Route path="/share/doc/:token" element={<SharedDocViewer />} />

        {/* Public shareable Amineva Form respondent page (no auth required) */}
        <Route path="/form/:formCode" element={<FormRespondentView />} />

        {/* Public shareable Amineva Drive File viewer (no auth required) */}
        <Route path="/drive/shared/:token" element={<SharedFileViewer />} />


        {/* Legacy/shorthand redirects → canonical /suite/* (preserves login context) */}
        <Route path="/console" element={<Navigate to="/suite/console" replace />} />
        <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />
        <Route path="/acs" element={<Navigate to="/suite/acs" replace />} />
        <Route path="/profile" element={<Navigate to="/suite/profile" replace />} />
        <Route path="/settings" element={<Navigate to="/suite/settings" replace />} />

        <Route path="/access-denied" element={<AccessDenied />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function AppIdleGuard() {
  useIdleSignout();
  return null;
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
            <AppIdleGuard />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
