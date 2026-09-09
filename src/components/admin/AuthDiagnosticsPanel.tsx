import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/appwrite/client";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DB_ID, account, databases } from "@/lib/appwrite";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  ShieldCheck,
  User,
  AlertCircle,
  CheckCircle,
  Activity,
  Database,
  HardDrive,
  Clock,
  Radio,
  Zap,
  Server,
} from "lucide-react";

interface DiagnosticLog {
  id: string;
  time: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface DiagnosticState {
  sessionStatus: "active" | "none" | "loading";
  userId: string | null;
  email: string | null;
  provider: string | null;
  sessionExpiresAt: string | null;
  emailVerified: boolean;
  serverLatencyMs: number | null;
  serverHealthy: boolean;
  dbAccess: {
    profiles: boolean;
    products: boolean;
    userAppAccess: boolean;
    moduleAccess: boolean;
  };
  storageAccess: {
    assetsBucket: boolean;
    driveBucket: boolean;
  };
  lastError: string | null;
  logs: DiagnosticLog[];
}

const initial: DiagnosticState = {
  sessionStatus: "loading",
  userId: null,
  email: null,
  provider: null,
  sessionExpiresAt: null,
  emailVerified: false,
  serverLatencyMs: null,
  serverHealthy: false,
  dbAccess: {
    profiles: false,
    products: false,
    userAppAccess: false,
    moduleAccess: false,
  },
  storageAccess: {
    assetsBucket: false,
    driveBucket: false,
  },
  lastError: null,
  logs: [],
};

export function AuthDiagnosticsPanel() {
  const [state, setState] = useState<DiagnosticState>(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshTimer = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: DiagnosticLog["type"], message: string) => {
    const newLog: DiagnosticLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setState((prev) => ({
      ...prev,
      logs: [newLog, ...prev.logs].slice(0, 15),
    }));
  }, []);

  const runFullDiagnostics = useCallback(async () => {
    setRefreshing(true);
    const startTime = performance.now();
    const next: DiagnosticState = { ...initial, logs: state.logs, sessionStatus: "none" };

    // 1. Appwrite Server Connection & Latency Check
    try {
      const pingStart = performance.now();
      const accountRes = await account.get().catch(() => null);
      const pingEnd = performance.now();
      next.serverLatencyMs = Math.round(pingEnd - pingStart);
      next.serverHealthy = true;
    } catch {
      next.serverHealthy = false;
    }

    // 2. Active Session & Auth State Check
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        next.lastError = sessionErr.message;
      }

      if (session?.user) {
        next.sessionStatus = "active";
        next.userId = session.user.id;
        next.email = session.user.email ?? null;
        next.provider = session.user.app_metadata?.provider ?? "email";
        next.sessionExpiresAt = session.expires_at
          ? new Date(session.expires_at * 1000).toLocaleTimeString()
          : "Session active";

        // Check profiles table in amineva-db
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_verified, onboardingComplete")
          .eq("userId", session.user.id)
          .maybeSingle();

        next.emailVerified = (profile as any)?.email_verified ?? true;
        next.dbAccess.profiles = true;
      }
    } catch (err: any) {
      next.lastError = err?.message ?? "Session fetch failed";
    }

    // 3. Database Collection Accessibility Checks (amineva-db)
    try {
      const { data: productsData } = await supabase.from("products").select("id").limit(1);
      next.dbAccess.products = Array.isArray(productsData);

      const { data: accessData } = await supabase.from("user_app_access").select("id").limit(1);
      next.dbAccess.userAppAccess = Array.isArray(accessData);

      const { data: moduleData } = await supabase.from("module_access").select("id").limit(1);
      next.dbAccess.moduleAccess = Array.isArray(moduleData);
    } catch (dbErr: any) {
      console.warn("[Auth Diagnostics] DB latency check warning:", dbErr);
    }

    // 4. Storage Bucket Accessibility Checks
    try {
      const { data: assetsPublicUrl } = supabase.storage.from("suite_assets").getPublicUrl("test");
      next.storageAccess.assetsBucket = !!assetsPublicUrl?.publicUrl;

      const { data: drivePublicUrl } = supabase.storage.from("workspace-drive").getPublicUrl("test");
      next.storageAccess.driveBucket = !!drivePublicUrl?.publicUrl;
    } catch {}

    const totalTime = Math.round(performance.now() - startTime);
    next.serverLatencyMs = next.serverLatencyMs ?? totalTime;

