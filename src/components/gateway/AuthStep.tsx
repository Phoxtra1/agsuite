// Path: src/suite/gateway/AuthStep.tsx

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAlreadyRegisteredError } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { hardResetAuthState } from "@/lib/authReset";

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
  const { login, register, socialLogin, isLoading, isAuthenticated } = useAuth();

  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showSwitchHint, setShowSwitchHint] = useState(false);

  // Prevent loops: only proceed once auth is truly set
  const [authTriggered, setAuthTriggered] = useState(false);

  // Clear errors when switching tabs
  useEffect(() => {
    setError("");
    setShowSwitchHint(false);
    if (!isRegister) setConfirmPassword("");
    setAuthTriggered(false);
  }, [isRegister]);

  // Only proceed when AuthContext confirms we are authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    if (authTriggered) return;

    setAuthTriggered(true);
    onAuthSuccess();
  }, [isAuthenticated, authTriggered, onAuthSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      // ✅ Critical: clears stale state/session artifacts before any auth attempt
      hardResetAuthState();

      // Do NOT call onAuthSuccess here; wait for AuthContext state update
      if (isRegister) {
        await register(cleanEmail, password);
      } else {
        await login(cleanEmail, password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";

      if (isRegister && isAlreadyRegisteredError(err)) {
        setError("This email is already registered.");
        setShowSwitchHint(true);
      } else if (msg.includes("Invalid credentials") || msg.includes("Invalid email or password")) {
        setError("Invalid email or password. Please check your credentials and try again.");
      } else if (msg.includes("User not found") || msg.includes("user_not_found")) {
        setError("No account found with this email. Please register first.");
      } else if (msg.includes("too many requests") || msg.includes("Rate limit")) {
        setError("Too many login attempts. Please wait a moment and try again.");
      } else {
        setError(msg);
      }
    }
  };

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

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-scale-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
                disabled={isLoading}
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
                  disabled={isLoading}
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

            {/* ✅ Confirm Password (Register only) */}
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
                  disabled={isLoading}
                  className="h-11 bg-background/50"
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 btn-premium bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRegister ? "Creating Account..." : "Signing In..."}
                </>
              ) : isRegister ? (
                "Register"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

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
              disabled={isLoading}
            />
            <SocialButton
              icon={<span className="text-sm font-bold">🍎</span>}
              label="Apple"
              onClick={() => handleSocialLogin("apple")}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
