import React, { useState, useEffect } from "react";
import { account } from "@/lib/appwrite";
import { AuthenticatorType } from "appwrite";
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

interface MfaSetupData {
  secret: string;
  uri: string;
}

export function TwoFactorSetup({ onSetupComplete, onSkip }: TwoFactorSetupProps) {
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
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
      // Create TOTP authenticator - returns secret and QR URI
      const result = await account.createMFAAuthenticator({ type: AuthenticatorType.Totp });
      setSetupData({
        secret: result.secret,
        uri: result.uri,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initialize 2FA setup";
      setError(message);
      console.error("MFA setup error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Verify the authenticator with the OTP code
      await account.updateMFAAuthenticator({
        type: AuthenticatorType.Totp,
        otp: verificationCode,
      });
      toast.success("Two-factor authentication enabled successfully!");
      onSetupComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid verification code";
      setError(message);
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleCopySecret() {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
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
          {setupData?.uri && (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-lg border bg-background p-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.uri)}`}
                  alt="QR Code for authenticator app"
                  className="h-44 w-44"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code with your authenticator app
              </p>
            </div>
          )}

          {/* Manual Secret Key */}
          {setupData?.secret && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Or enter this key manually:</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">
                  {setupData.secret}
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

          {/* Skip Option (for development/testing only) */}
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
