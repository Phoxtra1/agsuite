import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { is2FAVerifiedThisSession } from "@/lib/stepUpAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck, ShieldOff, User, AlertCircle, CheckCircle } from "lucide-react";

interface DiagnosticState {
  sessionStatus: "active" | "none" | "loading";
  userId: string | null;
  email: string | null;
  provider: string | null;
  sessionExpiresAt: string | null;
  mfaFactors: Array<{ id: string; type: string; status: string; friendlyName?: string }>;
  mfaAAL: string | null;
  mfaNextLevel: string | null;
  twoFASessionVerified: boolean;
  lastError: string | null;
}

const initial: DiagnosticState = {
  sessionStatus: "loading",
  userId: null,
  email: null,
  provider: null,
  sessionExpiresAt: null,
  mfaFactors: [],
  mfaAAL: null,
  mfaNextLevel: null,
  twoFASessionVerified: false,
  lastError: null,
};

export function AuthDiagnosticsPanel() {
  const [state, setState] = useState<DiagnosticState>(initial);
  const [refreshing, setRefreshing] = useState(false);

  const loadDiagnostics = async () => {
    setRefreshing(true);
    const next: DiagnosticState = { ...initial, sessionStatus: "none" };

    try {
      // Session
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) next.lastError = sessionErr.message;

      if (session) {
        next.sessionStatus = "active";
        next.userId = session.user.id;
        next.email = session.user.email ?? null;
        next.provider = session.user.app_metadata?.provider ?? null;
        next.sessionExpiresAt = session.expires_at
          ? new Date(session.expires_at * 1000).toLocaleString()
          : null;
      }

      // MFA factors
      const { data: factorData, error: factorErr } = await supabase.auth.mfa.listFactors();
      if (factorErr) {
        next.lastError = (next.lastError ? next.lastError + " | " : "") + factorErr.message;
      } else {
        next.mfaFactors = (factorData?.totp ?? []).map((f) => ({
          id: f.id,
          type: "totp",
          status: f.status,
          friendlyName: f.friendly_name ?? undefined,
        }));
      }

      // MFA AAL
      const { data: aalData, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalErr) {
        next.lastError = (next.lastError ? next.lastError + " | " : "") + aalErr.message;
      } else {
        next.mfaAAL = aalData?.currentLevel ?? null;
        next.mfaNextLevel = aalData?.nextLevel ?? null;
      }

      // Session-level 2FA
      next.twoFASessionVerified = is2FAVerifiedThisSession();
    } catch (err: any) {
      next.lastError = err?.message ?? "Unknown error";
    }

    setState(next);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Auth Diagnostics
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={loadDiagnostics} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Session */}
        <Row label="Session">
          <Badge variant={state.sessionStatus === "active" ? "default" : "destructive"}>
            {state.sessionStatus === "loading" ? "Loading…" : state.sessionStatus === "active" ? "Active" : "No Session"}
          </Badge>
        </Row>
        {state.userId && <Row label="User ID"><code className="text-xs font-mono">{state.userId.slice(0, 8)}…</code></Row>}
        {state.email && <Row label="Email">{state.email}</Row>}
        {state.provider && <Row label="Provider"><Badge variant="outline">{state.provider}</Badge></Row>}
        {state.sessionExpiresAt && <Row label="Expires">{state.sessionExpiresAt}</Row>}

        {/* MFA */}
        <div className="pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Two-Factor Authentication
        </div>
        <Row label="Enrolled Factors">{state.mfaFactors.length}</Row>
        {state.mfaFactors.map((f) => (
          <Row key={f.id} label={`Factor: ${f.id.slice(0, 8)}…`}>
            <Badge variant={f.status === "verified" ? "default" : "secondary"}>{f.status}</Badge>
          </Row>
        ))}
        <Row label="Current AAL">
          <Badge variant="outline">{state.mfaAAL ?? "—"}</Badge>
        </Row>
        <Row label="Next AAL">
          <Badge variant="outline">{state.mfaNextLevel ?? "—"}</Badge>
        </Row>
        <Row label="Session 2FA Verified">
          {state.twoFASessionVerified ? (
            <CheckCircle className="h-4 w-4 text-primary" />
          ) : (
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Row>

        {/* Last Error */}
        {state.lastError && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="break-all">{state.lastError}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
