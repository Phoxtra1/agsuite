import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setLast2FAVerifiedAt } from "@/lib/stepUpAuth";
import { Loader2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import amvLogo from "@/assets/amv_logo.png";

type ViewState = "checking" | "verify" | "error";

export default function Verify2FA() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const returnTo = searchParams.get("returnTo") || "/suite";
  const [state, setState] = useState<ViewState>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const completeAndRedirect = useCallback(() => {
    setLast2FAVerifiedAt();
    if (returnTo.startsWith("http")) {
      window.location.assign(returnTo);
      return;
    }
    navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  const startChallenge = useCallback(async () => {
    setState("checking");
    setError("");
    setCode("");

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      navigate("/", { replace: true });
      return;
    }

    const { data: factorData, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      console.warn("[Verify2FA] Failed to list factors. Continuing without 2FA.", factorsError.message);
      completeAndRedirect();
      return;
    }

    const verifiedTotp = (factorData?.totp ?? []).find((f) => f.status === "verified");

    if (!verifiedTotp) {
      // No enrolled/verified factor yet: treat this login as complete.
      completeAndRedirect();
      return;
    }

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: verifiedTotp.id,
    });

    if (challengeError || !challengeData?.id) {
      setError(challengeError?.message || "Could not start two-factor verification.");
      setState("error");
      return;
    }

    setFactorId(verifiedTotp.id);
    setChallengeId(challengeData.id);
    setState("verify");
  }, [completeAndRedirect, navigate]);

  useEffect(() => {
    startChallenge();
  }, [startChallenge]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!factorId || !challengeId || code.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setError("");

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    setIsVerifying(false);

    if (verifyError) {
      setError("Invalid or expired code. Please try again.");
      setCode("");
      return;
    }

    completeAndRedirect();
  };

  if (state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Preparing verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <img src={amvLogo} alt="Amineva" className="h-10" />
      </div>

      <Card className="w-full max-w-md">
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
          {state === "error" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error || "Verification setup failed."}</span>
              </div>
              <Button type="button" className="w-full" onClick={startChallenge}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              {error ? (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="two-factor-code">Verification Code</Label>
                <Input
                  id="two-factor-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={isVerifying}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isVerifying || code.length !== 6}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              <Button type="button" variant="secondary" className="w-full" onClick={startChallenge}>
                <RefreshCw className="mr-2 h-4 w-4" />
                New Code
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