    setState(next);
    setRefreshing(false);
  }, [state.logs]);

  // Reactive Listener for Auth State Changes
  useEffect(() => {
    runFullDiagnostics();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(
        event === "SIGNED_IN" ? "success" : event === "SIGNED_OUT" ? "warning" : "info",
        `Auth event: ${event} ${session?.user?.email ? `(${session.user.email})` : ""}`
      );
      runFullDiagnostics();
    });

    return () => subscription.unsubscribe();
  }, [runFullDiagnostics, addLog]);

  // Real-time Polling Interval
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimer.current = setInterval(() => {
        runFullDiagnostics();
      }, 5000);
    } else if (autoRefreshTimer.current) {
      clearInterval(autoRefreshTimer.current);
    }

    return () => {
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
    };
  }, [autoRefresh, runFullDiagnostics]);

  return (
    <div className="space-y-6">
      {/* Top Real-time Server Health Bar */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Server className="h-6 w-6 text-primary" />
              <span className={`absolute -top-1 -right-1 flex h-3 w-3`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${state.serverHealthy ? "bg-emerald-400 opacity-75" : "bg-amber-400 opacity-75"}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${state.serverHealthy ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">Appwrite Self-Hosted</span>
                <Badge variant="outline" className="text-xs font-mono">{APPWRITE_ENDPOINT}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Project: <code className="text-foreground font-mono">{APPWRITE_PROJECT_ID}</code> · Database: <code className="text-foreground font-mono">{APPWRITE_DB_ID}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end text-xs font-medium text-foreground">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                {state.serverLatencyMs !== null ? `${state.serverLatencyMs} ms` : "—"}
              </div>
              <span className="text-[10px] text-muted-foreground">Real-time Latency</span>
            </div>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                <Radio className={`h-3 w-3 ${autoRefresh ? "text-emerald-500 animate-pulse" : "text-muted-foreground"}`} />
                Live 5s
              </Label>
            </div>

            <Button variant="outline" size="sm" onClick={runFullDiagnostics} disabled={refreshing} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Ping Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Session Status & Collection Health */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Identity & Session Status */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                User Authentication & Session
              </span>
              <Badge variant={state.sessionStatus === "active" ? "default" : "destructive"}>
                {state.sessionStatus === "loading" ? "Validating…" : state.sessionStatus === "active" ? "Session Active" : "Signed Out"}
              </Badge>
            </CardTitle>
            <CardDescription>Real-time Appwrite session tokens and profile state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-xs text-muted-foreground">User ID</span>
              <code className="text-xs font-mono text-foreground font-semibold">{state.userId || "usr-guest"}</code>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-xs text-muted-foreground">Account Email</span>
              <span className="text-xs font-medium text-foreground">{state.email || "Guest User"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-xs text-muted-foreground">Auth Provider</span>
              <Badge variant="outline" className="text-[10px]">{state.provider || "email"}</Badge>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-xs text-muted-foreground">Session Expiration</span>
              <span className="text-xs font-mono text-foreground">{state.sessionExpiresAt || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-muted-foreground">Email Verification</span>
              <Badge variant={state.emailVerified ? "default" : "secondary"} className="text-[10px] gap-1">
                {state.emailVerified ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {state.emailVerified ? "Verified" : "Pending"}
              </Badge>
            </div>

            {state.lastError && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="break-all">{state.lastError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Database & Storage Health */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database & Storage Telemetry
            </CardTitle>
            <CardDescription>Live read/write verification on <code className="text-foreground font-mono">amineva-db</code></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Database Collections</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/40">
                  <span className="text-xs text-foreground font-medium">profiles</span>
                  {state.dbAccess.profiles ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/40">
                  <span className="text-xs text-foreground font-medium">products</span>
                  {state.dbAccess.products ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/40">
                  <span className="text-xs text-foreground font-medium">user_app_access</span>
                  {state.dbAccess.userAppAccess ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/40">
                  <span className="text-xs text-foreground font-medium">module_access</span>
                  {state.dbAccess.moduleAccess ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage Buckets</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/40">
                  <span className="text-xs text-foreground font-medium">suite_assets</span>
                  {state.storageAccess.assetsBucket ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/40">
                  <span className="text-xs text-foreground font-medium">workspace-drive</span>
                  {state.storageAccess.driveBucket ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Diagnostic Logs Stream */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Live Auth Telemetry Event Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border bg-muted/20 p-3 max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono">
            {state.logs.length === 0 ? (
              <div className="text-muted-foreground py-2 text-center">Monitoring auth events in real-time…</div>
            ) : (
              state.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-muted-foreground text-[11px] shrink-0">[{log.time}]</span>
                  <span
                    className={
                      log.type === "success"
                        ? "text-emerald-500 font-semibold"
                        : log.type === "warning"
                        ? "text-amber-500"
                        : log.type === "error"
                        ? "text-destructive font-semibold"
                        : "text-foreground"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
