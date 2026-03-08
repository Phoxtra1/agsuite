import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductData } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { formatAuthError, isAlreadyRegisteredError } from "@/lib/auth";

interface AuthCardProps {
  product: ProductData;
  authTab: "signin" | "register";
  setAuthTab: (t: "signin" | "register") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onChangeSelection: () => void;

  // Keep these props but we will NOT use them to navigate blindly anymore.
  onSignIn: () => void;
  onRegister: () => void;
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
  const { login, register: authRegister, isLoading } = useAuth();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");

  const isRegister = authTab === "register";

  const isEmailValid = useMemo(() => {
    const v = email.trim();
    return v.length > 3 && v.includes("@") && v.includes(".");
  }, [email]);

  const isPasswordValid = useMemo(() => password.length >= 8, [password]);

  const confirmOk = useMemo(() => {
    if (!isRegister) return true;
    return confirmPassword.length > 0 && confirmPassword === password;
  }, [isRegister, confirmPassword, password]);

  const canSubmit = useMemo(() => {
    if (!isEmailValid || !isPasswordValid) return false;
    if (isRegister && !confirmOk) return false;
    return !loading;
  }, [isEmailValid, isPasswordValid, isRegister, confirmOk, loading]);

  const resetErrors = () => setErrMsg("");

  const submit = async () => {
    resetErrors();

    // Basic UI validation (keeps it clean)
    if (!isEmailValid) {
      setErrMsg("Please enter a valid email address.");
      return;
    }
    if (!isPasswordValid) {
      setErrMsg("Password must be at least 8 characters.");
      return;
    }
    if (isRegister && !confirmOk) {
      setErrMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await authRegister(email, password);
      } else {
        await login(email, password);
      }

      // Only now do we move forward (session exists)
      navigate(`/auth/verify-2fa?product=${encodeURIComponent(product.id)}`);
    } catch (e) {
      setErrMsg(formatAuthError(e));
    } finally {
      setLoading(false);
    }
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
            {isRegister ? "Create an account" : "Sign in to continue"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Access {product.name}</p>
        </div>

        <div className="mt-6 flex justify-between text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setAuthTab("signin");
              setConfirmPassword("");
              resetErrors();
            }}
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
            onClick={() => {
              setAuthTab("register");
              resetErrors();
            }}
            className={`pb-3 w-1/2 text-center border-b-2 cursor-pointer ${
              authTab === "register"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Register
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {/* Error */}
          {errMsg ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errMsg}
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                resetErrors();
              }}
              className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="name@organization.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                resetErrors();
              }}
              className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Enter your password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Minimum 8 characters.</span>
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => navigate("/auth/recovery")}
                  className="text-xs text-accent hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
          </div>

          {/* Confirm password (Register only) */}
          {isRegister ? (
            <div>
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  resetErrors();
                }}
                className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Re-enter your password"
                type="password"
                autoComplete="new-password"
              />
              {!confirmOk && confirmPassword.length > 0 ? (
                <div className="mt-1 text-xs text-destructive">Passwords do not match.</div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={`w-full rounded-lg font-semibold py-3 transition ${
              canSubmit
                ? "bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {loading ? (isRegister ? "Creating account..." : "Signing in...") : isRegister ? "Register" : "Sign In"}
          </button>

          {/* Social login (kept, but visually calmer + optional later) */}
          <div className="text-center text-xs text-muted-foreground pt-2">or continue with</div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer"
              onClick={() => setErrMsg("Google sign-in is not wired yet. We’ll connect it after core auth + 2FA is stable.")}
            >
              Google
            </button>
            <button
              type="button"
              className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer"
              onClick={() => setErrMsg("Microsoft sign-in is not wired yet. We’ll connect it after core auth + 2FA is stable.")}
            >
              Microsoft
            </button>
            <button
              type="button"
              className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer"
              onClick={() => setErrMsg("Facebook sign-in is not wired yet. We’ll connect it after core auth + 2FA is stable.")}
            >
              Facebook
            </button>
            <button
              type="button"
              className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer"
              onClick={() => setErrMsg("GitHub sign-in is not wired yet. We’ll connect it after core auth + 2FA is stable.")}
            >
              GitHub
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
