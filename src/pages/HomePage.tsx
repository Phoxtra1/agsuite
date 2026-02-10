import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_CATEGORIES, ProductData } from "@/types/product";
import { getProductIcon } from "@/lib/products";
import { useProducts } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { Clock, XCircle, ArrowRight, ExternalLink } from "lucide-react";
import amvLogo from "@/assets/amv_global_logo.png";
import AuthCard from "@/components/home/AuthCard";

export default function HomePage() {
  const navigate = useNavigate();
  const { products } = useProducts();

  // Group products by category dynamically from registry
  const categories = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    products: cat.products
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as ProductData[],
  }));

  // Uncategorized products
  const categorizedIds = new Set(DEFAULT_CATEGORIES.flatMap((c) => c.products));
  const uncategorized = products.filter((p) => !categorizedIds.has(p.id));
  const allCategories =
    uncategorized.length > 0
      ? [
          ...categories,
          { id: "other", name: "Other Applications", order: 99, products: uncategorized },
        ]
      : categories;

  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [authTab, setAuthTab] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onPickProduct = (p: ProductData) => {
    if (p.status === "coming_soon" || p.status === "offline") return;
    setSelectedProduct(p);
    setAuthTab("signin");
    setEmail("");
    setPassword("");
  };

  const onChangeSelection = () => {
    setSelectedProduct(null);
    setAuthTab("signin");
  };

  const handleSignIn = async () => {
    navigate(`/auth/verify-2fa?product=${selectedProduct?.id || ""}`);
  };

  const handleRegister = async () => {
    navigate(`/auth/verify-2fa?product=${selectedProduct?.id || ""}`);
  };

  const getStatusBadge = (status: ProductData["status"]) => {
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
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT PANEL - Always deep dark-blue regardless of theme */}
      <div className="relative overflow-hidden min-h-[50vh] lg:min-h-screen" style={{
        background: `radial-gradient(circle at 20% 30%, hsla(38,92%,50%,0.10) 0%, transparent 55%), linear-gradient(135deg, hsl(222,47%,11%) 0%, hsl(222,40%,18%) 100%)`
      }}>
        {/* Yellow star dots */}
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
            }}
          />
        ))}

        {/* Logo + tagline */}
        <div className="p-8 flex items-start gap-4 relative z-10">
          <img src={amvLogo} alt="Amineva Global" className="h-14 w-14 rounded-full" />
          <div>
            <div className="font-semibold tracking-wide text-sm" style={{ color: "hsl(38,92%,50%)" }}>
              ENABLING INSTITUTIONS AND
            </div>
            <div className="font-semibold tracking-wide text-sm" style={{ color: "hsl(38,92%,50%)" }}>
              DECISION MAKERS
            </div>
          </div>
        </div>

        {/* Animated orbital illustration */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[420px] h-[420px] animate-[spin_60s_linear_infinite]">
            {/* Orbital circles */}
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-6 rounded-full border border-white/15" />
            <div className="absolute inset-12 rounded-full border border-white/10" />

            {/* Orbit dots */}
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

            {/* Center bolt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsla(38,92%,50%,0.2)" }}>
                <span className="text-2xl" style={{ color: "hsl(38,92%,50%)" }}>⚡</span>
              </div>
            </div>
          </div>

          {/* Cards (not spinning - positioned outside the spin container) */}
          {/* Card: Analytics */}
          <div className="absolute top-[12%] left-[15%] bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
              <span style={{ color: "hsl(38,92%,50%)" }}>📊</span> Analytics
            </div>
            <div className="space-y-1">
              <div className="h-1.5 rounded w-full" style={{ backgroundColor: "hsla(38,92%,50%,0.7)" }} />
              <div className="h-1.5 rounded w-3/4" style={{ backgroundColor: "hsla(38,92%,50%,0.5)" }} />
              <div className="h-1.5 rounded w-1/2" style={{ backgroundColor: "hsla(38,92%,50%,0.4)" }} />
            </div>
          </div>

          {/* Card: Network */}
          <div className="absolute top-[40%] left-[3%] bg-white/10 backdrop-blur-sm rounded-lg p-3 w-36">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
              <span style={{ color: "hsl(38,92%,50%)" }}>🔗</span> Network
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsla(38,92%,50%,0.3)" }} />
              ))}
            </div>
          </div>

          {/* Card: Data Flow */}
          <div className="absolute top-[40%] right-[3%] bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
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

          {/* Card: Monitoring */}
          <div className="absolute bottom-[12%] left-[18%] bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
            <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
              <span style={{ color: "hsl(38,92%,50%)" }}>⚙️</span> Monitoring
            </div>
            <div className="flex items-end gap-0.5 h-6">
              {[60, 80, 40, 90, 50, 70, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ height: `${h}%`, backgroundColor: "hsla(142,76%,36%,0.6)" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="absolute bottom-10 left-8 flex gap-16 text-white/80 z-10">
          <div>
            <div className="text-3xl font-semibold text-white">99.9%</div>
            <div className="text-sm text-white/70">Uptime SLA</div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-white">256-bit</div>
            <div className="text-sm text-white/70">Encryption</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - respects theme */}
      <div className="flex items-start justify-center p-6 lg:p-10 bg-background text-foreground">
        <div className="w-full max-w-xl">
          {selectedProduct ? (
            <AuthCard
              product={selectedProduct}
              authTab={authTab}
              setAuthTab={setAuthTab}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onChangeSelection={onChangeSelection}
              onSignIn={handleSignIn}
              onRegister={handleRegister}
            />
          ) : (
            <>
              <div className="text-center mt-4">
                <h1 className="text-3xl font-semibold text-foreground">What are you here to do?</h1>
                <p className="text-muted-foreground mt-2">Select a product to get started</p>
              </div>

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
                          const IconComponent = getProductIcon(p.id);
                          const isDisabled = p.status === "coming_soon" || p.status === "offline";
                          const isPublic = p.isPublic && p.isExternal;

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
                                {p.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {p.description}
                                  </p>
                                )}
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

              <div className="mt-10 flex justify-center gap-2 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="hover:text-foreground transition cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  Explore Later
                </button>
                <span>—</span>
                <button
                  type="button"
                  className="hover:text-foreground transition cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  Skip for now
                </button>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Amineva Global. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
