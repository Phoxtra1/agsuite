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
 * NEVER render the dashboard here.
 */
function PublicHome() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // In preview, show gateway and let you navigate manually
  if (isPreview()) return <LoginForm />;

  if (isLoading) return <AminevaLoader />;

  // If admin is already logged in, send them straight to dashboard
  if (isAuthenticated) {
    const isAdmin = user?.role === "super_admin" || user?.role === "manager";
    if (isAdmin) return <Navigate to="/admin" replace />;
  }

  return <LoginForm />;
}

/**
 * Dashboard guard for "/admin/*"
 * NEVER render homepage here.
 */
function AdminGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Preview bypass so Appwrite/CORS doesn't lock you out
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
      {/* ✅ Public homepage / gateway */}
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

      {/* ✅ Dashboard container */}
      <Route path="/admin/*" element={<AdminGuard />} />

      {/* Compatibility redirects (optional) */}
      <Route path="/suite/*" element={<Navigate to="/admin" replace />} />
      <Route path="/coms" element={<Navigate to="/admin/coms" replace />} />

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
