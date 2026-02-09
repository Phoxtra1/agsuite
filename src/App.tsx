import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthGate } from "@/components/auth/AuthGate";
import SuitePage from "./pages/Suite";
import NotFound from "./pages/NotFound";

// Lazy load routes
const InviteBridge = lazy(() => import("./pages/InviteBridge"));
const Verify2FA = lazy(() => import("./pages/auth/Verify2FA"));

const queryClient = new QueryClient();

// Check if we're in Lovable preview environment
const isLovablePreview = () => {
  const host = window.location.hostname;
  return (
    host.includes("lovable.app") ||
    host.includes("lovableproject.com") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1")
  );
};

// Stylish Amineva loading spinner
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

function HashNormalizer() {
  useEffect(() => {
    // Some OAuth flows may return with a trailing "#"; normalize to keep routing stable.
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

// Protected route wrapper for Suite Dashboard (managers only)
// In preview mode, allow access for development testing
function ProtectedSuiteRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const preview = isLovablePreview();

  // In Lovable preview, always allow access for development testing
  if (preview) return <>{children}</>;

  if (isLoading) return <AminevaLoader />;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  // Suite dashboard is ONLY for managers/super_admins
  const isManager = user?.role === "super_admin" || user?.role === "manager";
  if (!isManager) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// Public route - shows gateway for unauthenticated users
// Managers go to suite, others stay on gateway
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const preview = isLovablePreview();

  // In Lovable preview, don't force redirect - allow staying on gateway
  if (preview) return <>{children}</>;

  if (isLoading) return <AminevaLoader />;

  if (isAuthenticated) {
    const isManager = user?.role === "super_admin" || user?.role === "manager";
    if (isManager) return <Navigate to="/suite" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public gateway / login page */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />

      {/* Invite Bridge Routes - /invite/agstock?token=XXX or /invite/agis?token=XXX */}
      <Route
        path="/invite/:product"
        element={
          <Suspense fallback={<AminevaLoader />}>
            <InviteBridge />
          </Suspense>
        }
      />

      {/* Step-up 2FA verification route */}
      <Route
        path="/auth/verify-2fa"
        element={
          <Suspense fallback={<AminevaLoader />}>
            <Verify2FA />
          </Suspense>
        }
      />

      /**
       * ✅ Compatibility route:
       * If someone visits /coms directly, send them to the Suite module route.
       * (You can change /suite/coms to your real Comms path inside Suite.)
       */
      <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />
      <Route path="/admin" element={<Navigate to="/suite/console" replace />} />
      <Route path="/admin/*" element={<Navigate to="/suite/console" replace />} />


      /**
       * ✅ Suite entry guard:
       * Some Suite implementations render nested routes and may 404 at /suite if no index route exists.
       * Redirect /suite to your preferred default page inside Suite.
       * Change "/suite" target if your Suite default is different (e.g. "/suite/dashboard").
       */
      <Route path="/suite" element={<Navigate to="/suite/dashboard" replace />} />
      <Route path="/coms" element={<Navigate to="/suite/coms" replace />} />

      {/* Protected Suite routes (managers/super_admins only) */}
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

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          {/* ✅ KEY FIX: basename makes routes stable in preview/deploy subpaths */}
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <HashNormalizer />
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
