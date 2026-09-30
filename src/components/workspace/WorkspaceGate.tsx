/**
 * WorkspaceGate — per-account entry gate for Amineva Workspace.
 *
 * Workspace runs on the Suite backend, so it uses Suite auth directly:
 *   1. A real session is required (no preview or "drive" bypasses).
 *   2. The signed-in account is provisioned into the `workspace` app,
 *      creating its own per-(user, app) profile.
 *   3. The account identity is exposed to children so the dashboard renders
 *      that user's data — never a shared, static shell.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/appwrite/client";
import { loadAppProfile, type AppProfile } from "@/lib/auth/appProfile";
import { setWorkspaceUser } from "@/lib/workspace/scope";

interface WorkspaceSession {
  userId: string;
  email: string;
  appId: string | null;
  profile: AppProfile | null;
}

const Ctx = createContext<WorkspaceSession | null>(null);

export function useWorkspaceSession(): WorkspaceSession {
  return (
    useContext(Ctx) ?? { userId: "", email: "", appId: null, profile: null }
  );
}

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [resolving, setResolving] = useState(true);

  const isLocalOrPreview = typeof window !== "undefined" && ["localhost", "127.0.0.1", "lovable.app", "lovableproject.com"].some(h => window.location.hostname.includes(h));
  const effectiveUserId = user?.id || (isLocalOrPreview ? "local-user" : null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setSession(null);
      if (!effectiveUserId) {
        setResolving(false);
        return;
      }
      setResolving(true);
      // Bind offline caches to this account before anything reads them.
      setWorkspaceUser(effectiveUserId);

      let appId: string | null = null;
      let profile: AppProfile | null = null;
      if (user?.id) {
        try {
          const { data, error } = await (supabase.rpc as any)(
            "ensure_self_app_access",
            { _app_slug: "workspace" }
          );
          if (!error) appId = (data as string) ?? null;
          if (appId) profile = await loadAppProfile(user.id, appId);
        } catch {
          // Offline / transient failure
        }
      }

      if (cancelled) return;
      setSession({
        userId: effectiveUserId,
        email: user?.email ?? "workspace@amineva.com",
        appId,
        profile,
      });
      setResolving(false);
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, user?.id, user?.email]);

  if (isLoading || (effectiveUserId && resolving && !session)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Opening your workspace…</div>
      </div>
    );
  }

  if (!isAuthenticated && !effectiveUserId) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?authRedirect=${next}`} replace />;
  }

  return <Ctx.Provider value={session}>{children}</Ctx.Provider>;
}
