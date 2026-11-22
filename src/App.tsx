import React, { Suspense, lazy, useEffect, useState, useCallback } from "react";
import InfoServicesPage from "./pages/landing/InfoServicesPage";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { isSealAuthenticated } from "@/lib/sealAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppAuthGate } from "@/components/auth/AppAuthGate";
import { WorkspaceGate } from "@/components/workspace/WorkspaceGate";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { useIdleSignout } from "@/hooks/useIdleSignout";
import { NetworkStatus } from "@/components/pwa/NetworkStatus";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";

/* Lazy Pages */
const Landing = lazyWithRetry(() => import("./pages/landing/Landing"));
const HomePage = lazyWithRetry(() => import("./pages/HomePage"));
const AboutUs = lazyWithRetry(() => import("./pages/landing/AboutUs"));
const ExplorePage = lazyWithRetry(() => import("./pages/landing/ExplorePage"));
const EventsPage = lazyWithRetry(() => import("./pages/landing/EventsPage"));
const EventDetailPage = lazyWithRetry(() => import("./pages/landing/EventDetailPage"));
const AppointmentsPage = lazyWithRetry(() => import("./pages/landing/AppointmentsPage"));
const AppointmentCategoryPage = lazyWithRetry(() => import("./pages/landing/AppointmentCategoryPage"));
const GetStartedPage = lazyWithRetry(() => import("./pages/GetStartedPage"));
const AccountSettingsPage = lazyWithRetry(() => import("./pages/AccountSettingsPage"));
const DeviceCenterPage = lazyWithRetry(() => import("./pages/DeviceCenterPage"));
const SwitchDashboard = lazyWithRetry(() => import("./pages/landing/SwitchDashboard"));
const PortalLayout = lazyWithRetry(() => import("./components/portal/PortalLayout"));
const PortalAuthGate = lazyWithRetry(() => import("./components/auth/PortalAuthGate"));
const AminevaImpactPage = lazyWithRetry(() => import("./pages/landing/AminevaImpactPage"));
const CareerDevelopmentPage = lazyWithRetry(() => import("./pages/landing/CareerDevelopmentPage"));
const DipaAIPage = lazyWithRetry(() => import("./pages/landing/DipaAIPage"));
const InventraPage = lazyWithRetry(() => import("./pages/landing/InventraPage"));
const ABIPage = lazyWithRetry(() => import("./pages/landing/ABIPage"));
const AgroClimatePage = lazyWithRetry(() => import("./pages/landing/AgroClimatePage"));
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

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string; componentStack: string }
> {
  state = { hasError: false, errorMessage: "", componentStack: "" };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMessage: error?.message || String(error),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Amineva route error]", error, info.componentStack);
    this.setState({ errorMessage: error?.message || String(error), componentStack: info.componentStack || "" });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-[60vh] items-center justify-center bg-background px-5 py-12 text-foreground">
          <section className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <h1 className="text-xl font-semibold">This page could not be loaded</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The application caught an error while rendering this route. The technical detail below identifies the failing module so it can be corrected.
            </p>
            <pre role="alert" className="mt-4 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-left text-xs text-foreground">{this.state.errorMessage || "Error detail unavailable"}</pre>
            {this.state.componentStack && <details className="mt-3 text-left text-xs text-muted-foreground"><summary className="cursor-pointer">Component trace</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3">{this.state.componentStack}</pre></details>}
            <button
              type="button"
              onClick={() => window.location.assign(window.location.pathname + "?sw=off&recovery=" + Date.now())}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Retry without service worker
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
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
          {/* Keep the legacy /info-system address working as a homepage alias; it is not a navigation item. */}
          <Route path="info-system" element={<Navigate to="/" replace />} />
          <Route path="get-started" element={<GetStartedPage />} />
          <Route
            path="switch"
            element={<PortalAuthGate><PortalLayout><SwitchDashboard /></PortalLayout></PortalAuthGate>}
          />
          <Route path="payments" element={<Navigate to="/switch" replace />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="impact" element={<AminevaImpactPage />} />
          <Route path="impact/career-development" element={<CareerDevelopmentPage />} />
          <Route path="impact/:initiativeId" element={<AminevaImpactPage />} />
          <Route path="apps/dipa-ai" element={<DipaAIPage />} />
          <Route path="/apps/inventra" element={<InventraPage />} />
          <Route path="/apps/agroclimate" element={<AgroClimatePage />} />
          <Route path="explainer/agroclimate" element={<AgroClimatePage />} />
          <Route path="/apps/agyenkwa" element={<Navigate to="/apps/agroclimate" replace />} />
          <Route path="/apps/adesua" element={<AdesuaPage />} />
          <Route path="explainer/adesua" element={<AdesuaPage />} />
          <Route path="explainer/info-services" element={<InfoServicesPage />} />
          <Route path="info-services" element={<Navigate to="/explainer/info-services" replace />} />
          <Route path="apps/info-services" element={<Navigate to="/explainer/info-services" replace />} />
          <Route path="explainer/datalens" element={<Navigate to="/explainer/info-services" replace />} />
          <Route path="apps/datalens" element={<Navigate to="/explainer/info-services" replace />} />
          <Route path="explainer/abi" element={<ABIPage />} />
          <Route path="explainer/sikasem" element={<SikasɛmPage />} />
          <Route path="explainer/workspace" element={<WorkspacePage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="faqs" element={<FAQsPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
        </Route>

        {/* Standalone software environment and application routes */}
        <Route path="/explore" element={<Landing />}>
          <Route index element={<ExplorePage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/career-travel-relocation-2027" element={<EventDetailPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/:category" element={<AppointmentCategoryPage />} />
          <Route path=":section" element={<ExplorePage />} />
        </Route>
        <Route path="/account-settings" element={<AccountSettingsPage />} />
        <Route path="/devices" element={<DeviceCenterPage />} />

        {/* Auth */}
        <Route path="/invite/:product" element={<InviteBridge />} />
        
        <Route path="/auth/recovery" element={<Recovery />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Seal (hidden admin entry) */}
        <Route path="/seal" element={<Seal />} />

        {/* Suite routes: /suite, /suite/console, /suite/coms, /suite/profile, /suite/settings */}
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
        <Route path="/profile" element={<Navigate to="/suite/profile" replace />} />
        <Route path="/settings" element={<Navigate to="/suite/settings" replace />} />

        <Route path="/access-denied" element={<AccessDenied />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function RouteErrorBoundaryForLocation() {
  const location = useLocation();
  return <RouteErrorBoundary key={location.pathname}><AppRoutes /></RouteErrorBoundary>;
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
            <NetworkStatus />
            <PWAInstallPrompt />
            <AppIdleGuard />
            <RouteErrorBoundaryForLocation />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
