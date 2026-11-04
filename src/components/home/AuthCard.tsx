import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductData } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { formatAuthError, isAlreadyRegisteredError } from "@/lib/auth";
import { getProductRedirectUrl } from "@/lib/productRouting";
import { loadAppAccess } from "@/lib/auth/appAccess";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/appwrite/client";

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
  const { login, register, isLoading } = useAuth();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSwitchHint, setShowSwitchHint] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

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
        const result = await register(email.trim(), password, undefined, product.id);
        if (result && !result.session) {
          setVerifySent(true);
          return;
        }
      } else {
        await login(email.trim(), password);

        // Security Access Control Check
        // Workspace is the shared productivity environment. Its own
        // WorkspaceGate provisions access after authentication; it must not
        // be blocked by another product's registration metadata.
        if (product.id !== "workspace") {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const access = await loadAppAccess(session.user.id, product.id);
            if (!access.allowed) {
              await supabase.auth.signOut();
              setError(`This email address is registered under another application. Every app in Amineva Suite requires an isolated email address and user account.`);
              return;
            }
          }
        }
      }

      const productDestination = /workspace/i.test(`${product.id} ${product.name}`)
        ? "/workspace"
        : product.url
        ? `${product.url}${product.id === 'agstock' ? '/shop' : product.id === 'agis' ? '/client' : ''}`
        : getProductRedirectUrl(product.id);
      
      if (productDestination.startsWith('http')) {
        window.location.href = productDestination;
      } else {
        navigate(productDestination, { replace: true });
      }
    } catch (err: unknown) {
      setError(formatAuthError(err));
      if (isRegister && isAlreadyRegisteredError(err)) {
        setShowSwitchHint(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (verifySent) {
    return (
      <>
        <button
          type="button"
          onClick={() => setVerifySent(false)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 cursor-pointer"
        >
          ← Back to selection
        </button>

        <div className="border border-border rounded-2xl bg-card text-card-foreground shadow-sm p-8 text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
            <Mail className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Verification Sent!</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            A confirmation link has been sent to <strong>{email}</strong>.
            Please verify your email address to access <strong>{product.name}</strong>.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => { setVerifySent(false); setAuthTab("signin"); }}
              className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 hover:opacity-90 transition cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </>
    );
  }

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
            onClick={() => { setAuthTab("signin"); setError(""); setConfirmPassword(""); setShowSwitchHint(false); }}
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
            onClick={() => { setAuthTab("register"); setError(""); setShowSwitchHint(false); }}
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
            {showSwitchHint && (
              <button
                type="button"
                onClick={() => { setAuthTab("signin"); setError(""); setConfirmPassword(""); setShowSwitchHint(false); }}
                className="mt-2 block w-full text-center rounded-md bg-accent/10 text-accent py-2 text-sm font-medium hover:bg-accent/20 transition cursor-pointer"
              >
                Switch to Sign In →
              </button>
            )}
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
        </div>
      </div>
    </>
  );
}
