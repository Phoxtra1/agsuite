import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { is2FARecent } from "@/lib/stepUpAuth";
import { ProductSelectionStep } from "./ProductSelectionStep";
import { CountrySelectionStep } from "./CountrySelectionStep";
import { AuthStep } from "./AuthStep";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { TwoFactorDialog } from "@/components/auth/TwoFactorDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  loadGatewayState,
  saveGatewayState,
  clearGatewayState,
  GatewayStep,
} from "@/suite/gateway/gatewayState";
import { loadProducts } from "@/data/products";
import { getOrCreateProfile } from "@/lib/suiteProfile";
import { shouldRouteToSuite } from "@/lib/productRouting";
import { toast } from "@/components/ui/sonner";
import {
  setAuthRedirect,
  getAuthRedirect,
  clearAuthRedirect,
  getRedirectForRole,
  isEmployeeRole,
  getInviteContext,
} from "@/lib/auth/authRedirect";
import {
  sanitizeRedirectForRole,
  getDashboardForRole,
  detectCredentialMismatch,
  logSecurityEvent,
} from "@/lib/auth/roleGuard";

// Extended step type to include 2FA steps
type ExtendedGatewayStep = GatewayStep | "mfa_setup" | "mfa_verify" | "auth_processing";

export function GatewayFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    isAuthenticated,
    user,
    mfaState,
    completeMfaSetup,
    completeMfaVerification,
  } = useAuth();

  const [step, setStep] = useState<ExtendedGatewayStep>("product_selection");
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string | null>(null);

  // Track if initial load has been processed to prevent re-renders
  const [initialized, setInitialized] = useState(false);

  // Track if we're waiting for MFA state after auth success
  const [awaitingMfaState, setAwaitingMfaState] = useState(false);
  const [authSuccessAt, setAuthSuccessAt] = useState<number | null>(null);

  // Get authRedirect from URL params (for step-up re-auth scenarios)
  const authRedirectParam = searchParams.get("authRedirect");

  // Store authRedirect on mount if provided via URL params
  useEffect(() => {
    if (authRedirectParam) {
      setAuthRedirect(authRedirectParam, searchParams.get("product") || undefined);
    }
  }, [authRedirectParam, searchParams]);

  // Load persisted state on mount - only run once
  useEffect(() => {
    if (initialized) return;

    const state = loadGatewayState();
    setSelectedProductKey(state.selectedProductKey);
    setSelectedCountryCode(state.selectedCountryCode);
    setSelectedCurrencyCode(state.selectedCurrencyCode);

    // ✅ HARD RULE: AGStock ALWAYS shows country step before auth
    if (state.selectedProductKey === "agstock") {
      setStep("country_selection");
      setInitialized(true);
      return;
    }

    // Existing logic for other products
    if (state.selectedProductKey) {
      if (!isAuthenticated) {
        setStep("auth");
      } else {
        if (mfaState?.required) {
          if (mfaState.setupRequired) setStep("mfa_setup");
          else if (mfaState.challengeId) setStep("mfa_verify");
          else setStep("mfa_setup");
        } else {
          setStep("routing");
        }
      }
    }

    setInitialized(true);
  }, [initialized, isAuthenticated, mfaState]);

  const handleSelectProduct = (productKey: string) => {
    setSelectedProductKey(productKey);

    if (productKey === "agstock") {
      // ✅ Always ask country again for AGStock
      setSelectedCountryCode(null);
      setSelectedCurrencyCode(null);

      saveGatewayState({
        selectedProductKey: productKey,
        selectedCountryCode: null,
        selectedCurrencyCode: null,
      });

      setStep("country_selection");
      return;
    }

    saveGatewayState({ selectedProductKey: productKey });

    if (isAuthenticated && !mfaState?.required && is2FARecent(productKey)) {
      setStep("routing");
    } else {
      setStep("auth");
    }
  };

  // Handle back to product selection
  const handleBackToProducts = () => {
    setStep("product_selection");
    setSelectedProductKey(null);
    setSelectedCountryCode(null);
    setSelectedCurrencyCode(null);
    clearGatewayState();
  };

  // Handle back from auth (to country or products)
  const handleBackFromAuth = () => {
    if (selectedProductKey === "agstock") {
      setStep("country_selection");
    } else {
      handleBackToProducts();
    }
  };

  // ✅ Added: Handle "Explore Later"
  const handleExploreLater = () => {
    setSelectedProductKey(null);
    setSelectedCountryCode(null);
    setSelectedCurrencyCode(null);
    clearGatewayState();

    // If already authenticated and no MFA needed, we can route based on role rules
    if (isAuthenticated && !mfaState?.required) {
      setStep("routing");
    } else {
      setStep("auth");
    }
  };

  // ✅ Added: Handle country selection completion
  // Assumes CountrySelectionStep calls onContinue(countryCode, currencyCode?)
  const handleCountrySelected = (countryCode: string, currencyCode?: string | null) => {
    setSelectedCountryCode(countryCode);
    setSelectedCurrencyCode(currencyCode ?? null);

    saveGatewayState({
      selectedProductKey,
      selectedCountryCode: countryCode,
      selectedCurrencyCode: currencyCode ?? null,
    });

    if (isAuthenticated && !mfaState?.required && selectedProductKey && is2FARecent(selectedProductKey)) {
      setStep("routing");
    } else {
      setStep("auth");
    }
  };

  // Route user after auth AND 2FA
  const routeToProduct = useCallback(async () => {
    const products = loadProducts();

    // Create/update lightweight Suite profile (non-blocking)
    if (user?.id) {
      getOrCreateProfile(user.id).catch(() => {});
    }

    // SECURITY: Check for credential mismatch
    const storedAuth = getAuthRedirect();
    const inviteContext = getInviteContext();

    if (storedAuth?.role && user?.role) {
      const mismatch = detectCredentialMismatch(storedAuth.role, user.role);
      if (mismatch.severity === "critical") {
        logSecurityEvent("credential_mismatch", {
          storedRole: storedAuth.role,
          currentRole: user.role,
          product: selectedProductKey,
          action: "forcing_role_based_redirect",
        });
        clearAuthRedirect();
      }
    }

    // If no product selected ("Explore Later")
    if (!selectedProductKey) {
      clearGatewayState();
      clearAuthRedirect();

      // Only managers/super_admins go to Suite dashboard
      if (shouldRouteToSuite(user?.role)) {
        navigate("/suite", { replace: true });
      } else {
        setStep("product_selection");
        toast.info("Please select a product to continue");
      }
      return;
    }

    const product = products.find((p) => p.id === selectedProductKey);
    if (!product) {
      toast.error("Product not found");
      clearGatewayState();
      clearAuthRedirect();
      setStep("product_selection");
      return;
    }

    // Check product status
    if (product.status === "offline") {
      toast.error(`${product.name} is currently offline`);
      clearGatewayState();
      clearAuthRedirect();
      setStep("product_selection");
      return;
    }

    if (product.status === "coming_soon") {
      toast.info(`${product.name} is coming soon`);
      clearGatewayState();
      clearAuthRedirect();
      setStep("product_selection");
      return;
    }

    // 🔒 Step-up 2FA enforcement per product window
    if (!is2FARecent(selectedProductKey)) {
      const redirectUrl = getDashboardForRole(selectedProductKey, user?.role);
      setAuthRedirect(redirectUrl, selectedProductKey, user?.role, "step_up");
      setStep("mfa_verify");
      return;
    }

    // Clear gateway state before redirect
    clearGatewayState();

    // SECURITY: Get redirect URL with full validation
    let targetUrl: string;

    if (inviteContext && inviteContext.productKey === selectedProductKey) {
      targetUrl = getDashboardForRole(selectedProductKey, "employee");
      console.log("[GatewayFlow] Invite context detected, using employee dashboard:", targetUrl);
    } else if (isEmployeeRole(user?.role) || isEmployeeRole(storedAuth?.role)) {
      targetUrl = getDashboardForRole(selectedProductKey, user?.role || storedAuth?.role);
      console.log("[GatewayFlow] Employee role detected, using:", targetUrl);
    } else {
      targetUrl = getRedirectForRole(selectedProductKey, user?.role, authRedirectParam);
      targetUrl = sanitizeRedirectForRole(targetUrl, user?.role, selectedProductKey);
    }

    clearAuthRedirect();

    console.log("[GatewayFlow] Final redirect:", {
      targetUrl,
      userRole: user?.role,
      product: selectedProductKey,
    });

    if (targetUrl.startsWith("http")) {
      window.location.href = targetUrl;
    } else if (targetUrl.startsWith("/")) {
      navigate(targetUrl, { replace: true });
    } else if (product.url) {
      window.location.href = product.url;
    } else {
      if (shouldRouteToSuite(user?.role)) {
        navigate("/suite", { replace: true });
      } else {
        toast.error("Product URL not configured");
        setStep("product_selection");
      }
    }
  }, [selectedProductKey, navigate, user, authRedirectParam]);

  // Trigger routing when step changes to 'routing'
  useEffect(() => {
    if (step === "routing" && initialized) {
      routeToProduct();
    }
  }, [step, initialized, routeToProduct]);

  // Handle successful auth - signal that we're waiting for MFA state
  const handleAuthSuccess = () => {
    setAwaitingMfaState(true);
    setAuthSuccessAt(Date.now());
    setStep("auth_processing");
  };

  // Watch for MFA state changes after auth success
  useEffect(() => {
  if (!awaitingMfaState || !isAuthenticated) return;

  // If MFA is required, route to correct MFA step immediately
  if (mfaState?.required) {
    setAwaitingMfaState(false);
    if (mfaState.setupRequired) setStep("mfa_setup");
    else if (mfaState.challengeId) setStep("mfa_verify");
    else setStep("mfa_setup");
    return;
  }

  // If user exists but MFA state hasn't arrived yet, wait briefly (prevents skipping setup)
  const waitedMs = authSuccessAt ? Date.now() - authSuccessAt : 0;
  const graceMs = 1200;

  if (!mfaState && waitedMs < graceMs) {
    return; // keep waiting for MFA state
  }

  // After grace window, proceed only if we have user
  if (user) {
    setAwaitingMfaState(false);
    setStep("routing");
  }
}, [awaitingMfaState, isAuthenticated, mfaState, user, authSuccessAt]);
  
  // Handle 2FA setup complete
  const handleMfaSetupComplete = () => {
    completeMfaSetup();
    toast.success("Two-factor authentication enabled!");
    setStep("routing");
  };

  // Handle 2FA verification complete
  const handleMfaVerifyComplete = () => {
    completeMfaVerification();
    toast.success("Verification successful!");
    setStep("routing");
  };

  // Handle recovery request
  const handleMfaRecovery = () => {
    toast.info("Please contact an administrator to reset your 2FA.");
  };

  // Render current step
  switch (step) {
  case "product_selection":
    return (
      <ProductSelectionStep
        onSelectProduct={handleSelectProduct}
        onExploreLater={handleExploreLater}
      />
    );

  case "country_selection":
    return (
      <CountrySelectionStep
        onContinue={handleCountrySelected}
        onBack={handleBackToProducts}
      />
    );

  case "auth":
    return (
      <AuthStep
        selectedProductKey={selectedProductKey}
        onBack={handleBackFromAuth}
        onAuthSuccess={handleAuthSuccess}
      />
    );

  case "auth_processing":
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-accent/20 animate-pulse" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );

  case "mfa_setup":
    return (
      <div className="flex items-center justify-center py-8 px-4">
        <TwoFactorSetup onSetupComplete={handleMfaSetupComplete} />
      </div>
    );

  case "mfa_verify":
    return (
      <div className="flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TwoFactorDialog
              onVerifyComplete={handleMfaVerifyComplete}
              onEmailBackup={() => {
                toast.info("Email backup coming soon. Contact admin if needed.");
              }}
            />
          </CardContent>
        </Card>
      </div>
    );

  case "routing":
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-accent/20 animate-pulse" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );

  default:
    return null;
  }
}
