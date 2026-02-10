import React, { useState } from "react";
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

function normalizeError(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as any).message);
  }
  return "Verification failed. Please try again.";
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // 1) Complete the MFA challenge
      await account.updateMFAChallenge({
        challengeId,
        otp: verificationCode,
      });

      // 2) Confirm session/user is now available before completing the flow.
      // If this fails, it means the session isn't actually usable yet.
      await account.get();

      // 3) Now we can safely proceed (navigate / update UI / refresh gate)
      onVerifyComplete();
    } catch (err: unknown) {
      const message = normalizeError(err);
      setError(message);
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
    setError(null);
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
            disabled={verificationCode.length !== 6 || isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          {onRecovery && (
            <Button
              type="button"
              variant="link"
              className="w-full text-muted-foreground"
              onClick={onRecovery}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Lost your authenticator?
            </Button>
          )}

          {onCancel && (
            <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
