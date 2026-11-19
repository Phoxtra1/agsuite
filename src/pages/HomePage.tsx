import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProductData } from "@/types/product";
import { useCategoryProducts } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { Clock, XCircle, ArrowRight, ArrowUpRight, ChevronRight, Compass, Settings, Sun, Moon, LayoutDashboard, GraduationCap, Sprout, Wallet, Package, BrainCircuit, BriefcaseBusiness, Clock3, FileText, Sheet, Presentation, ClipboardList } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVisitorLocation } from "@/hooks/useVisitorLocation";
import amvLogo from "@/assets/amv_global_logo.png";
import AuthCard from "@/components/home/AuthCard";

import { getProductIcon } from "@/lib/products";
import { PUBLIC_AUTH_PAUSED, publicEntryPath } from "@/lib/auth/availability";

type CountryCurrencyOption = {
  id: string;
  label: string;
  currencyCode: string;
};

function getProductIconSafe(productId: string) {
  return getProductIcon(productId);
}

type DashboardSolution = {
  id: string;
  name: string;
  description: string;
  category: string;
  href?: string;
  external?: boolean;
  comingSoon?: boolean;
  icon: React.ElementType;
};

const dashboardSolutions: DashboardSolution[] = [
  { id: "info-solutions", name: "Info Solutions", description: "Discover, assess and verify information, with research and useful outcomes.", category: "Information", href: "https://info.amineva.com", external: true, icon: Compass },
  { id: "career-education", name: "Career & Education", description: "Explore career development, educational pathways and learning opportunities.", category: "People", href: "/explore/career-education", icon: GraduationCap },
  { id: "agroclimate", name: "AgroClimate", description: "Agricultural intelligence, climate insights and farm-focused tools.", category: "Agriculture", href: "https://agro.amineva.com", external: true, icon: Sprout },
  { id: "sikasem", name: "SikaSem", description: "Financial operations for mobile money and financial service providers.", category: "Finance", href: "https://ops.amineva.com", external: true, icon: Wallet },
  { id: "inventra", name: "Inventra", description: "Inventory, stock movement and sales management.", category: "Business", href: "https://stock.amineva.com", external: true, icon: Package },
  { id: "dipa", name: "Dipa", description: "Applied AI capabilities for specialised workflows and services.", category: "Intelligence", href: "https://ode.amineva.com", external: true, icon: BrainCircuit },
  { id: "datalens", name: "DataLens", description: "IT support and web application services.", category: "Business", comingSoon: true, icon: BriefcaseBusiness },
];

const RECENT_SOLUTIONS_KEY = "amineva_recent_solutions_v1";

function readRecentSolutions(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SOLUTIONS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function getStatusBadge(status: ProductData["status"]) {
  switch (status) {
    case "live":
      return <Badge className="bg-success/20 text-success text-xs">Live</Badge>;
    case "coming_soon":
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <Clock className="w-3 h-3" />
          Coming Soon
        </Badge>
      );
    case "offline":
      return (
        <Badge variant="destructive" className="text-xs gap-1">
          <XCircle className="w-3 h-3" />
          Offline
        </Badge>
      );
    default:
      return null;
  }
}


