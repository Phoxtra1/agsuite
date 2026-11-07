import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass, Settings, Sun, Moon, Search, ShieldCheck, Globe2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import amvLogo from "@/assets/amv_global_logo.png";

type RegionState = { countryId: string; countryLabel: string };

function readRegionFromStorage(): RegionState | null {
  try {
    const raw = localStorage.getItem("agstock_region");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const countryId = String(parsed?.countryId || "").trim();
    const countryLabel = String(parsed?.countryLabel || "").trim();
    if (!countryId || !countryLabel) return null;
    return { countryId, countryLabel };
  } catch {
    return null;
  }
}

function getTimeZone(countryId: string): string {
  const id = (countryId || "").toLowerCase();
  switch (id) {
    case "ashanti": return "Africa/Accra";
    case "nigeria": return "Africa/Lagos";
    case "kenya": return "Africa/Nairobi";
    case "south-africa": return "Africa/Johannesburg";
    case "cfa-zone": return "Africa/Abidjan";
    case "finland": return "Europe/Helsinki";
    case "united-kingdom": return "Europe/London";
    default: return "Etc/UTC";
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const storedRegion = useMemo(() => readRegionFromStorage(), [agCountry, agStepConfirmed]);
  const displayCountryId = useMemo(() => agCountry || storedRegion?.countryId || "ghana", [agCountry, storedRegion]);
  const displayCountryLabel = useMemo(() => {
    if (agCountry) return "";
    return storedRegion?.countryLabel || "Ashanti";
  }, [agCountry, storedRegion]);
  const displayTimeZone = useMemo(() => getTimeZone(displayCountryId), [displayCountryId]);

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

  const selectedAgOption = useMemo(() => countryCurrencyOptions.find((o) => o.id === agCountry) || null, [agCountry, countryCurrencyOptions]);
  const effectiveCountryLabel = useMemo(() => selectedAgOption?.label || displayCountryLabel || "Ghana", [selectedAgOption, displayCountryLabel]);

  const workspaceProduct: ProductData = products.find((product) => product.id.toLowerCase().includes("workspace") || product.name.toLowerCase().includes("workspace")) || { id: "workspace", name: "Amineva Workspace", status: "live", order: 0 };
  const WorkspaceIcon = getProductIconSafe(workspaceProduct?.id || "workspace");

  // A direct /workspace visit returns here for authentication; restore the
  // Workspace sign-in card instead of leaving the user at product selection.
  useEffect(() => {
    const requestedPath = new URLSearchParams(window.location.search).get("authRedirect");
    if (!requestedPath || !decodeURIComponent(requestedPath).startsWith("/workspace") || !workspaceProduct) return;
    if (isAuthenticated) {
      navigate("/workspace", { replace: true });
      return;
    }
    setSelectedProduct(workspaceProduct);
    setAuthTab("signin");
  }, [workspaceProduct, isAuthenticated, navigate]);

  const canShowAuthCard = useMemo(() => {
    const s = `${selectedProduct?.id || ""} ${selectedProduct?.name || ""} ${selectedProduct?.url || ""}`.toLowerCase();
    if (s.includes("sikas") || s.includes("aminevaops") || s.includes("ops.amineva.com")) return false;
    if (isAgStock) return agStepConfirmed;
    return true;
  }, [isAgStock, agStepConfirmed, selectedProduct]);


  const onPickProduct = (p: ProductData) => {
    if (p.status === "coming_soon" || p.status === "offline") return;

    // Sikasɛm no longer authenticates through Suite — it opens its own homepage.
    // Category listing + live/offline status stay managed here in the Suite.
    const pid = (p.id || "").toLowerCase();
    const pname = (p.name || "").toLowerCase();
    const purl = (p.url || "").toLowerCase();
    const isSikasem =
      pid.includes("aminevaops") ||
      pid.includes("sikas") ||
      pname.includes("sikas") ||
      purl.includes("ops.amineva.com");
    if (isSikasem) {
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
            <div className="font-semibold tracking-wide leading-none" style={{ color: "hsl(38,92%,50%)", fontSize: "22px" }}>{displayTime}, {effectiveCountryLabel}</div>
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

        <div className="absolute bottom-12 left-8 right-8 translate-y-4 flex flex-wrap gap-6 text-white/80 z-10">
          <div><div className="text-lg font-medium text-white">Connected subjects</div><div className="text-xs text-white/70">Structured areas and topics</div></div>
          <div><div className="text-lg font-medium text-white">Original sources</div><div className="text-xs text-white/70">Evidence-led investigation</div></div>
        </div>
      </div>

      {/* RIGHT PANEL — public entry to the Information Discovery System */}
      <div className="relative flex items-start justify-center p-6 lg:p-10 bg-background text-foreground">
        <div className="w-full max-w-xl">
          <div className="w-full flex flex-wrap items-center justify-end gap-4 text-sm font-semibold text-muted-foreground">
            <button type="button" className="text-foreground transition hover:text-primary" onClick={() => navigate("/info-discovery")}>Information Discovery</button>
            <button type="button" className="transition hover:text-foreground" onClick={() => navigate("/about-us")}>About Us</button>
            <button type="button" className="transition hover:text-foreground" onClick={() => navigate("/faqs")}>FAQs</button>
            <button type="button" className="transition hover:text-foreground" onClick={() => navigate("/support")}>Support</button>
            <div className="relative" ref={settingsRef}>
              <button type="button" className="inline-flex items-center gap-1 transition hover:text-foreground" onClick={() => setSettingsOpen(!settingsOpen)}>
                <Settings className="h-4 w-4" /> Settings
              </button>
              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
                  >
                    <div className="space-y-2 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
                      <button
                        type="button"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition hover:bg-accent/10"
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
              onClick={() => navigate(isAuthenticated ? "/info-discovery" : "/get-started?mode=register")}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {isAuthenticated ? "Open Portal" : "Get Started"}
            </button>
          </div>

          <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Compass className="h-4 w-4" /> Information Discovery System
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
              Discover information. Understand the evidence. Make informed next steps.
            </h1>
            <p className="mt-5 text-sm leading-7 text-muted-foreground md:text-base">
              Amineva Global is an Information Discovery System. It organises knowledge into connected subject areas, guided investigation topics, key questions, evidence standards and original sources. It helps people and organisations move from a broad question to a clearer understanding of what is known, where information comes from, what remains uncertain, and what should be examined next.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              Instead of treating information as disconnected pages or asking people to accept an unsupported answer, the system provides a structured route through context, evidence and authoritative source material. Practical tools and services are introduced only where they genuinely support the next step.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/info-discovery")}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Explore Information Discovery <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate(isAuthenticated ? "/info-discovery" : "/get-started?mode=register")}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                {isAuthenticated ? "Enter your portal" : "Get Started"}
              </button>
            </div>
          </section>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/70 p-4">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold text-foreground">Structured discovery</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Move from a subject area to focused questions worth investigating.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold text-foreground">Evidence and provenance</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Understand who published information, its context and its limitations.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-4">
              <Globe2 className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold text-foreground">Useful next steps</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Follow relevant original sources and practical pathways.</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-8 right-8 flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Amineva Global. All Rights Reserved.</span>
          <div className="flex gap-4">
            <button type="button" className="transition hover:text-foreground" onClick={() => navigate("/terms")}>Terms of Service</button>
            <button type="button" className="transition hover:text-foreground" onClick={() => navigate("/privacy")}>Privacy Policy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
}
