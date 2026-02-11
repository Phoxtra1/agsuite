import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { account } from "@/lib/appwrite";
import { setLast2FAVerifiedAt } from "@/lib/stepUpAuth";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";
import { Loader2 } from "lucide-react";
import amvLogo from "@/assets/amv_logo.png";

/**
 * Self-contained 2FA page.
 * 
 * Flow:
 * 1. Verify session exists (redirect to / if not)
 * 2. Detect MFA mode: setup (no TOTP) or verify (has TOTP)
 * 3. Show appropriate screen
 * 4. On success: mark session as 2FA-verified and redirect to returnTo
 * 
 * This page does NOT interact with AuthContext's state.
 * It operates independently using the Appwrite SDK directly.
 */
export default function Verify2FA() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const returnTo = searchParams.get("returnTo") || "/suite";
  const [mode, setMode] = useState<"loading" | "setup" | "verify">("loading");

  useEffect(() => {
    detectMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function detectMode() {
    // 1. Verify we have a valid session
    try {
      await account.getSession("current");
    } catch {
      console.log("[Verify2FA] No session found, redirecting to homepage");
      navigate("/", { replace: true });
      return;
    }

    // 2. Check if TOTP is already set up
    try {
      const factors = await (account as any).listMfaFactors();
      const hasTotp = !!factors?.totp;
      console.log("[Verify2FA] MFA factors detected, TOTP:", hasTotp);
      setMode(hasTotp ? "verify" : "setup");
    } catch (err) {
      // If listMfaFactors fails (MFA not enabled in Appwrite, SDK issue, etc.)
      // Default to setup — createMFAAuthenticator will give a better error if MFA isn't enabled
      console.warn("[Verify2FA] listMfaFactors failed, defaulting to setup:", err);
      setMode("setup");
    }
  }

  function handleComplete() {
    setLast2FAVerifiedAt();
    console.log("[Verify2FA] 2FA complete, navigating to:", returnTo);

    // Use window.location.assign for external URLs (subdomains)
    // Use React Router navigate for internal paths
    if (returnTo.startsWith("http")) {
      window.location.assign(returnTo);
    } else {
      navigate(returnTo, { replace: true });
    }
  }

  function handleRecovery() {
    alert(
      "Please contact your administrator to reset your 2FA.\n\n" +
      "Once reset, you'll be prompted to set up a new authenticator on your next login."
    );
  }

  if (mode === "loading") {
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

      {mode === "setup" ? (
        <TwoFactorSetup onSetupComplete={handleComplete} />
      ) : (
        <TwoFactorVerify
          onVerifyComplete={handleComplete}
          onRecovery={handleRecovery}
        />
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
        Two-factor authentication protects your account across all Amineva products.
      </p>
    </div>
  );
}
