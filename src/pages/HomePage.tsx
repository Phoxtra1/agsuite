import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_CATEGORIES, ProductData } from "@/types/product";
import { useProducts } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { Clock, XCircle, ArrowRight, ExternalLink, Grid3X3 } from "lucide-react";
import amvLogo from "@/assets/amv_global_logo.png";
import AuthCard from "@/components/home/AuthCard";

type CountryCurrencyOption = {
  id: string;
  label: string;
  currencyCode: string;
};

// ✅ Deployment-safe icon resolver (removes dependency on "@/lib/products")
function getProductIconSafe(productId: string) {
  const id = (productId || "").toLowerCase();
  return Grid3X3;
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

// Map countryId -> IANA timezone (deployment-safe)
function getTimeZone(countryId: string): string {
  const id = (countryId || "").toLowerCase();
  switch (id) {
    case "ghana":
      return "Africa/Accra";
    case "nigeria":
      return "Africa/Lagos";
    case "kenya":
      return "Africa/Nairobi";
    case "south-africa":
      return "Africa/Johannesburg";
    case "cfa-zone":
      // Closest stable representation for many CFA countries (GMT)
      return "Africa/Abidjan";
    case "finland":
      return "Europe/Helsinki";
    case "united-kingdom":
      return "Europe/London";
    default:
      return "Etc/UTC";
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { products } = useProducts();

  const [productsMenuOpen, setProductsMenuOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [authTab, setAuthTab] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // AG Stock: region step
  const [agCountry, setAgCountry] = useState<string>("");
  const [agCurrencyCode, setAgCurrencyCode] = useState<string>("USD");
  const [agStepConfirmed, setAgStepConfirmed] = useState<boolean>(false);

  // Live clock tick
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Read stored region (so homepage can show time even before selection)
  const storedRegion = useMemo(() => readRegionFromStorage(), [agCountry, agStepConfirmed]);

  // Determine region to display: selected country > stored region > default Ghana
  const displayCountryId = useMemo(() => {
    return agCountry || storedRegion?.countryId || "ghana";
  }, [agCountry, storedRegion]);

  const displayCountryLabel = useMemo(() => {
    if (agCountry) {
      // if user is selecting now, derive label from options later (below) via selectedAgOption
      return "";
    }
    return storedRegion?.countryLabel || "Ghana";
  }, [agCountry, storedRegion]);

  const displayTimeZone = useMemo(() => getTimeZone(displayCountryId), [displayCountryId]);

  // Time: HH:MM (24h)
  const displayTime = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: displayTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
  }, [now, displayTimeZone]);

  // Date: 13 February 2026 (updates daily automatically)
  const displayDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: displayTimeZone,
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(now);
  }, [now, displayTimeZone]);

  const isAgStock = useMemo(() => {
    const id = selectedProduct?.id?.toLowerCase() || "";
    return id === "ag-stock" || id === "agstock" || id.includes("ag-stock") || id.includes("agstock");
  }, [selectedProduct]);

  const countryCurrencyOptions: CountryCurrencyOption[] = useMemo(
    () => [
      { id: "ghana", label: "Ghana", currencyCode: "GHS" },
      { id: "nigeria", label: "Nigeria", currencyCode: "NGN" },
      { id: "kenya", label: "Kenya", currencyCode: "KES" },
      { id: "south-africa", label: "South Africa", currencyCode: "ZAR" },
      { id: "cfa-zone", label: "CFA Zone", currencyCode: "CFA" },
      { id: "finland", label: "Finland", currencyCode: "EUR" },
      { id: "united-kingdom", label: "United Kingdom", currencyCode: "GBP" },
      { id: "other", label: "Other Countries", currencyCode: "USD" },
    ],
    []
  );

  const selectedAgOption = useMemo(
    () => countryCurrencyOptions.find((o) => o.id === agCountry) || null,
    [agCountry, countryCurrencyOptions]
  );

  const effectiveCountryLabel = useMemo(() => {
    // if user actively selected a country, show that label; else show stored/default
    return selectedAgOption?.label || displayCountryLabel || "Ghana";
  }, [selectedAgOption, displayCountryLabel]);

  // Build categories from registry + live products list
  const categories = useMemo(() => {
    return DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      products: cat.products
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean) as ProductData[],
    }));
  }, [products]);

  const allCategories = useMemo(() => {
    const categorizedIds = new Set(DEFAULT_CATEGORIES.flatMap((c) => c.products));
    const uncategorized = products.filter((p) => !categorizedIds.has(p.id));
    return uncategorized.length > 0
      ? [...categories, { id: "other", name: "Other Applications", order: 99, products: uncategorized }]
      : categories;
  }, [categories, products]);

  const canShowAuthCard = useMemo(() => {
    if (isAgStock) return agStepConfirmed; // require Continue
    return true;
  }, [isAgStock, agStepConfirmed]);

  const onPickProduct = (p: ProductData) => {
    if (p.status === "coming_soon" || p.status === "offline") return;

    setSelectedProduct(p);
    setAuthTab("signin");
    setEmail("");
    setPassword("");

    // reset AG Stock step
    setAgCountry("");
    setAgCurrencyCode("USD");
    setAgStepConfirmed(false);
  };

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
      localStorage.setItem(
        "agstock_region",
        JSON.stringify({
          countryId: opt?.id || "other",
          countryLabel: opt?.label || "Other Countries",
          currencyCode,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 relative">
      {/* LEFT PANEL */}
      <div
        className="relative overflow-hidden min-h-[50vh] lg:min-h-screen"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, hsla(38,92%,50%,0.10) 0%, transparent 55%), linear-gradient(135deg, hsl(222,47%,11%) 0%, hsl(222,40%,18%) 100%)",
        }}
      >
        <style>
          {`
            @keyframes amvTwinkle {
              0%, 100% { opacity: 0.25; transform: scale(0.95); }
              50% { opacity: 0.85; transform: scale(1.08); }
            }
            @keyframes amvFadeUp {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes amvShimmer {
              0%, 100% { opacity: 0.75; }
              50% { opacity: 1; }
            }
          `}
        </style>

        {/* Stars */}
        {[
          { top: "8%", left: "5%" },
          { top: "12%", left: "35%" },
          { top: "8%", left: "60%" },
          { top: "15%", left: "85%" },
          { top: "42%", left: "3%" },
          { top: "38%", left: "90%" },
          { top: "68%", left: "5%" },
          { top: "72%", left: "38%" },
          { top: "65%", left: "82%" },
          { top: "88%", left: "3%" },
          { top: "85%", left: "90%" },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              top: pos.top,
              left: pos.left,
              backgroundColor: "hsl(38, 92%, 50%)",
              opacity: 0.6,
              animation: "amvTwinkle 3.2s ease-in-out infinite",
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}

        {/* Logo + TIME/DATE/COUNTRY */}
        <div className="p-8 flex items-start gap-4 relative z-10">
          <img src={amvLogo} alt="Amineva Global" className="h-14 w-14 rounded-full" />

          <div style={{ animation: "amvFadeUp 700ms ease-out, amvShimmer 3.6s ease-in-out infinite" }}>
            <div className="font-semibold tracking-wide leading-none" style={{ color: "hsl(38,92%,50%)", fontSize: "22px" }}>
              {displayTime}, {effectiveCountryLabel}
            </div>
            <div className="font-medium tracking-wide text-xs mt-1" style={{ color: "hsla(38,92%,50%,0.85)" }}>
              {displayDate}
            </div>
          </div>
        </div>

        {/* Orbital */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[420px] h-[420px] animate-[spin_60s_linear_infinite]">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-6 rounded-full border border-white/15" />
            <div className="absolute inset-12 rounded-full border border-white/10" />

            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div
                key={deg}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  top: `${50 - 48 * Math.cos((deg * Math.PI) / 180)}%`,
                  left: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "hsl(38, 92%, 50%)",
                  opacity: 0.6,
                }}
              />
            ))}

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "hsla(38,92%,50%,0.2)" }}
              >
                <span className="text-2xl" style={{ color: "hsl(38,92%,50%)" }}>
                  ⚡
                </span>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
              <span style={{ color: "hsl(38,92%,50%)" }}>📊</span> Analytics
            </div>
            <div className="space-y-1">
              <div className="h-1.5 rounded w-full" style={{ backgroundColor: "hsla(38,92%,50%,0.7)" }} />
              <div className="h-1.5 rounded w-3/4" style={{ backgroundColor: "hsla(38,92%,50%,0.5)" }} />
              <div className="h-1.5 rounded w-1/2" style={{ backgroundColor: "hsla(38,92%,50%,0.4)" }} />
            </div>
          </div>

          <div className="absolute top-1/2 left-[3%] -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-36">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
              <span style={{ color: "hsl(38,92%,50%)" }}>🔗</span> Network
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "hsla(38,92%,50%,0.3)" }}
                />
              ))}
            </div>
          </div>

          <div className="absolute top-1/2 right-[3%] -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
              <span style={{ color: "hsl(38,92%,50%)" }}>📋</span> Data Flow
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <div className="flex-1 h-1 rounded" style={{ backgroundColor: "hsla(38,92%,50%,0.3)" }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsla(38,92%,50%,0.5)" }} />
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <div className="flex-1 h-1 rounded" style={{ backgroundColor: "hsla(38,92%,50%,0.4)" }} />
            </div>
          </div>

          <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
              <span style={{ color: "hsl(38,92%,50%)" }}>⚙️</span> Monitoring
            </div>
            <div className="flex items-end gap-0.5 h-6">
              {[60, 80, 40, 90, 50, 70, 85].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: "hsla(142,76%,36%,0.6)" }} />
              ))}
            </div>
          </div>
        </div>

          {/* Bottom stats */}
        <div className="absolute bottom-5 left-8 translate-y-10 flex gap-16 text-white/80 z-10">
       <div>
       <div className="text-2xl font-medium text-white">99.9%</div>
      <div className="text-sm text-white/70">Uptime SLA</div>
     </div>
    <div>
    <div className="text-2xl font-medium text-white">256-bit</div>
    <div className="text-sm text-white/70">Encryption</div>
  </div>
 </div>
