import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStep } from '@/components/gateway/AuthStep';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { TwoFactorVerify } from '@/components/auth/TwoFactorVerify';
import { 
  storeInviteIntent, 
  getInviteIntent, 
  clearInviteIntent,
  type InviteProduct 
} from '@/lib/inviteBridge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import amvLogo from '@/assets/amv_global_logo.png';

type BridgeStep = 'storing' | 'auth' | 'mfa_setup' | 'mfa_verify' | 'validating' | 'redirecting' | 'error';

export default function InviteBridge() {
  const { product } = useParams<{ product: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    mfaState, 
    completeMfaSetup, 
    completeMfaVerification 
  } = useAuth();
  
  const [step, setStep] = useState<BridgeStep>('storing');
  const [error, setError] = useState<string | null>(null);

  const productKey = product as InviteProduct;
  const token = searchParams.get('token');

  // Step 1: Store invite intent
  useEffect(() => {
    if (!productKey || !token) {
      setError('Invalid invite link. Missing product or token.');
      setStep('error');
      return;
    }

    if (productKey !== 'agstock' && productKey !== 'agis') {
      setError('Invalid product. Only AGStock and AGIS invites are supported.');
      setStep('error');
      return;
    }

    // Store intent for post-auth processing
    storeInviteIntent(productKey, token);
    
    // If already authenticated, check MFA then proceed
    if (isAuthenticated && !authLoading) {
      // Check if MFA is required
      if (mfaState?.required) {
        if (mfaState.setupRequired) {
          setStep('mfa_setup');
        } else if (mfaState.challengeId) {
          setStep('mfa_verify');
        } else {
          setStep('mfa_setup');
        }
      } else {
        setStep('validating');
      }
    } else {
      setStep('auth');
    }
  }, [productKey, token, isAuthenticated, authLoading, mfaState]);

  // Step 4: Route to product after auth + 2FA
  // Suite does NOT validate tokens - it only routes to the correct entry point
  // The receiving product (AGStock/AGIS) validates the token and handles roles
  useEffect(() => {
    if (step !== 'validating') return;

    const intent = getInviteIntent();
    if (!intent) {
      setError('Invite session expired. Please use the invite link again.');
      setStep('error');
      return;
    }

    // Direct routing based on product - Suite only routes, products validate
    const inviteRoutes: Record<InviteProduct, string> = {
      agstock: 'https://stock.amineva.com/employees', // Employee entry based on role
      agis: 'https://app.amineva.com/team-register', // Team registration entry
    };

    const redirectUrl = inviteRoutes[intent.productKey];
    
    if (!redirectUrl) {
      setError('Unable to determine redirect destination.');
      setStep('error');
      clearInviteIntent();
      return;
    }

    // Build redirect URL with token for product to validate.
    // Use URL API to avoid accidentally dropping/duplicating query params.
    const u = new URL(redirectUrl);
    u.searchParams.set('token', intent.token);
    const urlWithToken = u.toString();

    // Success - redirect to product with token
    setStep('redirecting');
    
    // Small delay for UX
    setTimeout(() => {
      // Keep intent until navigation is triggered to prevent losing token due to re-renders.
      // Clear immediately before leaving.
      clearInviteIntent();
      // Trace the exact redirect URL for debugging (no sensitive data besides the invite token).
      console.info('[InviteBridge] Redirecting to:', urlWithToken);
      window.location.assign(urlWithToken);
    }, 600);
  }, [step]);

  // Handle successful auth - check MFA
  const handleAuthSuccess = () => {
    // After successful email/password auth, check if 2FA is required
    if (mfaState?.required) {
      if (mfaState.setupRequired) {
        setStep('mfa_setup');
      } else if (mfaState.challengeId) {
        setStep('mfa_verify');
      } else {
        setStep('mfa_setup');
      }
    } else {
      setStep('validating');
    }
  };

  // Handle 2FA setup complete
  const handleMfaSetupComplete = () => {
    completeMfaSetup();
    toast.success('Two-factor authentication enabled!');
    setStep('validating');
  };

  // Handle 2FA verification complete
  const handleMfaVerifyComplete = () => {
    completeMfaVerification();
    toast.success('Verification successful!');
    setStep('validating');
  };

  // Handle recovery request
  const handleMfaRecovery = () => {
    toast.info('Please contact an administrator to reset your 2FA.');
  };

  // Handle back (cancel invite)
  const handleBack = () => {
    clearInviteIntent();
    navigate('/', { replace: true });
  };

  const productName = productKey === 'agstock' ? 'AGStock' : productKey === 'agis' ? 'AGIS' : 'Product';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={amvLogo} 
            alt="Amineva Global" 
            className="h-16 w-16 rounded-full mx-auto mb-4"
          />
          <h1 className="text-xl font-semibold text-foreground">
            {productName} Invite
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You've been invited to join {productName}
          </p>
        </div>

        {/* Step: Storing */}
        {step === 'storing' && (
          <Card className="border-border/50">
            <CardContent className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* Step: Auth */}
        {step === 'auth' && (
          <AuthStep
            selectedProductKey={productKey}
            onBack={handleBack}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {/* Step: MFA Setup */}
        {step === 'mfa_setup' && (
          <TwoFactorSetup
            onSetupComplete={handleMfaSetupComplete}
          />
        )}

        {/* Step: MFA Verify */}
        {step === 'mfa_verify' && (
          <TwoFactorVerify
            challengeId={mfaState?.challengeId || ''}
            onVerifyComplete={handleMfaVerifyComplete}
            onRecovery={handleMfaRecovery}
          />
        )}

        {/* Step: Validating */}
        {step === 'validating' && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Validating your invite...</p>
            </CardContent>
          </Card>
        )}

        {/* Step: Redirecting */}
        {step === 'redirecting' && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Invite accepted!</p>
              <p className="text-muted-foreground text-sm">Redirecting to {productName}...</p>
            </CardContent>
          </Card>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <Card className="border-border/50">
            <CardContent className="py-8 space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Gateway
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
