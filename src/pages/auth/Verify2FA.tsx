import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { account } from "@/lib/appwrite";
import { AuthenticationFactor } from "appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import {
  setLast2FAVerifiedAt,
  isRateLimited,
  recordOTPAttempt,
  getAttemptsRemaining,
  STEP_UP_WINDOWS,
} from "@/lib/stepUpAuth";
import { getProductRedirectUrl } from "@/lib/productRouting";
import { getSession } from "@/lib/auth/index";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import amvLogo from "@/assets/amv_logo.png";

function pickChallengeId(challenge: any): string | null {
  return (
    (typeof challenge?.$id === "string" && challenge.$id) ||
    (typeof challenge?.id === "string" && challenge.id) ||
    (typeof challenge?.challengeId === "string" && challenge.challengeId) ||
    null
  );
}

function normalizeError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as any).message);
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

function getTotpFactor(): any {
  const anyFactor: any = AuthenticationFactor as any;
  return anyFactor?.TOTP ?? anyFactor?.Totp ?? "totp";
}

async function createTotpChallengeCompat(): Promise<any> {
  const acc: any = account as any;
  const factor = getTotpFactor();
  if (typeof acc.createMfaChallenge === "function") {
    return acc.createMfaChallenge(factor);
  }
  throw new Error("Appwrite Account.createMfaChallenge is not available in this SDK version.");
}

async function verifyTotpChallengeCompat(challengeId: string, otp: string): Promise<void> {
  const acc: any = account as any;
  if (typeof acc.updateMfaChallenge === "function") {
    try {
      await acc.updateMfaChallenge(challengeId, otp);
      return;
    } catch {
      await acc.updateMfaChallenge({ challengeId, otp });
      return;
    }
  }
  if (typeof acc.updateMFAChallenge === "function") {
    try {
      await acc.updateMFAChallenge(challengeId, otp);
      return;
    } catch {
      await acc.updateMFAChallenge({ challengeId, otp });
      return;
    }
  }
  throw new Error("Appwrite Account.updateMfaChallenge is not available in this SDK version.");
}

/**
 * Detect if user needs TOTP setup (no factor) or verification (has factor).
 */
async function detectMfaMode(): Promise<"setup" | "verify" | "none"> {
  try {
    const factors = await (account as any).listMfaFactors();
    const hasTotp = !!factors?.totp;
    if (!hasTotp) return "setup";
    return "verify";
  } catch (err: any) {
    // If MFA check fails, default to setup (safe)
    console.warn("[Verify2FA] detectMfaMode error:", err);
    return "setup";
  }
}

