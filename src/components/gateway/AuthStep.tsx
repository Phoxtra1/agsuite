// Path: src/suite/gateway/AuthStep.tsx

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAlreadyRegisteredError } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Loader2, AlertCircle, Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";
import { hardResetAuthState } from "@/lib/authReset";
import {
  recordFailedAttempt,
  checkLockout,
  clearAttempts,
  formatLockoutTime,
} from "@/lib/auth/rateLimiter";

import { loadAppAccess } from "@/lib/auth/appAccess";
import { supabase } from "@/integrations/supabase/client";

// Social login button component
const SocialButton = React.forwardRef<
  HTMLButtonElement,
  { icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean }
>(({ icon, label, onClick, disabled }, ref) => {
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      className="flex-1 h-11 gap-2 bg-background/50 hover:bg-muted/50 border-border/50"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span className="sr-only md:not-sr-only md:text-xs">{label}</span>
    </Button>
  );
});
SocialButton.displayName = "SocialButton";

interface AuthStepProps {
  selectedProductKey: string | null;
  onBack: () => void;
  onAuthSuccess: () => void;
}

export function AuthStep({ selectedProductKey, onBack, onAuthSuccess }: AuthStepProps) {
  const { login, register, socialLogin, sendMagicLink, isLoading, isAuthenticated } = useAuth();

  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showSwitchHint, setShowSwitchHint] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  // Rate limiting state
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // Prevent loops: only proceed once auth is truly set
  const [authTriggered, setAuthTriggered] = useState(false);

  // Check lockout on mount
  useEffect(() => {
    const status = checkLockout();
    setIsLockedOut(status.locked);
    setLockoutRemaining(status.remainingMs);
    setAttemptsLeft(status.attemptsLeft);
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLockedOut || lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      const status = checkLockout();
      if (!status.locked) {
        setIsLockedOut(false);
        setLockoutRemaining(0);
        setAttemptsLeft(status.attemptsLeft);
        setError("");
        clearInterval(interval);
      } else {
        setLockoutRemaining(status.remainingMs);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutRemaining]);

  // Clear errors when switching tabs
  useEffect(() => {
    setError("");
    setShowSwitchHint(false);
    setMagicLinkSent(false);
    if (!isRegister) setConfirmPassword("");
    setAuthTriggered(false);
  }, [isRegister]);

  // Only proceed when AuthContext confirms we are authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    if (authTriggered) return;

    setAuthTriggered(true);
    clearAttempts();
    onAuthSuccess();
  }, [isAuthenticated, authTriggered, onAuthSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check lockout first
    const lockStatus = checkLockout();
    if (lockStatus.locked) {
      setIsLockedOut(true);
      setLockoutRemaining(lockStatus.remainingMs);
      setError(`Too many failed attempts. Try again in ${formatLockoutTime(lockStatus.remainingMs)}.`);
      return;
    }

    // Reset the trigger so the post-auth effect can fire cleanly
    setAuthTriggered(false);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter both email and password");
      return;
    }

    // Basic minimum sanity check (keeps register predictable)
    if (isRegister && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (isRegister) {
      if (!confirmPassword) {
        setError("Please confirm your password");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    try {
      hardResetAuthState();

      // Multi-app strict ecosystem isolation checks
      const targetProduct = selectedProductKey || "suite";
      const { data: availability, error: availError } = await supabase.rpc(
        "check_email_availability",
        { email_to_check: cleanEmail }
      );
      
      if (!availError && availability) {
        const res = availability as { available: boolean; registered_product?: string };
        if (!res.available) {
          const registeredProduct = res.registered_product || "suite";
          if (registeredProduct !== targetProduct) {
            const friendlyNames: Record<string, string> = {
              suite: "Amineva Global Suite",
              aminevaops: "AminevaOps",
              agstock: "AGStock",
              agis: "AGIS",
              amniva: "Amniva",
              agroclimate: "AgroClimate",
            };
            const appName = friendlyNames[registeredProduct] || registeredProduct;
            setError(
              `This email is registered for ${appName} within the Amineva Ecosystem. To maintain account privacy and security, separate email addresses must be used for different applications.`
            );
            return;
          }
        }
      }

      if (isRegister) {
        const result = await register(cleanEmail, password, undefined, selectedProductKey || undefined);
        if (result && !result.session) {
          setVerifySent(true);
          return;
        }
      } else {
        await login(cleanEmail, password);

        // Security Access Control Check
        if (selectedProductKey && selectedProductKey !== "suite") {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const access = await loadAppAccess(session.user.id, selectedProductKey);
            if (!access.allowed) {
              // Check if they are a super_admin / manager of the suite
              const suiteAccess = await loadAppAccess(session.user.id, "suite");
              const isAdmin = ["super_admin", "manager"].includes(suiteAccess.role ?? "");

              if (!isAdmin) {
                await supabase.auth.signOut();
                setError(`You do not have access to ${productLabel}. Please register or request access.`);
                return;
              }
            }
          }
        }
      }
      // Success — clear attempts
      clearAttempts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";

      // Record failed attempt for rate limiting (only for sign-in)
      if (!isRegister) {
        const result = recordFailedAttempt();
        if (result.locked) {
          setIsLockedOut(true);
          setLockoutRemaining(result.remainingMs);
          setError(`Account temporarily locked. Try again in ${formatLockoutTime(result.remainingMs)}.`);
          return;
        }
        const status = checkLockout();
        setAttemptsLeft(status.attemptsLeft);
      }

      if (isRegister && isAlreadyRegisteredError(err)) {
        setError("This email is already registered.");
        setShowSwitchHint(true);
      } else if (msg.includes("Invalid credentials") || msg.includes("Invalid email or password")) {
        setError(`Invalid email or password.${attemptsLeft > 1 ? ` ${attemptsLeft - 1} attempts remaining.` : ""}`);
      } else if (msg.includes("User not found") || msg.includes("user_not_found")) {
        setError("No account found with this email. Please register first.");
      } else if (msg.includes("too many requests") || msg.includes("Rate limit")) {
        setError("Too many login attempts. Please wait a moment and try again.");
      } else {
        setError(msg);
      }
    }
  };

  const handleMagicLink = useCallback(async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address first");
      return;
    }

    setSendingMagicLink(true);
    setError("");

    try {
      await sendMagicLink(cleanEmail);
      setMagicLinkSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setSendingMagicLink(false);
    }
  }, [email, sendMagicLink]);

  const handleSocialLogin = async (provider: "google" | "apple") => {
    try {
      await socialLogin(provider);
      toast.message("Redirecting to continue sign-in…");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Social login failed");
    }
  };

  const productLabel = selectedProductKey
    ? selectedProductKey.charAt(0).toUpperCase() + selectedProductKey.slice(1)
    : "Amineva Suite";

  const formDisabled = isLoading || isLockedOut;

  if (verifySent) {
    return (
      <Card className="w-full border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden animate-scale-in">
        <CardContent className="pt-8 pb-6 px-6 md:px-8 text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
            <Mail className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Verification Sent!</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs mx-auto">
            A confirmation link has been sent to <strong>{email.trim()}</strong>.
            Please verify your email address to access <strong>{productLabel}</strong>.
          </p>
          <Button
            type="button"
            onClick={() => { setVerifySent(false); setIsRegister(false); }}
            className="w-full h-11 bg-accent text-accent-foreground font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Change selection
      </button>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6 pb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {isRegister ? "Create your account" : "Sign in to continue"}
            </h2>
            <p className="text-sm text-muted-foreground">Access {productLabel}</p>
          </div>

          {/* Tab switcher */}
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                !isRegister
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                isRegister
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {/* Magic link success message */}
          {magicLinkSent && (
            <Alert className="mb-4 border-accent/50 bg-accent/10">
              <Mail className="h-4 w-4 text-accent" />
              <AlertDescription className="text-foreground">
                We sent a sign-in link to <strong>{email.trim()}</strong>. Check your inbox and click the link to continue.
              </AlertDescription>
            </Alert>
          )}

          {/* Lockout warning */}
          {isLockedOut && (
            <Alert variant="destructive" className="mb-4">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Account temporarily locked due to too many failed attempts. Try again in{" "}
                <strong>{formatLockoutTime(lockoutRemaining)}</strong>.
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={sendingMagicLink || !email.trim()}
                  className="mt-2 block w-full text-center rounded-md bg-accent/10 text-accent-foreground py-2 text-sm font-medium hover:bg-accent/20 transition cursor-pointer disabled:opacity-50"
                >
                  {sendingMagicLink ? "Sending…" : "Send magic link instead"}
                </button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !isLockedOut && (
              <Alert variant="destructive" className="animate-scale-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {showSwitchHint && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setError("");
                        setShowSwitchHint(false);
                      }}
                      className="mt-2 block w-full text-center rounded-md bg-accent/10 text-accent-foreground py-2 text-sm font-medium hover:bg-accent/20 transition cursor-pointer"
                    >
                      Switch to Sign In →
                    </button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={formDisabled}
                className="h-11 bg-background/50"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={formDisabled}
                  className="h-11 pr-10 bg-background/50"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {isRegister && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="confirmPassword" className="text-sm">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={formDisabled}
                  className="h-11 bg-background/50"
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 btn-premium bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
              disabled={formDisabled}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRegister ? "Creating Account..." : "Signing In..."}
                </>
              ) : isLockedOut ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Locked ({formatLockoutTime(lockoutRemaining)})
                </>
              ) : isRegister ? (
                "Register"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Magic link option (sign-in only) */}
          {!isRegister && (
            <>
              <div className="relative my-5">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  or sign in with
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2 bg-background/50 hover:bg-muted/50 border-border/50 mb-3"
                onClick={handleMagicLink}
                disabled={formDisabled || sendingMagicLink || !email.trim()}
              >
                {sendingMagicLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {sendingMagicLink ? "Sending..." : "Email Magic Link"}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <SocialButton
                  icon={<span className="text-sm font-bold">G</span>}
                  label="Google"
                  onClick={() => handleSocialLogin("google")}
                  disabled={formDisabled}
                />
                <SocialButton
                  icon={<span className="text-sm font-bold">🍎</span>}
                  label="Apple"
                  onClick={() => handleSocialLogin("apple")}
                  disabled={formDisabled}
                />
              </div>
            </>
          )}

          {isRegister && (
            <>
              <div className="relative my-5">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <SocialButton
                  icon={<span className="text-sm font-bold">G</span>}
                  label="Google"
                  onClick={() => handleSocialLogin("google")}
                  disabled={formDisabled}
                />
                <SocialButton
                  icon={<span className="text-sm font-bold">🍎</span>}
                  label="Apple"
                  onClick={() => handleSocialLogin("apple")}
                  disabled={formDisabled}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
