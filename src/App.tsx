import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { LoginForm } from "@/components/auth/LoginForm";
import SuitePage from "./pages/Suite";
import NotFound from "./pages/NotFound";

const InviteBridge = lazy(() => import("./pages/InviteBridge"));
const Verify2FA = lazy(() => import("./pages/auth/Verify2FA"));

const queryClient = new QueryClient();

const isPreview = () => {
  if (typeof window === "undefined") return false;
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
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-accent/20 animate-pulse" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-accent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading Amineva Global...
        </p>
      </div>
    </div>
  );
}

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

/**
 * Public Home/Gateway at "/"
 * - Managers can be redirected to /suite after login
 * - Never mount the dashboard UI here
 */
function PublicHome() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Preview: keep gateway accessible (do not force redirect)
  if (isPreview()) return <LoginForm />;

  if (isLoading) return <AminevaLoader />;

  if (isAuthenticated) {
    const isAdmin = user?.role === "super_admin" || user?.role === "manager";
    if (isAdmin) return <Navigate to="/suite" replace />;
  }

  return <LoginForm />;
}

/**
 * Dashboard guard for "/suite/*"
 * - Preview bypass so Appwrite/CORS doesn't lock you out
 * - Production requires authenticated manager/super_admin
 */
function SuiteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Preview bypass (keeps Suite usable even if Appwrite is unreachable)
  if (isPreview()) return <SuitePage />;

  if (isLoading) return <AminevaLoader />;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const isAdmin = user?.role === "super_admin" || user?.role === "manager";
  if (!isAdmin) return <Navigate to="/" replace />;

  return <SuitePage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public gateway / homepage */}
      <Route path="/" element={<PublicHome />} />

      {/* Invite bridge */}
      <Route
        path="/invite/:product"
        element={
          <Suspense fallback={<AminevaLoader />}>
            <InviteBridge />
          </Suspense>
        }
      />

      {/* 2FA verify */}
      <Route
        path="/auth/verify-2fa"
        element={
          <Suspense fallback={<AminevaLoader />}>
            <Verify2FA />
          </Suspense>
        }
      />

      {/* ✅ SUITE DASHBOARD (CANONICAL) */}
      <Route path="/suite/*" element={<SuiteGuard />} />

      /**
       * ✅ Legacy compatibility:
       * If anything still points to /admin, send it into Suite.
       * (This avoids 404s without making /admin the dashboard.)
       */
      <Route path="/admin" element={<Navigate to="/suite" replace />} />
      <Route path="/admin/*" element={<Navigate to="/suite" replace />} />

      /**
       * ✅ Legacy deep link:
       * /coms should go to suite comms
       */
      <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />

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
