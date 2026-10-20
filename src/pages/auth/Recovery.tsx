import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/appwrite/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import amvLogo from "@/assets/amv_logo.png";

const PRODUCT_INFO: Record<string, {
  name: string;
  tagline: string;
  gradient: string;
  accentClass: string;
  textMuted: string;
}> = {
  suite: {
    name: "Amineva Global Suite",
    tagline: "The central gateway to Amineva Ecosystem",
    gradient: "from-slate-900 via-slate-950 to-slate-900",
    accentClass: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring",
    textMuted: "text-slate-400",
  },
  aminevaops: {
    name: "AminevaOps",
    tagline: "Enterprise Operations Management Platform",
    gradient: "from-teal-950 via-slate-950 to-teal-950",
    accentClass: "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500",
    textMuted: "text-teal-400/80",
  },
  agstock: {
    name: "AGStock",
    tagline: "Smart Inventory & Point of Sale Suite",
    gradient: "from-amber-950 via-slate-950 to-amber-950",
    accentClass: "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500",
    textMuted: "text-amber-400/80",
  },
  agis: {
    name: "DataLens",
    tagline: "IT & Data Services Platform",
    gradient: "from-blue-950 via-slate-950 to-blue-950",
    accentClass: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    textMuted: "text-blue-400/80",
  },
  datalens: {
    name: "DataLens",
    tagline: "IT & Data Services Platform",
    gradient: "from-blue-950 via-slate-950 to-blue-950",
    accentClass: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    textMuted: "text-blue-400/80",
  },
  amniva: {
    name: "Amniva",
    tagline: "High-Performance Team & Project Tracker",
    gradient: "from-violet-950 via-slate-950 to-violet-950",
    accentClass: "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500",
    textMuted: "text-violet-400/80",
  },
  agroclimate: {
    name: "AgroClimate",
    tagline: "Agro-Meteorology & Climate Advisory Suite",
    gradient: "from-emerald-950 via-slate-950 to-emerald-950",
    accentClass: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
    textMuted: "text-emerald-400/80",
  },
};

export default function Recovery() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const productKey = params.get("product") || "suite";
  const product = PRODUCT_INFO[productKey] || PRODUCT_INFO.suite;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const redirectTarget = `/auth/reset-password${productKey ? `?product=${productKey}` : ''}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(redirectTarget)}`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send recovery email. Please try again.");
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
            <Mail className={`h-6 w-6 text-white`} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Reset Password</CardTitle>
          <CardDescription className="text-slate-400 mt-1 max-w-xs mx-auto text-sm">
            {sent
              ? `Verification link has been dispatched`
              : product.tagline}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {sent ? (
            <div className="space-y-6 text-center py-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                An email containing password recovery details has been sent to <strong>{email}</strong> if it is registered in our database.
              </p>
              <Button 
                className={`w-full h-11 font-medium transition-all ${product.accentClass}`}
                onClick={() => navigate("/", { replace: true })}
              >
                Back to Sign In
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
                <Label htmlFor="recovery-email" className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Email Address</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  autoComplete="email"
                  className="h-11 bg-slate-950/40 border-white/5 text-white placeholder-slate-500 focus-visible:ring-white/20 focus-visible:border-white/10"
                  autoFocus
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
                    Sending Recovery Link...
                  </span>
                ) : (
                  "Send Recovery Email"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full h-10 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                onClick={() => navigate("/", { replace: true })}
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
