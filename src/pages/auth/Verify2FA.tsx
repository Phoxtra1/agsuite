import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { account } from "@/lib/appwrite";
import { AuthenticationFactor } from "appwrite";
import { useAuth } from "@/contexts/AuthContext";
import {
  setLast2FAVerifiedAt,
  isRateLimited,
  recordOTPAttempt,
  getAttemptsRemaining,
  STEP_UP_WINDOWS,
} from "@/lib/stepUpAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertCircle, Loader2, Clock, ArrowLeft } from "lucide-react";
import amvLogo from "@/assets/amv_logo.png";

export default function Verify2FA() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const returnTo = searchParams.get("returnTo") || "/suite";
  const productKey = searchParams.get("product") || "default";

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // Calculate window for display
  const windowMs = STEP_UP_WINDOWS[productKey as keyof typeof STEP_UP_WINDOWS] ?? STEP_UP_WINDOWS.default;
  const windowMinutes = Math.floor(windowMs / 60000);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [authLoading, isAuthenticated, navigate, returnTo]);

  // Create MFA challenge on mount
  useEffect(() => {
    if (!isAuthenticated || challengeId || isCreatingChallenge) return;

    async function createChallenge() {
      setIsCreatingChallenge(true);
      try {
        const challenge = await account.createMfaChallenge(AuthenticationFactor.Totp);
        setChallengeId(challenge.$id);
      } catch (err) {
        console.error("Failed to create MFA challenge:", err);
        setError("Failed to initialize 2FA. Please try again.");
      } finally {
        setIsCreatingChallenge(false);
      }
    }

    createChallenge();
  }, [isAuthenticated, challengeId, isCreatingChallenge]);

  // Update rate limit state
  useEffect(() => {
    const { limited, cooldownRemaining } = isRateLimited();
    if (limited) {
      setCooldown(cooldownRemaining);
    }
    setAttemptsLeft(getAttemptsRemaining());
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          setAttemptsLeft(5); // Reset after cooldown
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    // Check rate limit
    const { limited, cooldownRemaining } = isRateLimited();
    if (limited) {
      setCooldown(cooldownRemaining);
      setError(`Too many attempts. Please wait ${cooldownRemaining}s.`);
      return;
    }

    if (!challengeId) {
      setError("No active challenge. Refreshing...");
      setChallengeId(null);
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await account.updateMFAChallenge({
        challengeId,
        otp: code,
      });

      // Success - record and update timestamp
      recordOTPAttempt(true);
      setLast2FAVerifiedAt();

      // Redirect back to product
      if (returnTo.startsWith("http")) {
        window.location.href = returnTo;
      } else {
        navigate(returnTo);
      }
    } catch (err: unknown) {
      recordOTPAttempt(false);
      setAttemptsLeft(getAttemptsRemaining());

      const { limited: nowLimited, cooldownRemaining: newCooldown } = isRateLimited();
      if (nowLimited) {
        setCooldown(newCooldown);
        setError(`Too many failed attempts. Wait ${newCooldown}s.`);
      } else {
        const message = err instanceof Error ? err.message : "Invalid code";
        setError(message);
      }
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  }, [code, challengeId, returnTo, navigate]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <div className="mb-8">
        <img src={amvLogo} alt="Amineva" className="h-10" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Verify Your Identity</CardTitle>
          <CardDescription className="space-y-1">
            <span className="block">
              Enter the 6-digit code from your authenticator app.
            </span>
            <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Valid for {windowMinutes} minutes after verification
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            {/* User info */}
            {user && (
              <div className="text-center text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.email}</span>
              </div>
            )}

            {/* Code input */}
            <div className="space-y-2">
              <Label htmlFor="totp-code">Verification Code</Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="one-time-code"
                autoFocus
                disabled={cooldown > 0 || isCreatingChallenge}
              />
              {attemptsLeft < 5 && cooldown === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Cooldown display */}
            {cooldown > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Try again in {cooldown}s</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={code.length !== 6 || isVerifying || cooldown > 0 || isCreatingChallenge}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : isCreatingChallenge ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>

            {/* Back */}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
        This additional verification helps protect your account when accessing sensitive features.
      </p>
    </div>
  );
}