export default function Verify2FA() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, completeMfaSetup, completeMfaVerification } = useAuth();

  const rawReturnTo = searchParams.get("returnTo");
  const productKey = searchParams.get("product") || "default";

  // If returnTo is /suite (internal) and user isn't a manager, use the product URL instead
  const returnTo = useMemo(() => {
    if (rawReturnTo && rawReturnTo.startsWith("http")) return rawReturnTo;
    if (!rawReturnTo || rawReturnTo === "/suite") {
      // Use product-specific URL as destination
      const productUrl = getProductRedirectUrl(productKey);
      if (productUrl !== "/suite") return productUrl;
    }
    return rawReturnTo || "/suite";
  }, [rawReturnTo, productKey]);

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // Session check state — prevents "blink" redirect
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // MFA mode: "loading" | "setup" | "verify" | "none"
  const [mfaMode, setMfaMode] = useState<"loading" | "setup" | "verify" | "none">("loading");

  const windowMs =
    STEP_UP_WINDOWS[productKey as keyof typeof STEP_UP_WINDOWS] ??
    STEP_UP_WINDOWS.default;
  const windowMinutes = Math.max(1, Math.floor(windowMs / 60000));

  // Step 1: Check session exists (independent of AuthContext timing)
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      // Wait for AuthContext to finish initial load
      if (authLoading) return;

      try {
        const session = await getSession();
        if (cancelled) return;

        const ok = !!session;
        setHasSession(ok);
        setSessionChecked(true);

        // ONLY redirect if BOTH AuthContext AND direct session check say no auth
        if (!isAuthenticated && !ok) {
          console.log("[Verify2FA] No session, redirecting to homepage");
          navigate(`/?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        setHasSession(false);
        setSessionChecked(true);

        // If we're authenticated in context, don't redirect on network error
        if (!isAuthenticated) {
          setError("Network error while checking session. Please refresh.");
          console.error("Session check failed:", err);
        }
      }
    };

    check();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, navigate, returnTo]);

  // Step 2: Detect MFA mode once session is confirmed
  useEffect(() => {
    if (!sessionChecked) return;
    if (!isAuthenticated && !hasSession) return;

    let cancelled = false;
    const detect = async () => {
      const mode = await detectMfaMode();
      if (cancelled) return;

      setMfaMode(mode);

      // If MFA is not enabled on this project, skip 2FA entirely
      if (mode === "none") {
        console.log("[Verify2FA] MFA not enabled, skipping to destination");
        setLast2FAVerifiedAt();
        completeMfaVerification();
        navigate(returnTo, { replace: true });
      }
    };
    detect();
    return () => { cancelled = true; };
  }, [sessionChecked, isAuthenticated, hasSession, returnTo, navigate, completeMfaVerification]);

  // Rate limit state
  useEffect(() => {
    const { limited, cooldownRemaining } = isRateLimited();
    if (limited) setCooldown(cooldownRemaining);
    setAttemptsLeft(getAttemptsRemaining());
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { setAttemptsLeft(5); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  // Create challenge (only for verify mode)
  const createChallenge = useCallback(async () => {
    if (!isAuthenticated && !hasSession) return;
    if (isCreatingChallenge) return;

    setIsCreatingChallenge(true);
    setError(null);

    try {
      const challenge = await createTotpChallengeCompat();
      const id = pickChallengeId(challenge);
      if (!id) throw new Error("Challenge ID missing from server response.");
      setChallengeId(id);
    } catch (err) {
      setChallengeId(null);
      const msg = normalizeError(err);

      // If challenge fails because TOTP not set up, switch to setup mode
      if (/mfa|factor|totp|disabled|not enabled|not configured/i.test(msg)) {
        console.log("[Verify2FA] Challenge failed, switching to setup mode");
        setMfaMode("setup");
        return;
      }

      setError("Failed to initialize 2FA. Please try again.");
      console.error("Failed to create MFA challenge:", err);
    } finally {
      setIsCreatingChallenge(false);
    }
  }, [isAuthenticated, hasSession, isCreatingChallenge]);

  // Auto-create challenge when in verify mode
  useEffect(() => {
    if (mfaMode !== "verify") return;
    if (authLoading || !sessionChecked) return;
    if (!isAuthenticated && !hasSession) return;
    if (challengeId || isCreatingChallenge) return;

    createChallenge();
  }, [mfaMode, authLoading, sessionChecked, isAuthenticated, hasSession, challengeId, isCreatingChallenge, createChallenge]);

  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isVerifying) return;

      if (code.length !== 6) {
        setError("Please enter a 6-digit code");
        return;
      }

      const { limited, cooldownRemaining } = isRateLimited();
      if (limited) {
        setCooldown(cooldownRemaining);
        setError(`Too many attempts. Please wait ${cooldownRemaining}s.`);
        return;
      }

      if (!challengeId) {
        setError("No active verification request. Re-initializing…");
        await createChallenge();
        return;
      }

      setIsVerifying(true);
      setError(null);

      try {
        await verifyTotpChallengeCompat(challengeId, code);
        await account.get();

        recordOTPAttempt(true);
        setLast2FAVerifiedAt();
        completeMfaVerification();

        console.log("[Verify2FA] Verification successful, navigating to:", returnTo);
        if (returnTo.startsWith("http")) window.location.assign(returnTo);
        else navigate(returnTo, { replace: true });
      } catch (err: unknown) {
        recordOTPAttempt(false);
        setAttemptsLeft(getAttemptsRemaining());

        const { limited: nowLimited, cooldownRemaining: newCooldown } = isRateLimited();
        if (nowLimited) {
          setCooldown(newCooldown);
          setError(`Too many failed attempts. Wait ${newCooldown}s.`);
        } else {
          const msg = normalizeError(err);
          setError(
            /challenge|expired/i.test(msg)
              ? 'Verification expired. Tap "Retry 2FA" to get a fresh code.'
              : /invalid|otp|code/i.test(msg)
                ? 'Code rejected. Try the next code or tap "Retry 2FA".'
                : msg
          );
        }
        setCode("");
      } finally {
        setIsVerifying(false);
      }
    },
    [code, challengeId, returnTo, navigate, isVerifying, createChallenge, completeMfaVerification]
  );

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (error) setError(null);
  };

  // Handle MFA setup completion (first-time users)
  const handleSetupComplete = () => {
    setLast2FAVerifiedAt();
    completeMfaSetup();
    console.log("[Verify2FA] MFA setup complete, navigating to:", returnTo);
    navigate(returnTo, { replace: true });
  };

  const attemptsText = useMemo(() => {
    if (attemptsLeft >= 5 || cooldown > 0) return null;
    return (
      <p className="text-xs text-muted-foreground text-center">
        {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
      </p>
    );
  }, [attemptsLeft, cooldown]);

  // Loading states
  if (authLoading || !sessionChecked || mfaMode === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // SETUP MODE: First-time users scan QR code
  if (mfaMode === "setup") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="mb-8">
          <img src={amvLogo} alt="Amineva" className="h-10" />
        </div>
        <TwoFactorSetup onSetupComplete={handleSetupComplete} />
        <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
          Two-factor authentication is required to secure your account.
        </p>
      </div>
    );
  }

  // VERIFY MODE: Existing users enter TOTP code
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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
            <span className="block">Enter the 6-digit code from your authenticator app.</span>
            <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Valid for {windowMinutes} minutes after verification
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            {user && (
              <div className="text-center text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {(user as any)?.email ?? "your account"}
                </span>
              </div>
            )}

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
                disabled={cooldown > 0 || isCreatingChallenge || isVerifying}
              />
              {attemptsText}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {cooldown > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Try again in {cooldown}s</span>
              </div>
            )}

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

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={createChallenge}
              disabled={isCreatingChallenge || isVerifying}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry 2FA
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate(-1)}>
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
