import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { is2FARecent } from '@/lib/stepUpAuth';
import { ProductSelectionStep } from './ProductSelectionStep';
import { CountrySelectionStep } from './CountrySelectionStep';
import { AuthStep } from './AuthStep';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { TwoFactorDialog } from '@/components/auth/TwoFactorDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadGatewayState, saveGatewayState, clearGatewayState, GatewayStep } from '@/suite/gateway/gatewayState';
import { loadProducts } from '@/data/products';
import { getOrCreateProfile } from '@/lib/suiteProfile';
import { shouldRouteToSuite } from '@/lib/productRouting';
import { toast } from '@/components/ui/sonner';
import {
  setAuthRedirect,
  getAuthRedirect,
  clearAuthRedirect,
  getRedirectForRole,
  isEmployeeRole,
  getInviteContext,
} from '@/lib/auth/authRedirect';
import { 
  sanitizeRedirectForRole, 
  getDashboardForRole,
  detectCredentialMismatch,
  logSecurityEvent 
} from '@/lib/auth/roleGuard';
// Extended step type to include 2FA steps
type ExtendedGatewayStep = GatewayStep | 'mfa_setup' | 'mfa_verify';

export function GatewayFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, mfaState, completeMfaSetup, completeMfaVerification } = useAuth();
  
  const [step, setStep] = useState<ExtendedGatewayStep>('product_selection');
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string | null>(null);

  // Track if initial load has been processed to prevent re-renders
  const [initialized, setInitialized] = useState(false);
  
  // Track if we're waiting for MFA state after auth success
  const [awaitingMfaState, setAwaitingMfaState] = useState(false);

  // Get authRedirect from URL params (for step-up re-auth scenarios)
  const authRedirectParam = searchParams.get('authRedirect');

  // Store authRedirect on mount if provided via URL params
  useEffect(() => {
    if (authRedirectParam) {
      // Store the redirect destination for use after 2FA
      setAuthRedirect(authRedirectParam, searchParams.get('product') || undefined);
    }
  }, [authRedirectParam, searchParams]);

  // Load persisted state on mount - only run once
  useEffect(() => {
    if (initialized) return;
    
    const state = loadGatewayState();
    setSelectedProductKey(state.selectedProductKey);
    setSelectedCountryCode(state.selectedCountryCode);
    setSelectedCurrencyCode(state.selectedCurrencyCode);
    
    // Resume from correct step
    if (state.selectedProductKey) {
      if (state.selectedProductKey === 'agstock' && !state.selectedCountryCode) {
        setStep('country_selection');
      } else if (!isAuthenticated) {
        setStep('auth');
      } else {
        // User is authenticated - check MFA state
        if (mfaState?.required) {
          if (mfaState.setupRequired) {
            setStep('mfa_setup');
          } else if (mfaState.challengeId) {
            setStep('mfa_verify');
          } else {
            setStep('mfa_setup');
          }
        } else {
          // No MFA required - proceed to routing
          setStep('routing');
        }
      }
    }
    
    setInitialized(true);
  }, [initialized, isAuthenticated, mfaState]);

  const handleSelectProduct = (productKey: string) => {
    setSelectedProductKey(productKey);
    saveGatewayState({ selectedProductKey: productKey });

    // AGStock requires country selection first
    if (productKey === 'agstock') {
      setStep('country_selection');
    } else {
      // Other products: if already authenticated and 2FA is still valid for that product,
      // route immediately; otherwise go through auth/step-up.
      if (isAuthenticated && !mfaState?.required && is2FARecent(productKey)) {
        setStep('routing');
      } else {
        setStep('auth');
      }
    }
  };

  // Handle "Explore Later" - go to auth without product selection
  // Only managers/super_admins will be routed to suite dashboard
  const handleExploreLater = () => {
    setSelectedProductKey(null);
    saveGatewayState({ selectedProductKey: null });
    setStep('auth');
  };

  // Handle country selection (AGStock only)
  const handleCountrySelected = (countryCode: string, currencyCode: string) => {
    setSelectedCountryCode(countryCode);
    setSelectedCurrencyCode(currencyCode);
    saveGatewayState({ 
      selectedCountryCode: countryCode, 
      selectedCurrencyCode: currencyCode 
    });
    setStep('auth');
  };

  // Handle back to product selection
  const handleBackToProducts = () => {
    setStep('product_selection');
    setSelectedProductKey(null);
    setSelectedCountryCode(null);
    setSelectedCurrencyCode(null);
    clearGatewayState();
  };

  // Handle back from auth (to country or products)
  const handleBackFromAuth = () => {
    if (selectedProductKey === 'agstock') {
      setStep('country_selection');
    } else {
      handleBackToProducts();
    }
  };

  // Route user after auth AND 2FA
  const routeToProduct = useCallback(async () => {
    const products = loadProducts();
    
    // Create/update lightweight Suite profile (non-blocking)
    if (user?.id) {
      getOrCreateProfile(user.id).catch(() => {
        // Profile failure should not block routing
      });
    }

    // SECURITY: Check for credential mismatch
    const storedAuth = getAuthRedirect();
    const inviteContext = getInviteContext();
    
    if (storedAuth?.role && user?.role) {
      const mismatch = detectCredentialMismatch(storedAuth.role, user.role);
      if (mismatch.severity === 'critical') {
        logSecurityEvent('credential_mismatch', {
          storedRole: storedAuth.role,
          currentRole: user.role,
          product: selectedProductKey,
          action: 'forcing_role_based_redirect',
        });
        // Clear compromised redirect data
        clearAuthRedirect();
      }
    }

    // If no product selected ("Explore Later")
    if (!selectedProductKey) {
      clearGatewayState();
      clearAuthRedirect();
      
      // Only managers/super_admins go to Suite dashboard
      if (shouldRouteToSuite(user?.role)) {
        navigate('/suite', { replace: true });
      } else {
        // Normal users stay on gateway - they must select a product
        setStep('product_selection');
        toast.info('Please select a product to continue');
      }
      return;
    }

    const product = products.find(p => p.id === selectedProductKey);
    if (!product) {
      toast.error('Product not found');
      clearGatewayState();
      clearAuthRedirect();
      setStep('product_selection');
      return;
    }

    // Check product status
    if (product.status === 'offline') {
      toast.error(`${product.name} is currently offline`);
      clearGatewayState();
      clearAuthRedirect();
      setStep('product_selection');
      return;
    }

    if (product.status === 'coming_soon') {
      toast.info(`${product.name} is coming soon`);
      clearGatewayState();
      clearAuthRedirect();
      setStep('product_selection');
      return;
    }

    // 🔒 Recurring (step-up) 2FA enforcement per product:
    // If the user's last 2FA verification is older than the product window,
    // block redirect and request a fresh authenticator code.
    if (!is2FARecent(selectedProductKey)) {
      // Store intended destination BEFORE going to 2FA
      // SECURITY: Use sanitized redirect based on actual user role
      const redirectUrl = getDashboardForRole(selectedProductKey, user?.role);
      setAuthRedirect(redirectUrl, selectedProductKey, user?.role, 'step_up');
      setStep('mfa_verify');
      return;
    }

    // Clear gateway state before redirect
    clearGatewayState();

    // SECURITY: Get redirect URL with full validation
    // Priority: invite context > stored redirect > role-based default
    let targetUrl: string;
    
    if (inviteContext && inviteContext.productKey === selectedProductKey) {
      // Invite flow - ALWAYS use employee dashboard
      targetUrl = getDashboardForRole(selectedProductKey, 'employee');
      console.log('[GatewayFlow] Invite context detected, using employee dashboard:', targetUrl);
    } else if (isEmployeeRole(user?.role) || isEmployeeRole(storedAuth?.role)) {
      // Employee role detected - force employee dashboard
      targetUrl = getDashboardForRole(selectedProductKey, user?.role || storedAuth?.role);
      console.log('[GatewayFlow] Employee role detected, using:', targetUrl);
    } else {
      // Normal flow - use role-based redirect with validation
      targetUrl = getRedirectForRole(
        selectedProductKey,
        user?.role,
        authRedirectParam
      );
      // Double-check: sanitize for safety
      targetUrl = sanitizeRedirectForRole(targetUrl, user?.role, selectedProductKey);
    }

    // Clear stored redirect after use
    clearAuthRedirect();
    
    console.log('[GatewayFlow] Final redirect:', { targetUrl, userRole: user?.role, product: selectedProductKey });
    
    if (targetUrl.startsWith('http')) {
      window.location.href = targetUrl;
    } else if (targetUrl.startsWith('/')) {
      navigate(targetUrl, { replace: true });
    } else if (product.url) {
      // Fallback to product URL for other products
      window.location.href = product.url;
    } else {
      // No URL defined - check if manager, else show error
      if (shouldRouteToSuite(user?.role)) {
        navigate('/suite', { replace: true });
      } else {
        toast.error('Product URL not configured');
        setStep('product_selection');
      }
    }
  }, [selectedProductKey, selectedCountryCode, selectedCurrencyCode, navigate, user, authRedirectParam]);

  // Trigger routing when step changes to 'routing'
  useEffect(() => {
    if (step === 'routing' && initialized) {
      routeToProduct();
    }
  }, [step, initialized, routeToProduct]);

  // Handle successful auth - signal that we're waiting for MFA state
  const handleAuthSuccess = () => {
    // After successful email/password auth, wait for mfaState to be set by AuthContext
    // The useEffect below will handle the actual step transition
    setAwaitingMfaState(true);
  };
  
  // Watch for MFA state changes after auth success
  useEffect(() => {
    if (!awaitingMfaState || !isAuthenticated) return;
    
    // MFA state has been set by AuthContext - now handle it
    if (mfaState?.required) {
      setAwaitingMfaState(false);
      if (mfaState.setupRequired) {
        setStep('mfa_setup');
      } else if (mfaState.challengeId) {
        setStep('mfa_verify');
      } else {
        // MFA required but no specific state - go to setup
        setStep('mfa_setup');
      }
    } else if (mfaState === null && user) {
      // MFA is not required (already verified recently) - proceed to routing
      setAwaitingMfaState(false);
      setStep('routing');
    }
  }, [awaitingMfaState, isAuthenticated, mfaState, user, routeToProduct]);

  // Handle 2FA setup complete
  const handleMfaSetupComplete = () => {
    completeMfaSetup();
    toast.success('Two-factor authentication enabled!');
    setStep('routing');
    routeToProduct();
  };

  // Handle 2FA verification complete
  const handleMfaVerifyComplete = () => {
    completeMfaVerification();
    toast.success('Verification successful!');
    setStep('routing');
    routeToProduct();
  };

  // Handle recovery request
  const handleMfaRecovery = () => {
    toast.info('Please contact an administrator to reset your 2FA.');
  };

  // Render current step
  switch (step) {
    case 'product_selection':
      return (
        <ProductSelectionStep
          onSelectProduct={handleSelectProduct}
          onExploreLater={handleExploreLater}
        />
      );
    
    case 'country_selection':
      return (
        <CountrySelectionStep
          onContinue={handleCountrySelected}
          onBack={handleBackToProducts}
        />
      );
    
    case 'auth':
      return (
        <AuthStep
          selectedProductKey={selectedProductKey}
          onBack={handleBackFromAuth}
          onAuthSuccess={handleAuthSuccess}
        />
      );
    
    case 'mfa_setup':
      return (
        <div className="flex items-center justify-center py-8 px-4">
          <TwoFactorSetup
            onSetupComplete={handleMfaSetupComplete}
          />
        </div>
      );
    
    case 'mfa_verify':
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
                  toast.info('Email backup coming soon. Contact admin if needed.');
                }}
              />
            </CardContent>
          </Card>
        </div>
      );
    
    case 'routing':
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
