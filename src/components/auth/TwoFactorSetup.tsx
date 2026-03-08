import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Copy, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  onSetupComplete: () => void;
  onSkip?: () => void;
}

export function TwoFactorSetup({ onSetupComplete, onSkip }: TwoFactorSetupProps) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initializeMfaSetup();
  }, []);

  async function initializeMfaSetup() {
    setIsLoading(true);
    setError(null);
    try {
      // Check if user already has a verified TOTP factor
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = (factors?.totp ?? []).find((f) => (f.status as string) === "verified");
      if (verified) {
        // Already enrolled → skip setup
        onSetupComplete();
        return;
      }

      // Unenroll any unverified factors first
      for (const f of factors?.totp ?? []) {
        if (f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      // Enroll a new TOTP factor
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Amineva Authenticator",
      });

      if (enrollErr || !data) {
        throw new Error(enrollErr?.message || "Failed to start 2FA enrollment");
      }

      setFactorId(data.id);
      setQrUri(data.totp.uri);
      setSecret(data.totp.secret);
    } catch (err: any) {
      setError(err?.message || "Failed to initialize 2FA setup");
      console.error("[TwoFactorSetup]", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Create a challenge for the factor
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeErr || !challengeData) {
        throw new Error(challengeErr?.message || "Failed to create verification challenge");
      }

      // Verify the challenge with the user's code
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyErr) {
        throw new Error(verifyErr.message || "Invalid verification code");
      }

      toast.success("Two-factor authentication enabled successfully!");
      onSetupComplete();
    } catch (err: any) {
      setError(err?.message || "Invalid verification code");
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleCopySecret() {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success("Secret key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
    setError(null);
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Setting up two-factor authentication...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Secure Your Account</CardTitle>
        <CardDescription>
          Set up two-factor authentication using an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-6">
          {/* QR Code */}
          {qrUri && (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-lg border bg-background p-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
                  alt="QR Code for authenticator app"
                  className="h-48 w-48"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code with your authenticator app
              </p>
            </div>
          )}

          {/* Manual Secret Key */}
          {secret && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Or enter this key manually:</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">
                  {secret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                  className="shrink-0"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Verification Code Input */}
          <div className="space-y-2">
            <Label htmlFor="verification-code">Enter 6-digit code from your app</Label>
            <Input
              id="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
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
              "Verify & Enable 2FA"
            )}
          </Button>

          {/* Skip Option */}
          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onSkip}
            >
              Skip for now
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
