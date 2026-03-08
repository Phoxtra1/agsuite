import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  RefreshCw,
} from "lucide-react";

interface TwoFactorVerifyProps {
  onVerifyComplete: () => void;
  onCancel?: () => void;
  onRecovery?: () => void;
}

export function TwoFactorVerify({
  onVerifyComplete,
  onCancel,
  onRecovery,
}: TwoFactorVerifyProps) {
  const [factorId, setFactorId] = useState<string | null>(null);
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
      const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors();
      if (factorsErr) throw new Error(factorsErr.message);

      const verified = (factors?.totp ?? []).find((f) => f.status === "verified");
      if (!verified) {
        // No 2FA enrolled — skip verification
        onVerifyComplete();
        return;
      }

      setFactorId(verified.id);

      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: verified.id,
      });

      if (challengeErr || !challenge?.id) {
        throw new Error(challengeErr?.message || "Failed to create challenge");
      }

      setChallengeId(challenge.id);
    } catch (err: any) {
      console.error("[TwoFactorVerify] Challenge creation failed:", err);
      setError("Failed to start verification. Tap 'New Code' or refresh the page.");
    } finally {
      setIsCreating(false);
    }
  }, [onVerifyComplete]);

  useEffect(() => {
    createChallenge();
  }, [createChallenge]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !challengeId || code.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setError(null);

    try {
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (verifyErr) {
        if (/expired/i.test(verifyErr.message)) {
          setError("Verification expired. Tap 'New Code' to try again.");
        } else {
          setError("Invalid code. Check your authenticator app and try again.");
        }
        setCode("");
        return;
      }

      onVerifyComplete();
    } catch (err: any) {
      setError("Verification failed. Please try again.");
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
