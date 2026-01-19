import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoginForm } from "@/components/auth/LoginForm";
import SuitePage from "./pages/Suite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Check if we're in Lovable preview environment
const isLovablePreview = () => {
  return window.location.hostname.includes('lovable.app') || 
         window.location.hostname.includes('localhost') ||
         window.location.hostname.includes('127.0.0.1');
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
        <p className="text-sm text-muted-foreground animate-pulse">Loading Amineva Suite...</p>
      </div>
    </div>
  );
}

function HashNormalizer() {
  useEffect(() => {
    // Some OAuth flows may return with a trailing "#"; normalize to keep routing stable.
    if (window.location.hash === "#" || window.location.hash === "#/") {
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
  }, []);
  return null;
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // In Lovable preview, allow access for development
  if (isLovablePreview()) {
    return <>{children}</>;
  }
  
  if (isLoading) {
    return <AminevaLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Public route - redirects to suite if authenticated (only on production)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // In Lovable preview, don't force redirect
  if (isLovablePreview()) {
    return <>{children}</>;
  }
  
  if (isLoading) {
    return <AminevaLoader />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/suite" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <PublicRoute>
          <LoginForm />
        </PublicRoute>
      } />
      <Route path="/suite/*" element={
        <ProtectedRoute>
          <SuitePage />
        </ProtectedRoute>
      } />
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
          <BrowserRouter>
            <HashNormalizer />
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
