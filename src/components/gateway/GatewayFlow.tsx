import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProductSelectionStep } from "./ProductSelectionStep";
import { CountrySelectionStep } from "./CountrySelectionStep";
import { AuthStep } from "./AuthStep";

import {
  loadGatewayState,
  saveGatewayState,
  clearGatewayState,
  GatewayStep,
} from "@/suite/gateway/gatewayState";
import { fetchCategoryProducts } from "@/data/products";
import { getOrCreateProfile } from "@/lib/suiteProfile";
import { shouldRouteToSuite, getProductRedirectUrl } from "@/lib/productRouting";
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

export function GatewayFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<GatewayStep | "routing">("product_selection");
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const authRedirectParam = searchParams.get("authRedirect");

  // Store authRedirect on mount if provided via URL params
  useEffect(() => {
    if (authRedirectParam) {
      setAuthRedirect(authRedirectParam, searchParams.get("product") || undefined);
    }
  }, [authRedirectParam, searchParams]);

  // Load persisted state on mount — only run once
  useEffect(() => {
  if (initialized) return;

  const state = loadGatewayState();
  setSelectedProductKey(state.selectedProductKey);
  setSelectedCountryCode(state.selectedCountryCode);
  setSelectedCurrencyCode(state.selectedCurrencyCode);

  // AGStock always shows country step first
  if (state.selectedProductKey === "agstock") {
    setStep("country_selection");
    setInitialized(true);
    return;
  }

  if (state.selectedProductKey) {
    if (isAuthenticated) {
      // 2FA check removed - go straight to routing
      setStep("routing");
    } else {
      setStep("auth");
    }
  }

  setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialized, isAuthenticated]);

  const handleSelectProduct = (productKey: string) => {
    setSelectedProductKey(productKey);

    if (productKey === "agstock") {
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

    if (isAuthenticated) {
      // 2FA check removed - go straight to routing
      setStep("routing");
    } else {
      setStep("auth");
    }
  };

  const handleBackToProducts = () => {
    setStep("product_selection");
    setSelectedProductKey(null);
    setSelectedCountryCode(null);
    setSelectedCurrencyCode(null);
    clearGatewayState();
  };

  const handleBackFromAuth = () => {
    if (selectedProductKey === "agstock") {
      setStep("country_selection");
    } else {
      handleBackToProducts();
    }
  };

  const handleExploreLater = () => {
    setSelectedProductKey(null);
    setSelectedCountryCode(null);
    setSelectedCurrencyCode(null);
    clearGatewayState();

    if (isAuthenticated && is2FAVerifiedThisSession()) {
      setStep("routing");
    } else if (isAuthenticated) {
      navigateToVerify2FA(null);
    } else {
      setStep("auth");
    }
  };

  const handleCountrySelected = (countryCode: string, currencyCode?: string | null) => {
    setSelectedCountryCode(countryCode);
    setSelectedCurrencyCode(currencyCode ?? null);

    saveGatewayState({
      selectedProductKey,
      selectedCountryCode: countryCode,
      selectedCurrencyCode: currencyCode ?? null,
    });

    if (isAuthenticated && is2FAVerifiedThisSession()) {
      setStep("routing");
    } else if (isAuthenticated) {
      navigateToVerify2FA(selectedProductKey);
    } else {
      setStep("auth");
    }
  };

  // After auth success → navigate to 2FA verification
  const handleAuthSuccess = () => {
    navigateToVerify2FA(selectedProductKey);
  };

  // Route user to product (only called when authed + 2FA verified this session)
  const routeToProduct = useCallback(async () => {
    const products = await fetchCategoryProducts();

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