</div>
      
      {/* RIGHT PANEL */}
      <div className="relative flex items-start justify-center p-6 lg:p-10 bg-background text-foreground">
        <div className="w-full max-w-xl">
          {/* TOP RIGHT CTAs */}
          <div className="w-full flex justify-end gap-8 text-base font-semibold text-muted-foreground">
            <button type="button" className="hover:text-foreground transition cursor-pointer">
              About Us
            </button>

            <div className="relative">
              <button
                type="button"
                className="hover:text-foreground transition cursor-pointer"
                onClick={() => setProductsMenuOpen((v) => !v)}
              >
                Products
              </button>

              {productsMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-20">
                  {["AGStock", "AGIS", "Amniva", "AminevaOps"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent/10 transition"
                      onClick={() => setProductsMenuOpen(false)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="https://hub.amineva.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition"
            >
              Insights &amp; Reports
            </a>

            <button type="button" className="hover:text-foreground transition cursor-pointer">
              FAQs
            </button>

            <button type="button" className="hover:text-foreground transition cursor-pointer">
              Support
            </button>
          </div>

          {selectedProduct ? (
            <>
              {/* AG Stock region step */}
              {isAgStock && !canShowAuthCard && (
                <div className="border border-border rounded-xl bg-card p-5 mt-8">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2"
                      onClick={onChangeSelection}
                    >
                      <span aria-hidden>←</span> Change product
                    </button>
                    <div />
                  </div>

                  <div className="mt-4 text-center">
                    <div
                      className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "hsla(38,92%,50%,0.12)" }}
                    >
                      <span className="text-2xl" style={{ color: "hsl(38,92%,50%)" }}>
                        📍
                      </span>
                    </div>

                    <h2 className="mt-4 text-3xl font-semibold text-foreground">Where is your business located?</h2>
                    <p className="mt-2 text-muted-foreground">This helps us set up your currency and regional settings</p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <label className="block text-sm font-semibold text-foreground">Select your Country</label>

                    <select
                      value={agCountry}
                      onChange={(e) => handleAgCountryChange(e.target.value)}
                      className="w-full h-12 rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="" disabled>
                        Choose a country
                      </option>
                      {countryCurrencyOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {agCountry ? (
                      <div className="text-sm text-muted-foreground">
                        Currency:{" "}
                        <span className="text-foreground font-semibold">
                          {selectedAgOption?.currencyCode || agCurrencyCode}
                        </span>
                      </div>
                    ) : null}

                    <div className="pt-3">
                      <button
                        type="button"
                        disabled={!agCountry}
                        onClick={() => setAgStepConfirmed(true)}
                        className={`w-full h-12 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                          agCountry ? "text-white" : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                        style={agCountry ? { backgroundColor: "hsl(38,92%,35%)" } : undefined}
                      >
                        Continue <span aria-hidden>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Auth */}
              {canShowAuthCard && (
                <div className="mt-8">
                  <AuthCard
                    product={selectedProduct}
                    authTab={authTab}
                    setAuthTab={setAuthTab}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    onChangeSelection={onChangeSelection}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mt-8 space-y-4">
                {allCategories.map((cat) => (
                  <details key={cat.id} className="group border border-border rounded-xl bg-card">
                    <summary className="cursor-pointer list-none flex items-center justify-between p-5">
                      <span className="text-lg font-semibold text-foreground">{cat.name}</span>
                      <span className="text-muted-foreground group-open:rotate-180 transition">▾</span>
                    </summary>

                    <div className="px-5 pb-5 pt-1 space-y-2">
                      {cat.products.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Coming soon</div>
                      ) : (
                        cat.products.map((p) => {
                          const IconComponent = getProductIconSafe(p.id);
                          const isDisabled = p.status === "coming_soon" || p.status === "offline";
                          const isPublic = Boolean(p.isPublic && p.isExternal);

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => onPickProduct(p)}
                              disabled={isDisabled}
                              className={`w-full flex items-center gap-4 text-left border border-border rounded-lg px-4 py-3 transition-all ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed bg-muted/30"
                                  : "hover:bg-accent/10 hover:border-accent/50 cursor-pointer"
                              }`}
                            >
                              <IconComponent className="w-8 h-8 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{p.name}</span>
                                  {getStatusBadge(p.status)}
                                </div>
                                {p.description ? (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{p.description}</p>
                                ) : null}
                              </div>

                              {!isDisabled &&
                                (isPublic ? (
                                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                ))}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </details>
                ))}
              </div>

              <div className="mt-10 flex justify-center text-sm text-muted-foreground">
                <button type="button" className="hover:text-foreground transition cursor-pointer" onClick={() => navigate("/")}>
                  Explore More
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer (right panel): copyright left, terms/privacy right */}
        <div className="absolute bottom-4 left-8 right-8 flex justify-between items-center text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Amineva Global. All Rights Reserved.</span>

          <div className="flex gap-6">
            <button type="button" className="hover:text-foreground transition cursor-pointer">
              Terms of Service
            </button>
            <button type="button" className="hover:text-foreground transition cursor-pointer">
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
