import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Product = { id: string; name: string };
type Category = { id: string; title: string; products: Product[] };

export default function HomePage() {
  const navigate = useNavigate();

  // ✅ Put your real products here. AGStock is a WEB APPLICATION (product), not a Suite CTA.
  const categories: Category[] = useMemo(
    () => [
      {
        id: "sell-manage",
        title: "Sell & Manage Business",
        products: [{ id: "agstock", name: "AGStock" }], // add more later
      },
      { id: "data-intel", title: "Data & Intelligence", products: [] },
      { id: "reports", title: "Reports & Publications", products: [] },
      { id: "verify", title: "Verify & Predict", products: [] },
      { id: "ops", title: "Service Operations", products: [] },
    ],
    []
  );

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [authTab, setAuthTab] = useState<"signin" | "register">("signin");

  // Basic form state (wire to your real auth)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onPickProduct = (p: Product) => {
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
    // TODO: hook into your existing Sign In (Appwrite / your AuthContext / LoginForm)
    // After success: go to 2FA step-up screen, with "next" pointing to the product dashboard
    navigate(`/auth/verify-2fa?product=${selectedProduct?.id || ""}`);
  };

  const handleRegister = async () => {
    // TODO: hook into your existing Register
    // After success: go to 2FA
    navigate(`/auth/verify-2fa?product=${selectedProduct?.id || ""}`);
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground">
      {/* LEFT PANEL (always visible): matches your screenshot style */}
      <div className="relative overflow-hidden bg-[#0b1730] text-white">
        <div className="p-8 flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-[#0b1730] flex items-center justify-center">
            {/* Replace with your logo image if you have */}
            <div className="text-3xl font-bold text-yellow-500">A</div>
          </div>
          <div>
            <div className="text-yellow-500 font-semibold tracking-wide">
              ENABLING INSTITUTIONS AND
            </div>
            <div className="text-yellow-500 font-semibold tracking-wide">
              DECISION MAKERS
            </div>
          </div>
        </div>

        {/* “Illustration” area (replace with your animation component) */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-[520px] h-[520px] rounded-full border border-yellow-500/20" />
          </div>
        </div>

        <div className="absolute bottom-10 left-8 flex gap-16 text-white/80">
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
          {/* If product selected => show auth card (dark mode like your screenshot will come from your ThemeProvider) */}
          {selectedProduct ? (
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Access {selectedProduct.name}
                  </p>
                </div>

                <div className="mt-6 flex justify-between text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setAuthTab("signin")}
                    className={`pb-3 w-1/2 text-center border-b-2 ${
                      authTab === "signin"
                        ? "border-yellow-500"
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
                        ? "border-yellow-500"
                        : "border-transparent text-muted-foreground"
                    }`}
                  >
                    Register
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email Address</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none"
                      placeholder="name@organization.com"
                      type="email"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none"
                      placeholder="Enter your password"
                      type="password"
                    />
                  </div>

                  {authTab === "signin" ? (
                    <button
                      type="button"
                      onClick={handleSignIn}
                      className="w-full rounded-lg bg-yellow-500 text-black font-semibold py-3"
                    >
                      Sign In
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRegister}
                      className="w-full rounded-lg bg-yellow-500 text-black font-semibold py-3"
                    >
                      Register
                    </button>
                  )}

                  <div className="text-center text-xs text-muted-foreground">
                    or continue with
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="rounded-lg border py-2 text-sm">Google</button>
                    <button className="rounded-lg border py-2 text-sm">Microsoft</button>
                    <button className="rounded-lg border py-2 text-sm">Facebook</button>
                    <button className="rounded-lg border py-2 text-sm">GitHub</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Default state: category list (accordion)
            <>
              <div className="text-center mt-4">
                <h1 className="text-3xl font-semibold">What are you here to do?</h1>
                <p className="text-muted-foreground mt-2">
                  Select a product to get started
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {categories.map((cat) => (
                  <details
                    key={cat.id}
                    className="group border rounded-xl bg-card"
                  >
                    <summary className="cursor-pointer list-none flex items-center justify-between p-5">
                      <span className="text-lg font-semibold">{cat.title}</span>
                      <span className="text-muted-foreground group-open:rotate-180 transition">
                        ▾
                      </span>
                    </summary>

                    <div className="px-5 pb-5 pt-1 space-y-2">
                      {cat.products.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Coming soon
                        </div>
                      ) : (
                        cat.products.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => onPickProduct(p)}
                            className="w-full text-left border rounded-lg px-4 py-3 hover:bg-muted"
                          >
                            {p.name}
                          </button>
                        ))
                      )}
                    </div>
                  </details>
                ))}
              </div>

              <div className="mt-10 flex justify-center gap-6 text-sm text-muted-foreground">
                <button type="button" className="hover:text-foreground">
                  Explore later
                </button>
                <button type="button" className="hover:text-foreground">
                  Skip for now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
