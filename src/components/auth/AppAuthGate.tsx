/**
 * AppAuthGate — central middleware for ALL protected app routes.
 *
 * Flow:
 *   1. Wait for authentication.
 *   2. Resolve the current app (slug).
 *   3. Verify per-app authorization via user_app_access.
 *   4. Load the per-(user, app) profile. No fallbacks. No first-record loads.
 *   5. If unauthorized → /access-denied.
 *
 * Exposes appAccess + appProfile via useAppSession() to children.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentAppSlug } from "@/core/auth/appContext";
import { loadAppAccess, type AppAccess } from "@/lib/auth/appAccess";
import { loadAppProfile, type AppProfile } from "@/lib/auth/appProfile";

interface AppSession {
  appSlug: string;
  access: AppAccess | null;
  profile: AppProfile | null;
  loading: boolean;
}

const AppSessionContext = createContext<AppSession | null>(null);

export function useAppSession() {
  const ctx = useContext(AppSessionContext);
  if (!ctx) throw new Error("useAppSession must be used within AppAuthGate");
  return ctx;
}

export function AppAuthGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const appSlug = getCurrentAppSlug();

  const [access, setAccess] = useState<AppAccess | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Strictly key by user.id + appSlug — guarantees no cross-account leakage.
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // Always reset before loading so a previous account's data never leaks through.
      setAccess(null);
      setProfile(null);

      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const a = await loadAppAccess(user.id, appSlug);
      if (cancelled) return;

      if (!a.allowed) {
        setAccess(a);
        setLoading(false);
        return;
      }

      setAccess(a);
      const p = await loadAppProfile(user.id, a.appId!);
      if (cancelled) return;
      setProfile(p);
      setLoading(false);
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [user?.id, appSlug]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Verifying access…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?authRedirect=${next}`} replace />;
  }

  if (!access?.allowed) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <AppSessionContext.Provider value={{ appSlug, access, profile, loading }}>
      {children}
    </AppSessionContext.Provider>
  );
}
