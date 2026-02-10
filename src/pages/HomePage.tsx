import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProducts } from "@/data/products";
import { DEFAULT_CATEGORIES, ProductData } from "@/types/product";
import { getProductIcon } from "@/lib/products";
import { Badge } from "@/components/ui/badge";
import { Clock, XCircle, ArrowRight, ExternalLink } from "lucide-react";
import amvLogo from "@/assets/amv_global_logo.png";

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductData[]>([]);

  // Load products from registry and listen for updates
  useEffect(() => {
    setProducts(loadProducts());
    const handleUpdate = () => setProducts(loadProducts());
    window.addEventListener("productsUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("productsUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

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
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground">
      {/* LEFT PANEL - Brand */}
      <div className="relative overflow-hidden amineva-hero text-white min-h-[50vh] lg:min-h-screen">
        {/* Logo + tagline */}
        <div className="p-8 flex items-start gap-4 relative z-10">
          <img src={amvLogo} alt="Amineva Global" className="h-14 w-14 rounded-full" />
          <div>
            <div className="text-accent font-semibold tracking-wide text-sm">
              ENABLING INSTITUTIONS AND
            </div>
            <div className="text-accent font-semibold tracking-wide text-sm">
              DECISION MAKERS
            </div>
          </div>
        </div>

        {/* Animated illustration cards */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Orbital circles */}
          <div className="relative w-[420px] h-[420px]">
            <div className="absolute inset-0 rounded-full border border-accent/10" />
            <div className="absolute inset-6 rounded-full border border-accent/15" />
            <div className="absolute inset-12 rounded-full border border-accent/10" />

            {/* Dots */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div
                key={deg}
                className="absolute w-2 h-2 rounded-full bg-accent/60"
                style={{
                  top: `${50 - 48 * Math.cos((deg * Math.PI) / 180)}%`,
                  left: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}

            {/* Center bolt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-2xl">⚡</span>
              </div>
            </div>

            {/* Card: Analytics */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
              <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
                <span className="text-accent">📊</span> Analytics
              </div>
              <div className="space-y-1">
                <div className="h-1.5 rounded bg-accent/70 w-full" />
                <div className="h-1.5 rounded bg-accent/50 w-3/4" />
                <div className="h-1.5 rounded bg-accent/40 w-1/2" />
              </div>
            </div>

            {/* Card: Network */}
            <div className="absolute top-1/2 -left-12 -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-36">
              <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
                <span className="text-accent">🔗</span> Network
              </div>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-accent/30" />
                ))}
              </div>
            </div>

            {/* Card: Data Flow */}
            <div className="absolute top-1/2 -right-16 -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
              <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
                <span className="text-accent">📋</span> Data Flow
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                <div className="flex-1 h-1 rounded bg-accent/30" />
                <div className="w-2 h-2 rounded-full bg-accent/50" />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                <div className="flex-1 h-1 rounded bg-accent/40" />
              </div>
            </div>

            {/* Card: Monitoring */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-40">
              <div className="text-xs text-white/80 mb-1 flex items-center gap-1">
                <span className="text-accent">⚙️</span> Monitoring
              </div>
              <div className="flex items-end gap-0.5 h-6">
                {[60, 80, 40, 90, 50, 70, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-success/60"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="absolute bottom-10 left-8 flex gap-16 text-white/80 z-10">
          <div>
            <div className="text-3xl font-semibold">99.9%</div>
            <div className="text-sm">Uptime SLA</div>
          </div>
          <div>
            <div className="text-3xl font-semibold">256-bit</div>
            <div className="text-sm">Encryption</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-start justify-center p-6 lg:p-10">
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
                <h1 className="text-3xl font-semibold">What are you here to do?</h1>
                <p className="text-muted-foreground mt-2">Select a product to get started</p>
              </div>

              <div className="mt-8 space-y-4">
                {allCategories.map((cat) => (
                  <details key={cat.id} className="group border rounded-xl bg-card">
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
                              className={`w-full flex items-center gap-4 text-left border rounded-lg px-4 py-3 transition-all ${
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

              <div className="mt-10 flex justify-center gap-6 text-sm text-muted-foreground">
                <button type="button" className="hover:text-foreground">Explore later</button>
                <button type="button" className="hover:text-foreground">Skip for now</button>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Suite Powered By Amineva Global. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Auth Card (extracted) ─── */
function AuthCard({
  product,
  authTab,
  setAuthTab,
  email,
  setEmail,
  password,
  setPassword,
  onChangeSelection,
  onSignIn,
  onRegister,
}: {
  product: ProductData;
  authTab: "signin" | "register";
  setAuthTab: (t: "signin" | "register") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onChangeSelection: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onChangeSelection}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4"
      >
        ← Change selection
      </button>

      <div className="border rounded-2xl bg-card text-card-foreground shadow-sm p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Sign in to continue</h2>
          <p className="text-sm text-muted-foreground mt-1">Access {product.name}</p>
        </div>

        <div className="mt-6 flex justify-between text-sm font-medium">
          <button
            type="button"
            onClick={() => setAuthTab("signin")}
            className={`pb-3 w-1/2 text-center border-b-2 ${
              authTab === "signin"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthTab("register")}
            className={`pb-3 w-1/2 text-center border-b-2 ${
              authTab === "register"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Register
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="name@organization.com"
              type="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Enter your password"
              type="password"
            />
          </div>

          {authTab === "signin" ? (
            <button
              type="button"
              onClick={onSignIn}
              className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 hover:opacity-90 transition"
            >
              Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={onRegister}
              className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 hover:opacity-90 transition"
            >
              Register
            </button>
          )}

          <div className="text-center text-xs text-muted-foreground">or continue with</div>

          <div className="grid grid-cols-2 gap-3">
            <button className="rounded-lg border border-input py-2 text-sm text-foreground hover:bg-muted transition">
              Google
            </button>
            <button className="rounded-lg border border-input py-2 text-sm text-foreground hover:bg-muted transition">
              Microsoft
            </button>
            <button className="rounded-lg border border-input py-2 text-sm text-foreground hover:bg-muted transition">
              Facebook
            </button>
            <button className="rounded-lg border border-input py-2 text-sm text-foreground hover:bg-muted transition">
              GitHub
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
