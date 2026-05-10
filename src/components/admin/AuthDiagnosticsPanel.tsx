import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSession } from "@/components/auth/AppAuthGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck, User, AlertCircle, CheckCircle } from "lucide-react";

interface DiagnosticState {
  sessionStatus: "active" | "none" | "loading";
  userId: string | null;
  email: string | null;
  provider: string | null;
  sessionExpiresAt: string | null;
  emailVerified: boolean;
  lastError: string | null;
}

const initial: DiagnosticState = {
  sessionStatus: "loading",
  userId: null,
  email: null,
  provider: null,
  sessionExpiresAt: null,
  emailVerified: false,
  lastError: null,
};

export function AuthDiagnosticsPanel() {
  const { access } = useAppSession();
  const [state, setState] = useState<DiagnosticState>(initial);
  const [refreshing, setRefreshing] = useState(false);

  const loadDiagnostics = async () => {
    setRefreshing(true);
    const next: DiagnosticState = { ...initial, sessionStatus: "none" };

    try {
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

        // Check email verification from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_verified")
          .eq("user_id", session.user.id)
          .eq("app_id", access?.appId ?? "")
          .maybeSingle();
        next.emailVerified = profile?.email_verified ?? false;
      }
    } catch (err: any) {
      next.lastError = err?.message ?? "Unknown error";
    }

    setState(next);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDiagnostics();
  }, [access?.appId]);

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
        <Row label="Session">
          <Badge variant={state.sessionStatus === "active" ? "default" : "destructive"}>
            {state.sessionStatus === "loading" ? "Loading…" : state.sessionStatus === "active" ? "Active" : "No Session"}
          </Badge>
        </Row>
        {state.userId && <Row label="User ID"><code className="text-xs font-mono">{state.userId.slice(0, 8)}…</code></Row>}
        {state.email && <Row label="Email">{state.email}</Row>}
        {state.provider && <Row label="Provider"><Badge variant="outline">{state.provider}</Badge></Row>}
        {state.sessionExpiresAt && <Row label="Expires">{state.sessionExpiresAt}</Row>}

        <div className="pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Email Verification
        </div>
        <Row label="Email Verified">
          <Badge variant={state.emailVerified ? "default" : "secondary"}>
            {state.emailVerified ? "Verified" : "Not Verified"}
          </Badge>
        </Row>

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
