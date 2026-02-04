import React, { useEffect, useState } from "react";
import { getSession, formatAuthError } from "@/lib/auth/appwriteAuth";

type AuthStatus = "loading" | "authed" | "guest";

export function AuthGate({
  children,
  guest,
  loading,
}: {
  children: React.ReactNode;
  guest: React.ReactNode;
  loading?: React.ReactNode;
}) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  // On mount: check session exactly once
  useEffect(() => {
    let active = true;

    (async () => {
      setAuthStatus("loading");
      setError(null);
      try {
        const session = await getSession();
        if (!active) return;
        if (session) {
          setAuthStatus("authed");
        } else {
          setAuthStatus("guest");
        }
      } catch (e) {
        if (!active) return;
        setError(formatAuthError(e));
        // If session check errors, treat as guest but show error inline.
        setAuthStatus("guest");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Hard rule: do not redirect during loading; we also avoid redirects entirely here.
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
