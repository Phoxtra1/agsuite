/**
 * WorkspaceGate — real account access online, explicitly enrolled local unlock
 * offline. Local unlock never creates an AuthContext user or cloud credential.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/appwrite/client";
import { loadAppProfile, type AppProfile } from "@/lib/auth/appProfile";
import { setWorkspaceUser } from "@/lib/workspace/scope";
import {
  enrollOfflineWorkspace,
  disableOfflineWorkspace,
  getOfflineAccessProfile,
  hasOfflineAccess,
  setWorkspaceOfflineMode,
  selectOfflineAccessProfile,
  unlockOfflineWorkspace,
} from "@/lib/workspace/localAccess";

interface WorkspaceSession {
  userId: string;
  email: string;
  appId: string | null;
  profile: AppProfile | null;
  offline: boolean;
}

const Ctx = createContext<WorkspaceSession | null>(null);

export function useWorkspaceSession(): WorkspaceSession {
  return useContext(Ctx) ?? { userId: "", email: "", appId: null, profile: null, offline: false };
}

function OfflineUnlockScreen({
  email,
  onUnlock,
}: {
  email: string;
  onUnlock: (passphrase: string) => Promise<void>;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try { await onUnlock(passphrase); }
    catch (err: any) { setError(err?.message || "Unable to unlock this device."); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Amineva Workspace</p>
          <h1 className="mt-2 text-2xl font-semibold">Unlock this device</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cloud sign-in is unavailable. Use the device passphrase you created while signed in to open this account's locally saved Workspace.
          </p>
          {email && <p className="mt-2 text-xs text-muted-foreground">Account: {email}</p>}
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Device passphrase</span>
          <input
            autoComplete="current-password"
            type="password"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button disabled={busy || !passphrase} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {busy ? "Unlocking…" : "Unlock Workspace offline"}
        </button>
        <p className="text-xs text-muted-foreground">
          Offline mode uses this browser's local files only. Cloud sync and account changes remain unavailable until you sign in again.
        </p>
        <a href="/" className="block text-center text-sm text-muted-foreground underline">Return to sign in</a>
      </form>
    </div>
  );
}

function OfflineEnrollmentPrompt({
  userId,
  email,
  onComplete,
}: {
  userId: string;
  email: string;
  onComplete: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [passphrase, setPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!visible) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (passphrase !== confirmation) {
      setError("The passphrases do not match.");
      return;
    }
    setBusy(true);
    try {
      await enrollOfflineWorkspace(userId, email, passphrase);
      onComplete();
      setVisible(false);
    } catch (err: any) {
      setError(err?.message || "Could not enable offline access.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mb-4 max-w-5xl rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Enable offline access on this device</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a separate device passphrase now so you can reopen locally saved Workspace files during a future connection outage.
          </p>
        </div>
        <button type="button" onClick={() => setVisible(false)} className="text-xs text-muted-foreground underline">Not now</button>
      </div>
      <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          type="password"
          autoComplete="new-password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="Device passphrase (12+ characters)"
          minLength={12}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Confirm device passphrase"
          minLength={12}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        />
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button disabled={busy || passphrase.length < 12 || !confirmation} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {busy ? "Enabling…" : "Enable offline access"}
          </button>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">The passphrase stays on this device. This is a local app lock, not full disk encryption.</p>
        </div>
      </form>
    </div>
  );
}

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [resolving, setResolving] = useState(true);
  const [offlineProfile, setOfflineProfile] = useState<{ userId: string; email: string } | null>(null);
  const [offlineProfileLoaded, setOfflineProfileLoaded] = useState(false);
  const [offlineSession, setOfflineSession] = useState(false);
  const [enableAvailable, setEnableAvailable] = useState(false);
  const [offlineAccessEnabled, setOfflineAccessEnabled] = useState(false);

  const effectiveUserId = user?.id || null;

  useEffect(() => {
    let active = true;
    getOfflineAccessProfile()
      .then((profile) => { if (active) setOfflineProfile(profile); })
      .catch(() => { if (active) setOfflineProfile(null); })
      .finally(() => { if (active) setOfflineProfileLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (isLoading) return;
      if (!effectiveUserId) {
        setResolving(false);
        return;
      }

      setWorkspaceOfflineMode(false);
      setOfflineSession(false);
      setWorkspaceUser(effectiveUserId);
      setResolving(true);

      let appId: string | null = null;
      let profile: AppProfile | null = null;
      try {
        const { data, error } = await (supabase.rpc as any)(
          "ensure_self_app_access",
          { _app_slug: "workspace" }
        );
        if (!error) appId = (data as string) ?? null;
        if (appId) profile = await loadAppProfile(effectiveUserId, appId);
      } catch {
        // Local editing remains available; cloud provisioning may retry later.
      }

      const enrolled = await hasOfflineAccess(effectiveUserId).catch(() => false);
      if (enrolled) selectOfflineAccessProfile(effectiveUserId);
      if (cancelled) return;
      setOfflineAccessEnabled(enrolled);
      if (enrolled) setOfflineProfile({ userId: effectiveUserId, email: user?.email ?? "" });
      setEnableAvailable(!enrolled);
      setSession({
        userId: effectiveUserId,
        email: user?.email ?? "",
        appId,
        profile,
        offline: false,
      });
      setResolving(false);
    }

    resolve();
    return () => { cancelled = true; };
  }, [isLoading, effectiveUserId, user?.email]);

  const handleOfflineUnlock = async (passphrase: string) => {
    const unlocked = await unlockOfflineWorkspace(passphrase);
    setWorkspaceUser(unlocked.userId);
    setWorkspaceOfflineMode(true);
    setOfflineSession(true);
    setEnableAvailable(false);
    setSession({
      userId: unlocked.userId,
      email: unlocked.email,
      appId: null,
      profile: null,
      offline: true,
    });
  };

  const handleDisableOfflineAccess = async () => {
    if (!effectiveUserId || !window.confirm("Disable offline unlocking for this account on this device? Your locally saved Workspace files will remain on this device.")) return;
    try {
      await disableOfflineWorkspace(effectiveUserId);
      setOfflineAccessEnabled(false);
      setEnableAvailable(true);
      setOfflineProfile(null);
    } catch (error: any) {
      console.error("[workspace-offline] Could not disable local access", error);
    }
  };

  if (isLoading || (effectiveUserId && resolving && !session) || (!effectiveUserId && !isAuthenticated && !offlineProfileLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Opening your workspace…</div>
      </div>
    );
  }

  if (!isAuthenticated && !effectiveUserId && !offlineSession) {
    if (offlineProfile) {
      return <OfflineUnlockScreen email={offlineProfile.email} onUnlock={handleOfflineUnlock} />;
    }
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?authRedirect=${next}`} replace />;
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?authRedirect=${next}`} replace />;
  }

  return (
    <Ctx.Provider value={session}>
      {session.offline && (
        <div role="status" className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-foreground">
          Offline Workspace: local files only. Cloud reads, cloud writes and account changes are paused until you sign in again.
        </div>
      )}
      {isAuthenticated && enableAvailable && (
        <OfflineEnrollmentPrompt
          userId={session.userId}
          email={session.email}
          onComplete={() => {
            setEnableAvailable(false);
            setOfflineAccessEnabled(true);
            setOfflineProfile({ userId: session.userId, email: session.email });
          }}
        />
      )}
      {isAuthenticated && offlineAccessEnabled && (
        <div className="mx-auto mb-3 flex max-w-5xl justify-end px-4">
          <button
            type="button"
            onClick={handleDisableOfflineAccess}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Disable offline access on this device
          </button>
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}
