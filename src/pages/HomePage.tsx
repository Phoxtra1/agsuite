import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import NotFound from "./pages/NotFound";

// ✅ NEW: Homepage must be its own page component (create ./pages/HomePage.tsx)
const HomePage = lazy(() => import("./pages/HomePage"));

// Existing
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
 * ✅ Dashboard Guard for "/suite/*"
 * - Never render homepage here
 * - Preview bypass keeps you unblocked if Appwrite/CORS fails in preview
 */
function SuiteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isPreview()) return <Suite />;

  if (isLoading) return <AminevaLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  const isManager = user?.role === "super_admin" || user?.role === "manager";
  if (!isManager) return <Navigate to="/" replace />;

  return <Suite />;
}

/**
 * ✅ Homepage route "/"
 * - This is the public/front view with product categories + login/register flows
 * - It should NOT contain dashboard tabs (coms/console/profile)
 */
function PublicHome() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <AminevaLoader />;

  // If manager already authenticated, go straight to dashboard
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
    <Routes>
      {/* ✅ Public Homepage */}
      <Route path="/" element={<PublicHome />} />

      {/* Invite bridge: /invite/agstock?token=XXX */}
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

      {/* ✅ Dashboard container */}
      <Route path="/suite/*" element={<SuiteGuard />} />

      {/* Optional compatibility redirects */}
      <Route path="/admin/*" element={<Navigate to="/suite" replace />} />
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
