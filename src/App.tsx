import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

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

/* ---------- helpers ---------- */

const isLovablePreview = () => {
  const host = window.location.hostname;
  return (
    host.includes("lovable.app") ||
    host.includes("lovableproject.com") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1")
  );
};

function AminevaLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading Amineva Suite…</p>
    </div>
  );
}

function HashNormalizer() {
  useEffect(() => {
    if (window.location.hash === "#" || window.location.hash === "#/") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  return null;
}

/* ---------- route guards ---------- */

// PUBLIC HOMEPAGE (gateway)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const preview = isLovablePreview();

  if (preview) return <>{children}</>;
  if (isLoading) return <AminevaLoader />;

  if (isAuthenticated) {
    const isManager =
      user?.role === "super_admin" || user?.role === "manager";

    // Managers go to Suite
    if (isManager) {
      return <Navigate to="/suite" replace />;
    }

    // Others stay on gateway to select product
  }

  return <>{children}</>;
}

// SUITE (MANAGERS ONLY)
function ProtectedSuiteRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const preview = isLovablePreview();

  if (preview) return <>{children}</>;
  if (isLoading) return <AminevaLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isManager =
    user?.role === "super_admin" || user?.role === "manager";

  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/* ---------- routes ---------- */

function AppRoutes() {
  return (
    <Routes>
      {/* ✅ HOMEPAGE / GATEWAY */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />

      {/* Invite handling */}
      <Route
        path="/invite/:product"
        element={
          <Suspense fallback={<AminevaLoader />}>
            <InviteBridge />
          </Suspense>
        }
      />

      {/* 2FA verification */}
      <Route
        path="/auth/verify-2fa"
        element={
          <Suspense fallback={<AminevaLoader />}>
            <Verify2FA />
          </Suspense>
        }
      />

      {/* ✅ SUITE ADMIN (MANAGERS ONLY) */}
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

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/* ---------- app ---------- */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <HashNormalizer />
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
