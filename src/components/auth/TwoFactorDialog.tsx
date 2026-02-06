import React, { useState, useEffect, useCallback } from "react";
import { account } from "@/lib/appwrite";
import { AuthenticationFactor } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  isRateLimited,
  recordOTPAttempt,
  getAttemptsRemaining,
} from "@/lib/stepUpAuth";

interface TwoFactorDialogProps {
  onVerifyComplete: () => void;
  onEmailBackup?: () => void;
}

/* ===============================
   STORAGE KEYS (single source)
================================ */
const CHALLENGE_KEY = "twofa_challenge_id";

export function TwoFactorDialog({
  onVerifyComplete,
  onEmailBackup,
}: TwoFactorDialogProps) {

  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  /* ===============================
     HARD RESET ON MOUNT
  ================================ */
  useEffect(() => {
    localStorage.removeItem(CHALLENGE_KEY);
    createFreshChallenge();
  }, []);

  /* ===============================
     CREATE FRESH CHALLENGE
  ================================ */
  async function createFreshChallenge() {
    if (isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const challenge = await account.createMfaChallenge(
        AuthenticationFactor.Totp
      );

      localStorage.setItem(CHALLENGE_KEY, challenge.$id);
      setChallengeId(challenge.$id);
    } catch (err) {
      console.error("MFA challenge creation failed:", err);
      setError("Failed to initialize authentication. Refresh page.");
    } finally {
      setIsCreating(false);
    }
  }

  /* ===============================
     RATE LIMIT INIT
  ================================ */
  useEffect(() => {
    const { limited, cooldownRemaining } = isRateLimited();
    if (limited) setCooldown(cooldownRemaining);
    setAttemptsLeft(getAttemptsRemaining());
  }, []);

  /* ===============================
     COOLDOWN TIMER
  ================================ */
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          setAttemptsLeft(5);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  /* ===============================
     VERIFY OTP
  ================================ */
  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (code.length !== 6) {
        setError("Enter 6-digit code");
        return;
      }

      const { limited, cooldownRemaining } = isRateLimited();
      if (limited) {
        setCooldown(cooldownRemaining);
        setError(`Too many attempts. Wait ${cooldownRemaining}s.`);
        return;
      }

      const storedChallenge = localStorage.getItem(CHALLENGE_KEY);

      if (!storedChallenge) {
        setError("Session expired. Refresh page.");
        return;
      }

      setIsVerifying(true);
      setError(null);

      try {
        await account.updateMFAChallenge({
          challengeId: storedChallenge,
          otp: code,
        });

        // SUCCESS → CLEAN STATE
        localStorage.removeItem(CHALLENGE_KEY);
        recordOTPAttempt(true);
        onVerifyComplete();
      } catch (err) {
        recordOTPAttempt(false);
        setAttemptsLeft(getAttemptsRemaining());

        const { limited: nowLimited, cooldownRemaining: newCooldown } =
          isRateLimited();

        if (nowLimited) {
          setCooldown(newCooldown);
          setError(`Too many failed attempts. Wait ${newCooldown}s.`);
        } else {
          setError("Invalid code");
        }

        setCode("");
      } finally {
        setIsVerifying(false);
      }
    },
    [code, onVerifyComplete]
  );

  /* ===============================
     INPUT HANDLER
  ================================ */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError(null);
  }

  const disabled =
    code.length !== 6 || isVerifying || isCreating || cooldown > 0;

  /* ===============================
     UI
  ================================ */
  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <form onSubmit={handleVerify} className="space-y-4">

        <div className="space-y-2">
          <Label htmlFor="auth-code">Authentication Code</Label>
          <Input
            id="auth-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={handleChange}
            className="font-mono tracking-widest"
            autoFocus
            disabled={disabled}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {cooldown > 0 && (
          <p className="text-sm text-muted-foreground">
            Try again in {cooldown}s
          </p>
        )}

        {attemptsLeft < 5 && cooldown === 0 && (
          <p className="text-xs text-muted-foreground">
            {attemptsLeft} attempt(s) remaining
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={disabled}>
            {isVerifying || isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Authenticate"
            )}
          </Button>
        </div>
      </form>

      {onEmailBackup && (
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={onEmailBackup}
            className="text-sm text-primary hover:underline"
          >
            Use email instead
          </button>
        </div>
      )}
    </div>
  );
}