export default function HomePage() {
  const navigate = useNavigate();
  const { products } = useCategoryProducts();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [recentSolutionIds, setRecentSolutionIds] = useState<string[]>(readRecentSolutions);
  const [authTab, setAuthTab] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [agCountry, setAgCountry] = useState<string>("");
  const [agCurrencyCode, setAgCurrencyCode] = useState<string>("USD");
  const [agStepConfirmed, setAgStepConfirmed] = useState<boolean>(false);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { locationLabel: visitorLocationLabel, timeZone: visitorTimeZone } = useVisitorLocation();
  const displayTimeZone = visitorTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";

  const displayTime = useMemo(() => new Intl.DateTimeFormat("en-GB", { timeZone: displayTimeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(now), [now, displayTimeZone]);
  const displayDate = useMemo(() => new Intl.DateTimeFormat("en-GB", { timeZone: displayTimeZone, day: "2-digit", month: "long", year: "numeric" }).format(now), [now, displayTimeZone]);

  const isAgStock = useMemo(() => {
    const id = selectedProduct?.id?.toLowerCase() || "";
    return id === "ag-stock" || id === "agstock" || id.includes("ag-stock") || id.includes("agstock");
  }, [selectedProduct]);

  const countryCurrencyOptions: CountryCurrencyOption[] = useMemo(() => [
    { id: "ghana", label: "Ghana", currencyCode: "GHS" },
    { id: "nigeria", label: "Nigeria", currencyCode: "NGN" },
    { id: "kenya", label: "Kenya", currencyCode: "KES" },
    { id: "south-africa", label: "South Africa", currencyCode: "ZAR" },
    { id: "cfa-zone", label: "CFA Zone", currencyCode: "CFA" },
    { id: "finland", label: "Finland", currencyCode: "EUR" },
    { id: "united-kingdom", label: "United Kingdom", currencyCode: "GBP" },
    { id: "other", label: "Other Countries", currencyCode: "USD" },
  ], []);

  const workspaceProduct: ProductData = products.find((product) => product.id.toLowerCase().includes("workspace") || product.name.toLowerCase().includes("workspace")) || { id: "workspace", name: "Amineva Workspace", status: "live", order: 0 };
  const WorkspaceIcon = getProductIconSafe(workspaceProduct?.id || "workspace");

  // A direct /workspace visit returns here for authentication; restore the
  // Workspace sign-in card instead of leaving the user at product selection.
  useEffect(() => {
    const requestedPath = new URLSearchParams(window.location.search).get("authRedirect");
    if (PUBLIC_AUTH_PAUSED) {
      if (requestedPath) navigate(publicEntryPath(requestedPath), { replace: true });
      return;
    }
    if (!requestedPath || !decodeURIComponent(requestedPath).startsWith("/workspace") || !workspaceProduct) return;
    if (isAuthenticated) {
      navigate("/workspace", { replace: true });
      return;
    }
    setSelectedProduct(workspaceProduct);
    setAuthTab("signin");
  }, [workspaceProduct, isAuthenticated, navigate]);

  const canShowAuthCard = useMemo(() => {
    if (PUBLIC_AUTH_PAUSED) return false;
    const s = `${selectedProduct?.id || ""} ${selectedProduct?.name || ""} ${selectedProduct?.url || ""}`.toLowerCase();
    if (s.includes("sikas") || s.includes("aminevaops") || s.includes("ops.amineva.com")) return false;
    if (isAgStock) return agStepConfirmed;
    return true;
  }, [isAgStock, agStepConfirmed, selectedProduct]);


  const recordRecentSolution = (solutionId: string) => {
    setRecentSolutionIds((current) => {
      const next = [solutionId, ...current.filter((id) => id !== solutionId)].slice(0, 4);
      try { localStorage.setItem(RECENT_SOLUTIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const onPickProduct = (p: ProductData) => {
    if (p.status === "coming_soon" || p.status === "offline") return;

    // Sikasɛm no longer authenticates through Suite — it opens its own homepage.
    // Category listing + live/offline status stay managed here in the Suite.
    const pid = (p.id || "").toLowerCase();
    const pname = (p.name || "").toLowerCase();
    const purl = (p.url || "").toLowerCase();
    if (PUBLIC_AUTH_PAUSED) {
      if (pid.includes("workspace") || pname.includes("workspace")) navigate("/workspace");
      else if (p.url) window.location.assign(p.url);
      return;
    }
    const isSikasɛm =
      pid.includes("aminevaops") ||
      pid.includes("sikas") ||
      pname.includes("sikas") ||
      purl.includes("ops.amineva.com");
    if (isSikasɛm) {
      window.location.href = p.url || "https://ops.amineva.com";
      return;
    }

    // Workspace: if unauthenticated, show AuthCard so user can sign in or register.
    // If authenticated, navigate straight to /workspace.
    if (pid.includes("workspace") || pname.includes("workspace")) {
      if (isAuthenticated) {
        navigate("/workspace");
      } else {
        setSelectedProduct(p);
        setAuthTab("signin");
        setEmail("");
        setPassword("");
        setAgCountry("");
        setAgCurrencyCode("USD");
        setAgStepConfirmed(false);
      }
      return;
    }

    setSelectedProduct(p);
    setAuthTab("signin");
    setEmail("");
    setPassword("");
    setAgCountry("");
    setAgCurrencyCode("USD");
    setAgStepConfirmed(false);
  };

  // Workspace sends signed-out visitors here with ?authRedirect=/workspace…
  // Open the Workspace sign-in card instead of silently showing the homepage.
  useEffect(() => {
    if (PUBLIC_AUTH_PAUSED) return;
    const target = new URLSearchParams(window.location.search).get("authRedirect") || "";
    if (!target.startsWith("/workspace")) return;
    if (isAuthenticated) { navigate(target, { replace: true }); return; }
    onPickProduct(workspaceProduct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const onChangeSelection = () => {
    setSelectedProduct(null);
    setAuthTab("signin");
    setAgCountry("");
    setAgCurrencyCode("USD");
    setAgStepConfirmed(false);
  };

  const handleAgCountryChange = (value: string) => {
    setAgCountry(value);
    setAgStepConfirmed(false);
    const opt = countryCurrencyOptions.find((o) => o.id === value);
    const currencyCode = opt?.currencyCode || "USD";
    setAgCurrencyCode(currencyCode);
    try {
      localStorage.setItem("agstock_region", JSON.stringify({ countryId: opt?.id || "other", countryLabel: opt?.label || "Other Countries", currencyCode, updatedAt: new Date().toISOString() }));
    } catch {}
  };

  // Settings dropdown items
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    }
    if (settingsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 relative">
      {/* LEFT PANEL */}
      <div
        className="relative overflow-hidden min-h-[50vh] lg:min-h-screen"
        style={{
          background: "radial-gradient(circle at 20% 30%, hsla(38,92%,50%,0.10) 0%, transparent 55%), linear-gradient(135deg, hsl(222,47%,11%) 0%, hsl(222,40%,18%) 100%)",
        }}
      >
        <style>{`
          @keyframes amvTwinkle { 0%, 100% { opacity: 0.25; transform: scale(0.95); } 50% { opacity: 0.85; transform: scale(1.08); } }
          @keyframes amvFadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes amvShimmer { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; } }
        `}</style>

        {[
          { top: "8%", left: "5%" }, { top: "12%", left: "35%" }, { top: "8%", left: "60%" },
          { top: "15%", left: "85%" }, { top: "42%", left: "3%" }, { top: "38%", left: "90%" },
          { top: "68%", left: "5%" }, { top: "72%", left: "38%" }, { top: "65%", left: "82%" },
          { top: "88%", left: "3%" }, { top: "85%", left: "90%" },
        ].map((pos, i) => (
          <div key={i} className="absolute w-1.5 h-1.5 rounded-full" style={{ top: pos.top, left: pos.left, backgroundColor: "hsl(38, 92%, 50%)", opacity: 0.6, animation: "amvTwinkle 3.2s ease-in-out infinite", animationDelay: `${i * 0.25}s` }} />
        ))}

        <div className="p-8 flex items-start gap-4 relative z-10">
          <img src={amvLogo} alt="Amineva Global" className="h-14 w-14 rounded-full" />
          <div style={{ animation: "amvFadeUp 700ms ease-out, amvShimmer 3.6s ease-in-out infinite" }}>
            <div className="font-semibold tracking-wide leading-none" style={{ color: "hsl(38,92%,50%)", fontSize: "22px" }}>{displayTime}, {visitorLocationLabel}</div>
            <div className="font-medium tracking-wide text-xs mt-1" style={{ color: "hsla(38,92%,50%,0.85)" }}>{displayDate}</div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[420px] h-[420px] animate-[spin_60s_linear_infinite]">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-6 rounded-full border border-white/15" />
            <div className="absolute inset-12 rounded-full border border-white/10" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div key={deg} className="absolute w-2 h-2 rounded-full" style={{ top: `${50 - 48 * Math.cos((deg * Math.PI) / 180)}%`, left: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`, transform: "translate(-50%, -50%)", backgroundColor: "hsl(38, 92%, 50%)", opacity: 0.6 }} />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsla(38,92%,50%,0.2)" }}>
                <span className="text-2xl" style={{ color: "hsl(38,92%,50%)" }}>⚡</span>
              </div>
            </div>
          </div>

          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1"><span style={{ color: "hsl(38,92%,50%)" }}>📊</span> Analytics</div>
            <div className="space-y-1">
              <div className="h-1.5 rounded w-full" style={{ backgroundColor: "hsla(38,92%,50%,0.7)" }} />
              <div className="h-1.5 rounded w-3/4" style={{ backgroundColor: "hsla(38,92%,50%,0.5)" }} />
              <div className="h-1.5 rounded w-1/2" style={{ backgroundColor: "hsla(38,92%,50%,0.4)" }} />
            </div>
          </div>

          <div className="absolute top-1/2 left-[3%] -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-36">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1"><span style={{ color: "hsl(38,92%,50%)" }}>🔗</span> Network</div>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsla(38,92%,50%,0.3)" }} />))}
            </div>
          </div>

          <div className="absolute top-1/2 right-[3%] -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1"><span style={{ color: "hsl(38,92%,50%)" }}>📋</span> Data Flow</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success" /><div className="flex-1 h-1 rounded" style={{ backgroundColor: "hsla(38,92%,50%,0.3)" }} /><div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsla(38,92%,50%,0.5)" }} /></div>
            <div className="flex items-center gap-1 mt-1"><div className="w-2 h-2 rounded-full bg-success" /><div className="flex-1 h-1 rounded" style={{ backgroundColor: "hsla(38,92%,50%,0.4)" }} /></div>
          </div>

          <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1"><span style={{ color: "hsl(38,92%,50%)" }}>⚙️</span> Monitoring</div>
            <div className="flex items-end gap-0.5 h-6">
              {[60, 80, 40, 90, 50, 70, 85].map((h, i) => (<div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: "hsla(142,76%,36%,0.6)" }} />))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-8 translate-y-10 flex gap-16 text-white/80 z-10">
          <div><div className="text-2xl font-medium text-white">99.9%</div><div className="text-sm text-white/70">Uptime SLA</div></div>
          <div><div className="text-2xl font-medium text-white">256-bit</div><div className="text-sm text-white/70">Encryption</div></div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="relative flex items-start justify-center p-6 lg:p-10 bg-background text-foreground">
        <div className="w-full max-w-xl">
          {/* Primary navigation and appearance settings. Workspace is accessed from its dedicated panel below. */}
          <div className="w-full flex justify-end gap-6 text-base font-semibold text-muted-foreground flex-wrap items-center">
            <button type="button" className="hover:text-foreground transition cursor-pointer text-accent font-bold" onClick={() => navigate("/explore")}>Solutions</button>
            <button type="button" className="hover:text-foreground transition cursor-pointer" onClick={() => navigate("/about-us")}>About Us</button>
            <button type="button" className="hover:text-foreground transition cursor-pointer" onClick={() => navigate("/support")}>Support</button>
            <button type="button" className="hover:text-foreground transition cursor-pointer" onClick={() => navigate("/faqs")}>FAQs</button>

            {/* Settings with theme toggle */}
            <div className="relative" ref={settingsRef}>
              <button type="button" className="hover:text-foreground transition cursor-pointer flex items-center gap-1" onClick={() => setSettingsOpen(!settingsOpen)}>
                <Settings className="h-4 w-4" /> Settings
              </button>
              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</p>
                      <button
                        type="button"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 rounded-lg transition"
                      >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? "/workspace" : "/get-started?mode=register")}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {isAuthenticated ? "Open Portal" : "Get Started"}
            </button>
          </div>

          {selectedProduct ? (
            <>
              {isAgStock && !canShowAuthCard && (
                <div className="border border-border rounded-xl bg-card p-5 mt-8">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2" onClick={onChangeSelection}>
                      <span aria-hidden>←</span> Change product
                    </button>
                    <div />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsla(38,92%,50%,0.12)" }}>
                      <span className="text-2xl" style={{ color: "hsl(38,92%,50%)" }}>📍</span>
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold text-foreground">Where is your business located?</h2>
                    <p className="mt-2 text-muted-foreground">This helps us set up your currency and regional settings</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    <label className="block text-sm font-semibold text-foreground">Select your Country</label>
                    <select value={agCountry} onChange={(e) => handleAgCountryChange(e.target.value)} className="w-full h-12 rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="" disabled>Choose a country</option>
                      {countryCurrencyOptions.map((opt) => (<option key={opt.id} value={opt.id}>{opt.label}</option>))}
                    </select>
                    {agCountry && (
                      <div className="text-sm text-muted-foreground">Currency: <span className="text-foreground font-semibold">{selectedAgOption?.currencyCode || agCurrencyCode}</span></div>
                    )}
                    <div className="pt-3">
                      <button type="button" disabled={!agCountry} onClick={() => setAgStepConfirmed(true)} className={`w-full h-12 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${agCountry ? "text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}`} style={agCountry ? { backgroundColor: "hsl(38,92%,35%)" } : undefined}>
                        Continue <span aria-hidden>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {canShowAuthCard && (
                <div className="mt-8">
                  <AuthCard product={selectedProduct} authTab={authTab} setAuthTab={setAuthTab} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onChangeSelection={onChangeSelection} />
                </div>
              )}
            </>
          ) : (
            <>
              <section className="mt-7 space-y-5" aria-label="Amineva application dashboard">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      <LayoutDashboard className="h-3.5 w-3.5" /> Application dashboard
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Your Amineva environment</h2>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">One place to access your solutions and productivity workspace.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ecosystem gateway
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4 shadow-sm sm:p-5">
                  <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/[0.10] blur-3xl" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        <LayoutDashboard className="h-4 w-4" /> Amineva Workspace
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">Your productivity space</h3>
                      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">Create and manage documents, spreadsheets, presentations and forms in one connected workspace.</p>
                    </div>
                    <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08] text-primary sm:flex">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="relative mt-4 flex flex-wrap items-center gap-2">
                    {[
                      { label: "Docs", icon: FileText },
                      { label: "Sheets", icon: Sheet },
                      { label: "Slides", icon: Presentation },
                      { label: "Forms", icon: ClipboardList },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      return <span key={item.label} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground"><ItemIcon className="h-3.5 w-3.5" />{item.label}</span>;
                    })}
                    <button type="button" onClick={() => onPickProduct(workspaceProduct)} className="ml-auto inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
                      {isAuthenticated ? "Open Workspace" : "Access Workspace"} <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!isAuthenticated && <p className="relative mt-2 text-[10px] text-muted-foreground">Workspace registration or sign-in is required. Other solutions keep their own access arrangements.</p>}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Solutions</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Open the independent services you need.</p>
                    </div>
                    <button type="button" onClick={() => navigate("/explore")} className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline">All solutions <ChevronRight className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    {dashboardSolutions.map((solution) => {
                      const SolutionIcon = solution.icon;
                      const card = (
                        <div className={`group relative flex h-full min-h-[116px] flex-col rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all duration-200 ${solution.comingSoon ? "opacity-65" : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary"><SolutionIcon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
                            {solution.comingSoon ? <span className="rounded-full border border-border bg-muted px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">Coming soon</span> : <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />}
                          </div>
                          <h4 className="mt-2.5 text-xs font-semibold text-foreground">{solution.name}</h4>
                          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{solution.description}</p>
                          <span className="mt-auto pt-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-primary/75">{solution.category}</span>
                        </div>
                      );
                      if (solution.comingSoon || !solution.href) return <div key={solution.id} aria-label={`${solution.name}, coming soon`}>{card}</div>;
                      if (solution.external) return <a key={solution.id} href={solution.href} target="_blank" rel="noopener noreferrer" onClick={() => recordRecentSolution(solution.id)} aria-label={`Open ${solution.name} in a new tab`}>{card}</a>;
                      return <button key={solution.id} type="button" onClick={() => { recordRecentSolution(solution.id); navigate(solution.href!); }} className="text-left">{card}</button>;
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-card/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-xs font-semibold text-foreground">Recently opened</h3>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">This device</span>
                  </div>
                  {recentSolutionIds.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recentSolutionIds.map((id) => {
                        const solution = dashboardSolutions.find((item) => item.id === id);
                        if (!solution || solution.comingSoon || !solution.href) return null;
                        return solution.external ? (
                          <a key={id} href={solution.href} target="_blank" rel="noopener noreferrer" onClick={() => recordRecentSolution(id)} className="rounded-lg border border-border bg-background px-3 py-2 text-[10px] font-medium text-foreground transition hover:border-primary/40">{solution.name} <ArrowUpRight className="ml-1 inline h-3 w-3" /></a>
                        ) : (
                          <button key={id} type="button" onClick={() => { recordRecentSolution(id); navigate(solution.href!); }} className="rounded-lg border border-border bg-background px-3 py-2 text-[10px] font-medium text-foreground transition hover:border-primary/40">{solution.name} <ChevronRight className="ml-1 inline h-3 w-3" /></button>
                        );
                      })}
                    </div>
                  ) : <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Solutions you open from this device will appear here for quick access.</p>}
                </div>
              </section>

            </>
          )}
        </div>

        <div className="absolute bottom-4 left-8 right-8 flex justify-between items-center text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Amineva <span onClick={(e) => { if (e.detail === 3) navigate("/seal"); }} className="cursor-default select-none">Global</span>. All Rights Reserved.</span>
          <div className="flex gap-6">
            <button type="button" className="hover:text-foreground transition cursor-pointer" onClick={() => navigate("/terms")}>Terms of Service</button>
            <button type="button" className="hover:text-foreground transition cursor-pointer" onClick={() => navigate("/privacy")}>Privacy Policy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
