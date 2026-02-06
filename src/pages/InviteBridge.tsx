import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { InviteAuthForm } from '@/components/invite/InviteAuthForm';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { TwoFactorDialog } from '@/components/auth/TwoFactorDialog';
import { 
  validateInviteToken, 
  acceptInvite,
  type TokenValidationResult 
} from '@/lib/inviteTokenService';
import { setInviteContext, setAuthRedirect, clearAuthRedirect } from '@/lib/auth/authRedirect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import amvLogo from '@/assets/amv_global_logo.png';

type InviteProduct = 'agstock' | 'agis';
type BridgeStep = 'initializing' | 'validating_token' | 'auth' | 'mfa_setup' | 'mfa_verify' | 'accepting' | 'redirecting' | 'error';

// Default redirect destinations after invite acceptance
const DEFAULT_REDIRECTS: Record<InviteProduct, string> = {
  agstock: 'https://stock.amineva.com/employees',
  agis: 'https://app.amineva.com/team-register',
};

export default function InviteBridge() {
  const { product } = useParams<{ product: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    user,
    isAuthenticated, 
    isLoading: authLoading, 
    logout,
    mfaState, 
    completeMfaSetup, 
    completeMfaVerification 
  } = useAuth();
  
  const [step, setStep] = useState<BridgeStep>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenValidationResult | null>(null);
  const [sessionCleared, setSessionCleared] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);

  const productKey = product as InviteProduct;
  const token = searchParams.get('token');
  const authRedirect = searchParams.get('authRedirect');

  // Step 1: IMMEDIATELY reset auth context when token is present
  // This MUST happen before any other auth checks
  useEffect(() => {
    if (!token) return;
    if (sessionCleared) return;

    const clearSession = async () => {
      // Force logout if there's any existing session
      if (isAuthenticated && !authLoading) {
        console.info('[InviteBridge] Token detected, clearing existing session');
        try {
          await logout();
        } catch (err) {
          console.warn('[InviteBridge] Logout failed (may already be logged out):', err);
        }
      }
      setSessionCleared(true);
    };

    // Wait for auth to finish loading before clearing
    if (!authLoading) {
      clearSession();
    }
  }, [token, isAuthenticated, authLoading, logout, sessionCleared]);

  // Step 2: Validate the token after session is cleared
  useEffect(() => {
    if (!sessionCleared) return;
    if (step !== 'initializing') return;

    const validateToken = async () => {
      // Basic validation
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

      setStep('validating_token');

      // Validate token with product backend
      const result = await validateInviteToken(productKey, token);
      setTokenData(result);

      if (result.status === 'expired' || result.status === 'used') {
        setError('This invite link has expired or has already been used.');
        setStep('error');
        return;
      }

      if (result.status === 'invalid') {
        setError('This invite link is invalid.');
        setStep('error');
        return;
      }

      // SECURITY: Store invite context to ensure employee routing
      // This prevents credential swapping attacks
      setInviteContext({
        productKey,
        token,
        email: result.invitedEmail,
        roleHint: 'employee', // Invites are ALWAYS for employees
      });
      
      // Also set explicit auth redirect for safety
      const employeeDashboard = productKey === 'agstock' 
        ? 'https://stock.amineva.com/employees'
        : 'https://app.amineva.com/team';
      setAuthRedirect(employeeDashboard, productKey, 'employee', 'invite');

      // Token is valid - proceed to auth
      setStep('auth');
    };

    validateToken();
  }, [sessionCleared, step, productKey, token]);

  // Get final redirect URL
  const getFinalRedirectUrl = useCallback(() => {
    // Use authRedirect if provided, otherwise use default
    const baseUrl = authRedirect || DEFAULT_REDIRECTS[productKey];
    
    // Append token to the redirect URL for product-side validation
    const url = new URL(baseUrl);
    url.searchParams.set('token', token || '');
    return url.toString();
  }, [authRedirect, productKey, token]);

  // Handle successful auth - mark auth completed, let useEffect handle MFA routing
  const handleAuthSuccess = useCallback(() => {
    // Don't immediately route - set flag and let effect handle mfaState
    setAuthCompleted(true);
  }, []);

  // Effect: Route to MFA after auth completes and mfaState updates
  useEffect(() => {
    if (!authCompleted) return;
    if (!user) return; // Wait for user to be set
    if (step !== 'auth') return; // Only process from auth step

    // Now check MFA state (which should be updated by AuthContext)
    if (mfaState?.required) {
      if (mfaState.setupRequired) {
        setStep('mfa_setup');
      } else if (mfaState.challengeId) {
        setStep('mfa_verify');
      } else {
        // MFA required but no challenge - needs setup
        setStep('mfa_setup');
      }
    } else {
      // No MFA required - this should NOT happen for new accounts
      // But handle it as a fallback (proceed to accept)
      acceptAndRedirect();
    }
  }, [authCompleted, user, mfaState, step]);

  // Accept invite and redirect
  const acceptAndRedirect = useCallback(async () => {
    if (!user?.id || !token) {
      setError('Authentication error. Please try again.');
      setStep('error');
      return;
    }

    setStep('accepting');

    // Call accept-invite endpoint
    const result = await acceptInvite(productKey, user.id, token);
    
    if (!result.success) {
      console.warn('[InviteBridge] Accept invite warning:', result.error);
      // Continue anyway - product will validate on their end
    }

    // Success - redirect to product
    setStep('redirecting');
    
    // SECURITY: Always use employee dashboard for invite flows
    // This is the final security gate - ignore any stored redirects
    const employeeDashboard = productKey === 'agstock' 
      ? 'https://stock.amineva.com/employees'
      : 'https://app.amineva.com/team';
    
    // Append token to the redirect URL for product-side validation
    const url = new URL(employeeDashboard);
    url.searchParams.set('token', token);
    const redirectUrl = url.toString();
    
    console.info('[InviteBridge] Redirecting employee to:', redirectUrl);
    
    // Clear all stored auth state
    clearAuthRedirect();
    
    setTimeout(() => {
      window.location.assign(redirectUrl);
    }, 500);
  }, [user?.id, token, productKey]);

  // Handle 2FA setup complete
  const handleMfaSetupComplete = useCallback(async () => {
    completeMfaSetup();
    toast.success('Two-factor authentication enabled!');
    await acceptAndRedirect();
  }, [completeMfaSetup, acceptAndRedirect]);

  // Handle 2FA verification complete
  const handleMfaVerifyComplete = useCallback(async () => {
    completeMfaVerification();
    toast.success('Verification successful!');
    await acceptAndRedirect();
  }, [completeMfaVerification, acceptAndRedirect]);

  // Handle going back to main sign-in (abandoning invite)
  const handleBackToSignIn = () => {
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

        {/* Step: Initializing / Validating Token */}
        {(step === 'initializing' || step === 'validating_token') && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">
                {step === 'initializing' ? 'Preparing...' : 'Validating invite...'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step: Auth */}
        {step === 'auth' && (
          <InviteAuthForm
            productKey={productKey}
            productName={productName}
            prefillEmail={tokenData?.invitedEmail}
            onAuthSuccess={handleAuthSuccess}
            onBack={handleBackToSignIn}
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
          <Card className="border-border/50">
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
        )}

        {/* Step: Accepting */}
        {step === 'accepting' && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Accepting invite...</p>
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
                variant="default"
                className="w-full"
                onClick={handleBackToSignIn}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
