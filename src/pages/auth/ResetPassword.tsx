import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, isSupabaseConfigured, assertSupabaseConfigured } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import amvLogo from "@/assets/amv_logo.png";

const PRODUCT_INFO: Record<string, {
  name: string;
  gradient: string;
  accentClass: string;
  textMuted: string;
}> = {
  suite: {
    name: "Amineva Global Suite",
    gradient: "from-slate-900 via-slate-950 to-slate-900",
    accentClass: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring",
    textMuted: "text-slate-400",
  },
  aminevaops: {
    name: "AminevaOps",
    gradient: "from-teal-950 via-slate-950 to-teal-950",
    accentClass: "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500",
    textMuted: "text-teal-400/80",
  },
  agstock: {
    name: "AGStock",
    gradient: "from-amber-950 via-slate-950 to-amber-950",
    accentClass: "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500",
    textMuted: "text-amber-400/80",
  },
  agis: {
    name: "DataLens",
    gradient: "from-blue-950 via-slate-950 to-blue-950",
    accentClass: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    textMuted: "text-blue-400/80",
  },
  datalens: {
    name: "DataLens",
    gradient: "from-blue-950 via-slate-950 to-blue-950",
    accentClass: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    textMuted: "text-blue-400/80",
  },
  amniva: {
    name: "Amniva",
    gradient: "from-violet-950 via-slate-950 to-violet-950",
    accentClass: "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500",
    textMuted: "text-violet-400/80",
  },
  agroclimate: {
    name: "AgroClimate",
    gradient: "from-emerald-950 via-slate-950 to-emerald-950",
    accentClass: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
    textMuted: "text-emerald-400/80",
  },
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const productKey = params.get("product") || "suite";
  const product = PRODUCT_INFO[productKey] || PRODUCT_INFO.suite;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Check if the callback set the session correctly
    if (!isSupabaseConfigured) {
      setHasSession(false);
      setCheckingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setHasSession(!error && !!session);
      setCheckingSession(false);
    }).catch(() => {
      setHasSession(false);
      setCheckingSession(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasSession) {
      setError("No active recovery session found. Please request a new link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      assertSupabaseConfigured();
      const { error: resetError } = await supabase.auth.updateUser({
        password: password,
      });
      if (resetError) throw resetError;
      setDone(true);
      
      // Auto sign out after setting password so they log in cleanly
      await supabase.auth.signOut();
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${product.gradient} p-4 transition-all duration-500`}>
      <div className="mb-8 flex flex-col items-center gap-2">
        <img src={amvLogo} alt="Amineva" className="h-10 opacity-90 filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.05)]" />
        <span className={`text-xs font-semibold tracking-widest uppercase ${product.textMuted}`}>
          {product.name}
        </span>
      </div>

      <Card className="w-full max-w-md border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/40">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 border border-white/5 shadow-inner">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Set New Password</CardTitle>
          <CardDescription className="text-slate-400 mt-1 max-w-xs mx-auto text-sm">
            {done ? "Your password has been updated." : "Choose a strong new password."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {checkingSession ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
              <span className="text-xs text-slate-500">Verifying session context...</span>
            </div>
          ) : done ? (
            <div className="space-y-6 text-center py-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                Password updated successfully. You can now securely sign in to your dashboard with your new credentials.
              </p>
              <Button 
                className={`w-full h-11 font-medium transition-all ${product.accentClass}`}
                onClick={() => navigate("/", { replace: true })}
              >
                Go to Sign In
              </Button>
            </div>
          ) : !hasSession ? (
            <div className="space-y-6 text-center py-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 mx-auto">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                Invalid or expired recovery session. Please request a new link to update your password.
              </p>
              <Button 
                className={`w-full h-11 font-medium transition-all ${product.accentClass}`}
                onClick={() => navigate(`/auth/recovery?product=${productKey}`, { replace: true })}
              >
                Request Recovery Link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive-foreground animate-in fade-in duration-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                  <span className="leading-normal">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs font-semibold text-slate-300 tracking-wide uppercase">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="h-11 bg-slate-950/40 border-white/5 text-white placeholder-slate-500 focus-visible:ring-white/20 focus-visible:border-white/10"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="h-11 bg-slate-950/40 border-white/5 text-white placeholder-slate-500 focus-visible:ring-white/20 focus-visible:border-white/10"
                />
              </div>

              <Button 
                type="submit" 
                className={`w-full h-11 font-medium shadow-lg transition-all ${product.accentClass}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password...
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
