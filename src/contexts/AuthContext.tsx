import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ProductData } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";

interface AuthCardProps {
  product: ProductData;
  authTab: "signin" | "register";
  setAuthTab: (t: "signin" | "register") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onChangeSelection: () => void;

  // Kept for compatibility with older callers (not used here)
  onSignIn?: () => void;
  onRegister?: () => void;
}

function normalizeError(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as any).message);
  if (e instanceof Error) return e.message;
  return "Authentication failed.";
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
  const { login, register, socialLogin, isLoading } = useAuth();

  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (isLoading) return false;
    if (!isEmailValid || !isPasswordValid) return false;
    if (isRegister && !confirmOk) return false;
    return true;
  }, [isEmailValid, isPasswordValid, isRegister, confirmOk, isLoading]);

  const goTo2FA = useCallback(() => {
    const productId = (product as any)?.id ?? "default";
    navigate(
      `/auth/verify-2fa?product=${encodeURIComponent(productId)}&returnTo=/suite`,
      { replace: true }
    );
  }, [navigate, product]);

  const submit = useCallback(async () => {
    setErrMsg("");

    if (!isEmailValid) return setErrMsg("Please enter a valid email address.");
    if (!isPasswordValid) return setErrMsg("Password must be at least 8 characters.");
    if (isRegister && !confirmOk) return setErrMsg("Passwords do not match.");

    try {
      const cleanEmail = email.trim();

      if (isRegister) {
        await register(cleanEmail, password);
      } else {
        await login(cleanEmail, password);
      }

      goTo2FA();
    } catch (e: unknown) {
      setErrMsg(normalizeError(e));
    }
  }, [
    email,
    password,
    isRegister,
    isEmailValid,
    isPasswordValid,
    confirmOk,
    login,
    register,
    goTo2FA,
  ]);

  const switchToSignIn = () => {
    setAuthTab("signin");
    setConfirmPassword("");
    setErrMsg("");
  };

  const switchToRegister = () => {
    setAuthTab("register");
    setErrMsg("");
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
            {isRegister ? "Create account" : "Sign in to continue"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Access {product?.name}</p>
        </div>

        <div className="mt-6 flex justify-between text-sm font-medium">
          <button
            type="button"
            onClick={switchToSignIn}
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
            onClick={switchToRegister}
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
                setErrMsg("");
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
                setErrMsg("");
              }}
              className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Enter your password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          {isRegister ? (
            <div>
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrMsg("");
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
            {isLoading
              ? isRegister
                ? "Creating account..."
                : "Signing in..."
              : isRegister
                ? "Register"
                : "Sign In"}
          </button>

          <div className="text-center text-xs text-muted-foreground">or continue with</div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => socialLogin("google")}
              disabled={isLoading}
              className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => socialLogin("microsoft")}
              disabled={isLoading}
              className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Microsoft
            </button>
            <button
              type="button"
              onClick={() => socialLogin("facebook")}
              disabled={isLoading}
              className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Facebook
            </button>
            <button
              type="button"
              onClick={() => socialLogin("github")}
              disabled={isLoading}
              className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              GitHub
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
