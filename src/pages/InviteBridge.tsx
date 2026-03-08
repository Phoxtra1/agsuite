import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { InviteAuthForm } from '@/components/invite/InviteAuthForm';

import { 
  validateInviteToken, 
  acceptInvite,
  type TokenValidationResult 
} from '@/lib/inviteTokenService';
import { setInviteContext, setAuthRedirect, clearAuthRedirect } from '@/lib/auth/authRedirect';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import amvLogo from '@/assets/amv_global_logo.png';

type InviteProduct = 'agstock' | 'agis';
type BridgeStep = 'initializing' | 'validating_token' | 'auth' | 'accepting' | 'redirecting' | 'error';

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
  } = useAuth();
  
  const [step, setStep] = useState<BridgeStep>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenValidationResult | null>(null);
  const [sessionCleared, setSessionCleared] = useState(false);

  const productKey = product as InviteProduct;
  const token = searchParams.get('token');
  const authRedirect = searchParams.get('authRedirect');

  // Step 1: Reset auth context when token is present
  useEffect(() => {
    if (!token) return;
    if (sessionCleared) return;

    const clearSession = async () => {
      if (isAuthenticated && !authLoading) {
        console.info('[InviteBridge] Token detected, clearing existing session');
        try {
          await logout();
        } catch (err) {
          console.warn('[InviteBridge] Logout failed:', err);
        }
      }
      setSessionCleared(true);
    };

    if (!authLoading) {
      clearSession();
    }
  }, [token, isAuthenticated, authLoading, logout, sessionCleared]);

  // Step 2: Validate the token after session is cleared
  useEffect(() => {
    if (!sessionCleared) return;
    if (step !== 'initializing') return;

    const validateToken = async () => {
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

      setInviteContext({
        productKey,
        token,
        email: result.invitedEmail,
        roleHint: 'employee',
      });
      
      const employeeDashboard = productKey === 'agstock' 
        ? 'https://stock.amineva.com/employees'
        : 'https://app.amineva.com/team';
      setAuthRedirect(employeeDashboard, productKey, 'employee', 'invite');

      setStep('auth');
    };

    validateToken();
  }, [sessionCleared, step, productKey, token]);

  // Accept invite and redirect
  const acceptAndRedirect = useCallback(async () => {
    if (!user?.id || !token) {
      setError('Authentication error. Please try again.');
      setStep('error');
      return;
    }

    setStep('accepting');

    const result = await acceptInvite(productKey, user.id, token);
    
    if (!result.success) {
      console.warn('[InviteBridge] Accept invite warning:', result.error);
    }

    setStep('redirecting');
    
    const employeeDashboard = productKey === 'agstock' 
      ? 'https://stock.amineva.com/employees'
      : 'https://app.amineva.com/team';
    
    const url = new URL(employeeDashboard);
    url.searchParams.set('token', token);
    const redirectUrl = url.toString();
    
    console.info('[InviteBridge] Redirecting employee to:', redirectUrl);
    clearAuthRedirect();
    
    setTimeout(() => {
      window.location.assign(redirectUrl);
    }, 500);
  }, [user?.id, token, productKey]);

  // Handle auth success → navigate directly to product
  const handleAuthSuccess = useCallback(() => {
    const employeeDashboard = productKey === 'agstock' 
      ? 'https://stock.amineva.com/employees'
      : 'https://app.amineva.com/team';
    
    const returnUrl = new URL(employeeDashboard);
    returnUrl.searchParams.set('token', token || '');
    
    window.location.href = returnUrl.toString();
  }, [productKey, token]);

  const handleBackToSignIn = () => {
    navigate('/', { replace: true });
  };

  const productName = productKey === 'agstock' ? 'AGStock' : productKey === 'agis' ? 'AGIS' : 'Product';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
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

        {step === 'auth' && (
          <InviteAuthForm
            productKey={productKey}
            productName={productName}
            prefillEmail={tokenData?.invitedEmail}
            onAuthSuccess={handleAuthSuccess}
            onBack={handleBackToSignIn}
          />
        )}

        {step === 'accepting' && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Accepting invite...</p>
            </CardContent>
          </Card>
        )}

        {step === 'redirecting' && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Invite accepted!</p>
              <p className="text-muted-foreground text-sm">Redirecting to {productName}...</p>
            </CardContent>
          </Card>
        )}

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
