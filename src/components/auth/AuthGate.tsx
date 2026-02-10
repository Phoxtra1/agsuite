import React, { useEffect, useState } from "react";
import { getSession, formatAuthError } from "@/lib/auth/appwriteAuth";

type AuthStatus = "loading" | "authed" | "guest";

type AltGateProps = {
  children: React.ReactNode;
  guest: React.ReactNode;
  loading?: React.ReactNode;

  /**
   * OPTIONAL: change this value after login/2FA success to force a re-check.
   * Example usage: refreshKey={Date.now()} or refreshKey={authVersion}
   */
  refreshKey?: string | number;

  /**
   * OPTIONAL: temporary safety net if you can’t wire refreshKey yet.
   * Example: pollMs={1500}. Leave undefined to disable.
   */
  pollMs?: number;
};

export function AltGate({ children, guest, loading, refreshKey, pollMs }: AltGateProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  async function checkSession(activeRef: { active: boolean }) {
    setAuthStatus("loading");
    setError(null);

    try {
      const session = await getSession();
      if (!activeRef.active) return;
      setAuthStatus(session ? "authed" : "guest");
    } catch (e) {
      if (!activeRef.active) return;
      setError(formatAuthError(e));
      setAuthStatus("guest");
    }
  }

  // Re-check on mount + whenever refreshKey changes
  useEffect(() => {
    const activeRef = { active: true };
    checkSession(activeRef);

    return () => {
      activeRef.active = false;
    };
  }, [refreshKey]);

  // Optional polling (temporary)
  useEffect(() => {
    if (!pollMs || pollMs <= 0) return;

    const activeRef = { active: true };
    const id = window.setInterval(() => checkSession(activeRef), pollMs);

    return () => {
      activeRef.active = false;
      window.clearInterval(id);
    };
  }, [pollMs]);

  if (authStatus === "loading") {
    return (
      <>
        {loading ?? (
          <div className="py-8 text-center text-sm text-muted-foreground">Checking session…</div>
        )}
      </>
    );
  }

  if (authStatus === "authed") return <>{children}</>;

  return (
    <>
      {error ? (
        <div className="mb-4 rounded-md border border-border bg-card p-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}
      {guest}
    </>
  );
}
