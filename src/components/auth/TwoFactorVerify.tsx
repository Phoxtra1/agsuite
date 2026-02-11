import React, { useState, useEffect, useCallback } from "react";
import { account } from "@/lib/appwrite";
import { AuthenticationFactor } from "appwrite";
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
  KeyRound,
  RefreshCw,
} from "lucide-react";

interface TwoFactorVerifyProps {
  onVerifyComplete: () => void;
  onCancel?: () => void;
  onRecovery?: () => void;
}

/**
 * Self-managing TOTP verification component.
 * Creates its own MFA challenge on mount and verifies the user's code.
 */

function getTotpFactor(): any {
  const af: any = AuthenticationFactor;
  return af?.Totp ?? af?.TOTP ?? "totp";
}

export function TwoFactorVerify({
  onVerifyComplete,
  onCancel,
  onRecovery,
}: TwoFactorVerifyProps) {
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const createChallenge = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    setChallengeId(null);

    try {
      const factor = getTotpFactor();
      const challenge = await (account as any).createMfaChallenge(factor);
      const id =
        challenge?.$id || challenge?.id || challenge?.challengeId || null;
      if (!id) throw new Error("No challenge ID returned from server");
      setChallengeId(id);
    } catch (err: any) {
      console.error("[TwoFactorVerify] Challenge creation failed:", err);
      setError(
        "Failed to start verification. Tap 'New Code' or refresh the page."
      );
    } finally {
      setIsCreating(false);
    }
  }, []);

  useEffect(() => {
    createChallenge();
  }, [createChallenge]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeId || code.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setError(null);

    try {
      // Try positional args first, then object arg (SDK version compat)
      const acc: any = account;
      let verified = false;

      // Method 1: updateMfaChallenge(id, otp)
      if (typeof acc.updateMfaChallenge === "function" && !verified) {
        try {
          await acc.updateMfaChallenge(challengeId, code);
          verified = true;
        } catch (e1: any) {
          // If it's an invalid OTP error, don't try other methods
          if (/invalid|otp|token/i.test(e1?.message || "")) throw e1;
          // Try object format
          try {
            await acc.updateMfaChallenge({ challengeId, otp: code });
            verified = true;
          } catch (e2: any) {
            if (/invalid|otp|token/i.test(e2?.message || "")) throw e2;
          }
        }
      }

      // Method 2: updateMFAChallenge (capital MFA)
      if (!verified && typeof acc.updateMFAChallenge === "function") {
        try {
          await acc.updateMFAChallenge(challengeId, code);
          verified = true;
        } catch (e3: any) {
          if (/invalid|otp|token/i.test(e3?.message || "")) throw e3;
          await acc.updateMFAChallenge({ challengeId, otp: code });
          verified = true;
        }
      }

      if (!verified) {
        throw new Error("No compatible MFA verification method found in SDK");
      }

      // Confirm session is still valid
      await account.get();
      onVerifyComplete();
    } catch (err: any) {
      const msg = err?.message || "";
      if (/expired|challenge/i.test(msg)) {
        setError("Verification expired. Tap 'New Code' to try again.");
      } else if (/invalid|otp|token/i.test(msg)) {
        setError("Invalid code. Check your authenticator app and try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (error) setError(null);
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleVerify} className="space-y-6">
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
              disabled={isVerifying || isCreating}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={code.length !== 6 || isVerifying || isCreating}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : isCreating ? (
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
            onClick={() => {
              setCode("");
              createChallenge();
            }}
            disabled={isCreating || isVerifying}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            New Code
          </Button>

          {onRecovery && (
            <Button
              type="button"
              variant="link"
              className="w-full text-muted-foreground"
              onClick={onRecovery}
              disabled={isVerifying}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Lost your authenticator?
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onCancel}
              disabled={isVerifying}
            >
              Cancel
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
