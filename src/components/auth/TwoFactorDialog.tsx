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

/**
 * Simple 2FA verification dialog for returning users.
 * Matches the screenshot design - no QR code, just code entry.
 */
export function TwoFactorDialog({
  onVerifyComplete,
  onEmailBackup,
}: TwoFactorDialogProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // Create MFA challenge on mount
  useEffect(() => {
    if (challengeId || isCreatingChallenge) return;

    async function createChallenge() {
      setIsCreatingChallenge(true);
      try {
        const challenge = await account.createMfaChallenge(
          AuthenticationFactor.Totp
        );
        setChallengeId(challenge.$id);
      } catch (err) {
        console.error("Failed to create MFA challenge:", err);
        setError("Failed to initialize verification. Please try again.");
      } finally {
        setIsCreatingChallenge(false);
      }
    }

    createChallenge();
  }, [challengeId, isCreatingChallenge]);

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
          setAttemptsLeft(5);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
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
        setError("No active challenge. Please refresh.");
        return;
      }

      setIsVerifying(true);
      setError(null);

      try {
        await account.updateMFAChallenge({
          challengeId,
          otp: code,
        });

        // Success
        recordOTPAttempt(true);
        onVerifyComplete();
      } catch (err: unknown) {
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
    [code, challengeId, onVerifyComplete]
  );

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError(null);
  };

  const isDisabled =
    code.length !== 6 || isVerifying || cooldown > 0 || isCreatingChallenge;

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <form onSubmit={handleVerify} className="space-y-4">
        {/* Label and Input */}
        <div className="space-y-2">
          <Label htmlFor="auth-code" className="text-base font-normal">
            Authentication Code:
          </Label>
          <Input
            id="auth-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={handleCodeChange}
            className="h-10 font-mono text-lg tracking-widest"
            autoComplete="one-time-code"
            autoFocus
            disabled={cooldown > 0 || isCreatingChallenge}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Cooldown */}
        {cooldown > 0 && (
          <p className="text-sm text-muted-foreground">
            Try again in {cooldown}s
          </p>
        )}

        {/* Attempts remaining */}
        {attemptsLeft < 5 && cooldown === 0 && (
          <p className="text-xs text-muted-foreground">
            {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
          </p>
        )}

        {/* Submit Button - aligned right */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isDisabled}
            className="bg-[hsl(207,60%,40%)] hover:bg-[hsl(207,60%,35%)] text-white px-6"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : isCreatingChallenge ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Authenticate"
            )}
          </Button>
        </div>
      </form>

      {/* Backup method section */}
      {onEmailBackup && (
        <div className="border-t pt-4 space-y-1">
          <p className="text-sm text-muted-foreground">
            Or, use a backup method:
          </p>
          <ul className="list-disc list-inside">
            <li>
              <button
                type="button"
                onClick={onEmailBackup}
                className="text-sm text-primary hover:underline"
              >
                Email
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
