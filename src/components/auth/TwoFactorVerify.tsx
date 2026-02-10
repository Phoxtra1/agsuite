import React, { useMemo, useState } from "react";
import { account } from "@/lib/appwrite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertCircle, Loader2, KeyRound } from "lucide-react";

interface TwoFactorVerifyProps {
  challengeId: string;
  onVerifyComplete: () => void;
  onCancel?: () => void;
  onRecovery?: () => void;
}

function normalizeError(err: unknown): string {
  if (err && typeof err === "object") {
    // Appwrite errors often have message/code/type
    const anyErr = err as any;
    if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Verification failed. Please try again.";
}

function friendlyMfaMessage(raw: string): string {
  const msg = raw.toLowerCase();

  // These patterns commonly show up for stale challenge IDs / retries / expired requests
  if (msg.includes("challenge") || msg.includes("expired")) {
    return "This verification request has expired or changed. Please restart sign-in to generate a new verification request.";
  }

  // Generic invalid code: could be wrong code OR device time drift OR stale challenge
  if (msg.includes("invalid") || msg.includes("otp") || msg.includes("code")) {
    return "Code rejected. Ensure your phone time is set to Automatic and try the next code. If it still fails, restart sign-in to generate a fresh request.";
  }

  return raw;
}

export function TwoFactorVerify({
  challengeId,
  onVerifyComplete,
  onCancel,
  onRecovery,
}: TwoFactorVerifyProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCodeReady = verificationCode.length === 6;
  const safeChallengeId = useMemo(() => (challengeId ?? "").trim(), [challengeId]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    // Prevent double submit
    if (isVerifying) return;

    // Hard validation: no challengeId => cannot verify
    if (!safeChallengeId) {
      setError("Authentication request expired. Please sign in again.");
      return;
    }

    if (!isCodeReady) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // 1) Complete the MFA challenge
      await account.updateMFAChallenge({
        challengeId: safeChallengeId,
        otp: verificationCode,
      });

      // 2) Confirm the session/user is actually live before continuing
      // This prevents “verified then bounced” due to stale auth state.
      await account.get();

      // 3) Now safe to proceed (navigate / refresh gate / load dashboard)
      onVerifyComplete();
    } catch (err: unknown) {
      const raw = normalizeError(err);
      setError(friendlyMfaMessage(raw));
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
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
          Enter the 6-digit code from your authenticator app to continue.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleVerify} className="space-y-6">
          {/* Verification Code Input */}
          <div className="space-y-2">
            <Label htmlFor="totp-code">Verification Code</Label>
            <Input
              id="totp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
              autoFocus
              disabled={isVerifying}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={!isCodeReady || isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          {/* Recovery Option */}
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

          {/* Cancel Option */}
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
