import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthGate } from "@/components/auth/AuthGate";

import SuitePage from "./pages/Suite";
import NotFound from "./pages/NotFound";

// Lazy routes
const InviteBridge = lazy(() => import("./pages/InviteBridge"));
const Verify2FA = lazy(() => import("./pages/auth/Verify2FA"));

const queryClient = new QueryClient();

/**
 * Detect Lovable preview/local env
 * (avoid redirect loops and allow dev testing)
 */
function isLovablePreview() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host.includes("lovable.app") ||
    host.includes("lovableproject.com") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1")
  );
}

// Loading UI
function AminevaLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-accent/20 animate-pulse" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-accent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading Amineva Suite...
        </p>
      </div>
    </div>
  );
}

/**
 * Normalizes stray hashes from some OAuth flows
 */
function HashNormalizer() {
  useEffect(() => {
    if (typeof window === "undefined") return;
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

/**
 * Protected suite wrapper
 * - Preview: allow access (so you can test UI even if Appwrite is blocked)
 * - Prod: only authenticated managers/super_admins
 */
function ProtectedSuiteRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const preview = isLovablePreview();

  if (preview) return <>{children}</>;
  if (isLoading) return <AminevaLoader />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const isManager = user?.role === "super_admin" || user?.role === "manager";
  if (!isManager) return <Navigate to="/" replace />;

  return <>{children}</>;
}

/**
 * Public gateway
 * - Preview: never force redirects
 * - Prod: managers go to /admin, others stay on gateway
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const preview = isLovablePreview();

  if (preview) return <>{children}</>;
  if (isLoading) return <AminevaLoader />;

  if (isAuthenticated) {
    const isManager = user?.role === "super_admin" || user?.role === "manager";
    if (isManager) return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

/**
 * Canonical admin entry:
 * Always land admins here.
 * It redirects into /suite/console (your admin home) and prevents 404s.
 */
function AdminEntry() {
  return <Navigate to="/suite/console" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public gateway / login */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />

      {/* Invite bridge */}
      <Route
        path="/invite/:product"
        element={
          <Suspense fallback={<AminevaLoader />}>
            <InviteBridge />
          </Suspense>
        }
      />

      {/* Step-up 2FA verification */}
      <Route
        path="/auth/verify-2fa"
        element={
          <Suspense fallback={<AminevaLoader />}>
            <Verify2FA />
          </Suspense>
        }
      />

      {/* Canonical admin routes */}
      <Route path="/admin" element={<AdminEntry />} />
      <Route path="/admin/*" element={<AdminEntry />} />

      {/* Compatibility redirect */}
      <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />

      {/* Suite container */}
      <Route
        path="/suite/*"
        element={
          <AuthGate guest={<LoginForm />}>
            <ProtectedSuiteRoute>
              <SuitePage />
            </ProtectedSuiteRoute>
          </AuthGate>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            {/* Keep these only once */}
            <Toaster />
            <Sonner />

            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <HashNormalizer />
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
