import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { account } from "@/lib/appwrite";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import amvLogo from "@/assets/amv_logo.png";
import { getDashboardForRole } from "@/lib/auth/roleGuard";

const PRODUCT_INFO: Record<string, {
  name: string;
  tagline: string;
  gradient: string;
  accentClass: string;
  textMuted: string;
  description: string;
}> = {
  suite: {
    name: "Amineva Global Suite",
    tagline: "The central gateway to Amineva Ecosystem",
    gradient: "from-slate-900 via-slate-950 to-slate-900",
    accentClass: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring",
    textMuted: "text-slate-400",
    description: "Welcome to Amineva Global Suite. Your global administrative dashboard and access permissions have been successfully initialized.",
  },
  aminevaops: {
    name: "AminevaOps",
    tagline: "Enterprise Operations Management Platform",
    gradient: "from-teal-950 via-slate-950 to-teal-950",
    accentClass: "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500",
    textMuted: "text-teal-400/80",
    description: "Welcome to AminevaOps! Your central client and enterprise operations dashboard has been provisioned and is ready for use.",
  },
  agstock: {
    name: "AGStock",
    tagline: "Smart Inventory & Point of Sale Suite",
    gradient: "from-amber-950 via-slate-950 to-amber-950",
    accentClass: "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500",
    textMuted: "text-amber-400/80",
    description: "Welcome to AGStock! Your smart inventory, shop management, and point-of-sale system is fully configured and ready.",
  },
  agis: {
    name: "AGIS",
    tagline: "Integrated Field & Client Analytics Dashboard",
    gradient: "from-blue-950 via-slate-950 to-blue-950",
    accentClass: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    textMuted: "text-blue-400/80",
    description: "Welcome to AGIS! Your field visit maps, client history records, and analytic dashboards are now fully operational.",
  },
  amniva: {
    name: "Amniva",
    tagline: "High-Performance Team & Project Tracker",
    gradient: "from-violet-950 via-slate-950 to-violet-950",
    accentClass: "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500",
    textMuted: "text-violet-400/80",
    description: "Welcome to Amniva! Your interactive project schedules, collaborative task sheets, and timelines have been activated.",
  },
  agroclimate: {
    name: "AgroClimate",
    tagline: "Agro-Meteorology & Climate Advisory Suite",
    gradient: "from-emerald-950 via-slate-950 to-emerald-950",
    accentClass: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
    textMuted: "text-emerald-400/80",
    description: "Welcome to AgroClimate! Your climate monitoring, agro-meteorological indices, and regional advisory tools are ready.",
  },
};

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  
  const productKey = params.get("product") || "suite";
  const product = PRODUCT_INFO[productKey] || PRODUCT_INFO.suite;

  const [loading, setLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    account.get().then((user) => {
      setIsConfirmed(user.emailVerification);
      setUserRole((user.prefs?.role as string) || "user");
      setLoading(false);
    }).catch(() => {
      setIsConfirmed(false);
      setLoading(false);
    });
  }, []);

  const handleLaunch = () => {
    const dashboardUrl = getDashboardForRole(productKey, userRole);
    if (dashboardUrl.startsWith("http")) {
      window.location.assign(dashboardUrl);
    } else {
      navigate(dashboardUrl, { replace: true });
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
          {loading ? (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 border border-white/5 shadow-inner">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
            </div>
          ) : isConfirmed ? (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 animate-bounce" />
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 shadow-inner">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          )}
          
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {loading ? "Verifying Account..." : isConfirmed ? "Email Verified!" : "Verification Pending"}
          </CardTitle>
          <CardDescription className="text-slate-400 mt-1 max-w-xs mx-auto text-sm">
            {loading ? "Please wait while we confirm your session status." : isConfirmed ? "Your account is fully activated." : "Please complete your activation link check."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <span className="text-xs text-slate-500">Checking credentials...</span>
            </div>
          ) : isConfirmed ? (
            <div className="space-y-6 text-center py-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                {product.description}
              </p>
              <Button 
                className={`w-full h-11 font-semibold tracking-wide shadow-lg transition-all ${product.accentClass}`}
                onClick={handleLaunch}
              >
                Launch {productKey === "suite" ? "Amineva Global Suite" : product.name}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 text-center py-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                We couldn't confirm your verification status. Please check your email inbox and click the activation link we sent.
              </p>
              <Button 
                className={`w-full h-11 font-medium transition-all ${product.accentClass}`}
                onClick={() => navigate("/", { replace: true })}
              >
                Return to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
