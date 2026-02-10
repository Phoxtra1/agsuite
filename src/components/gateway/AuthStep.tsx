import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

// Social login button component
const SocialButton = React.forwardRef<
  HTMLButtonElement,
  { icon: React.ReactNode; label: string; onClick?: () => void }
>(({ icon, label, onClick }, ref) => {
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      className="flex-1 h-11 gap-2 bg-background/50 hover:bg-muted/50 border-border/50"
      onClick={onClick}
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
  const navigate = useNavigate();

  const { login, register, socialLogin, isLoading, isAuthenticated, mfaState } = useAuth();

  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Prevent loops: only proceed once auth is truly set
  const [authTriggered, setAuthTriggered] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (authTriggered) return;

    setAuthTriggered(true);
    onAuthSuccess();
  }, [isAuthenticated, authTriggered, onAuthSuccess]);

  useEffect(() => {
    setError("");
  }, [isRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (isRegister) {
      if (!confirmEmail) {
        setError("Please confirm your email address");
        return;
      }
      if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
        setError("Email addresses do not match");
        return;
      }

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
      // Do NOT call onAuthSuccess here; wait for AuthContext state update
      if (isRegister) await register(email, password);
      else await login(email, password);

      // Mark attempt started; effect will proceed once isAuthenticated updates
      setAuthTriggered(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";

      if (msg.includes("Invalid credentials") || msg.includes("Invalid email or password")) {
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

  const handleSocialLogin = async (provider: "google" | "microsoft" | "facebook" | "github") => {
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

            {isRegister && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="confirmEmail" className="text-sm">
                  Confirm Email Address
                </Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  placeholder="Re-enter your email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11 bg-background/50"
                  autoComplete="email"
                />
              </div>
            )}

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
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

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

          <div className="grid grid-cols-4 gap-2">
            <SocialButton
              icon={<span className="text-sm font-bold">G</span>}
              label="Google"
              onClick={() => handleSocialLogin("google")}
            />
            <SocialButton
              icon={<span className="text-sm font-bold">M</span>}
              label="Microsoft"
              onClick={() => handleSocialLogin("microsoft")}
            />
            <SocialButton
              icon={<span className="text-sm font-bold">F</span>}
              label="Facebook"
              onClick={() => handleSocialLogin("facebook")}
            />
            <SocialButton
              icon={<span className="text-sm font-bold">GH</span>}
              label="GitHub"
              onClick={() => handleSocialLogin("github")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
