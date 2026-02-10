import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductData } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { formatAuthError } from "@/lib/auth";

interface AuthCardProps {
  product: ProductData;
  authTab: "signin" | "register";
  setAuthTab: (t: "signin" | "register") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onChangeSelection: () => void;
}

export default function AuthCard({
  product,
  authTab,
  setAuthTab,
  email,
  setEmail,
  password,
  setPassword,
  onChangeSelection,
}: AuthCardProps) {
  const navigate = useNavigate();
  const { login, register, isLoading, mfaState } = useAuth();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = authTab === "register";
  const loading = isLoading || busy;

  const handleSubmit = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    if (isRegister) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (confirmPassword !== password) {
        setError("Passwords do not match.");
        return;
      }
    }

    setBusy(true);
    try {
      if (isRegister) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      // Auth succeeded — session is confirmed. Navigate to 2FA page.
      // Verify2FA will detect if user needs setup (QR) or verification (code).
      console.log("[AuthCard] Auth success, navigating to verify-2fa");
      navigate(`/auth/verify-2fa?product=${product.id}&returnTo=/suite`, {
        replace: true,
      });
    } catch (err: unknown) {
      console.error("[AuthCard] Auth failed:", err);
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSocial = (provider: "google" | "microsoft" | "facebook" | "github") => {
    // Social login triggers Appwrite OAuth redirect flow
    import("@/lib/appwrite").then(({ account }) => {
      const successUrl = `${window.location.origin}/auth/callback?returnTo=/suite&product=${product.id}`;
      const failureUrl = `${window.location.origin}/?auth=failed`;
      (account as any).createOAuth2Session(provider, successUrl, failureUrl);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={onChangeSelection}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 cursor-pointer"
      >
        ← Change selection
      </button>

      <div className="border border-border rounded-2xl bg-card text-card-foreground shadow-sm p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            {isRegister ? "Create your account" : "Sign in to continue"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Access {product.name}</p>
        </div>

        <div className="mt-6 flex justify-between text-sm font-medium">
          <button
            type="button"
            onClick={() => { setAuthTab("signin"); setError(""); setConfirmPassword(""); }}
            className={`pb-3 w-1/2 text-center border-b-2 cursor-pointer ${
              authTab === "signin"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthTab("register"); setError(""); }}
            className={`pb-3 w-1/2 text-center border-b-2 cursor-pointer ${
              authTab === "register"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="name@organization.com"
              type="email"
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Confirm your password"
                type="password"
                disabled={loading}
              />
            </div>
          )}

          {!isRegister && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/auth/recovery")}
                className="text-xs text-accent hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait…" : isRegister ? "Register" : "Sign In"}
          </button>

          <div className="text-center text-xs text-muted-foreground">or continue with</div>

          <div className="grid grid-cols-2 gap-3">
            {(["google", "microsoft", "facebook", "github"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSocial(p)}
                disabled={loading}
                className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
              >
                {p === "microsoft" ? "Microsoft" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
