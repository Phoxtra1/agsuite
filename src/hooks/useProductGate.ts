/**
 * Product Gate Hook
 * 
 * Reusable hook for products to check authentication and 2FA recency.
 * Redirects to Suite login or 2FA verification as needed.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { is2FARecent, get2FAExpiresIn, STEP_UP_WINDOWS } from '@/lib/stepUpAuth';

export type GateStatus = 'checking' | 'passed' | 'needs_login' | 'needs_2fa';

interface UseProductGateOptions {
  productKey: string;
  currentPath?: string;
  enabled?: boolean;
}

interface UseProductGateResult {
  status: GateStatus;
  expiresIn: number;
  windowSeconds: number;
  redirectTo2FA: () => void;
  redirectToLogin: () => void;
}

/**
 * Hook for products to gate access with step-up 2FA
 * 
 * Usage:
 * ```tsx
 * const { status, redirectTo2FA, redirectToLogin } = useProductGate({
 *   productKey: 'agstock',
 *   currentPath: '/shop/dashboard'
 * });
 * 
 * useEffect(() => {
 *   if (status === 'needs_login') redirectToLogin();
 *   if (status === 'needs_2fa') redirectTo2FA();
 * }, [status]);
 * ```
 */
export function useProductGate({
  productKey,
  currentPath,
  enabled = true,
}: UseProductGateOptions): UseProductGateResult {
  const { isAuthenticated, isLoading } = useAuth();
  const [status, setStatus] = useState<GateStatus>('checking');
  const [expiresIn, setExpiresIn] = useState(0);

  const windowMs = STEP_UP_WINDOWS[productKey as keyof typeof STEP_UP_WINDOWS] ?? STEP_UP_WINDOWS.default;
  const windowSeconds = Math.floor(windowMs / 1000);

  useEffect(() => {
    if (!enabled) {
      setStatus('passed');
      return;
    }

    if (isLoading) {
      setStatus('checking');
      return;
    }

    if (!isAuthenticated) {
      setStatus('needs_login');
      return;
    }

    // User is authenticated, check 2FA recency
    if (is2FARecent(productKey)) {
      setStatus('passed');
      setExpiresIn(get2FAExpiresIn(productKey));
    } else {
      setStatus('needs_2fa');
      setExpiresIn(0);
    }
  }, [isAuthenticated, isLoading, productKey, enabled]);

  // Update expiry countdown
  useEffect(() => {
    if (status !== 'passed') return;

    const interval = setInterval(() => {
      const remaining = get2FAExpiresIn(productKey);
      setExpiresIn(remaining);
      
      if (remaining <= 0) {
        setStatus('needs_2fa');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, productKey]);

  const redirectTo2FA = () => {
    const returnTo = currentPath || window.location.pathname + window.location.search;
    const suiteOrigin = getSuiteOrigin();
    window.location.href = `${suiteOrigin}/auth/verify-2fa?returnTo=${encodeURIComponent(returnTo)}&product=${productKey}`;
  };

  const redirectToLogin = () => {
    const returnTo = currentPath || window.location.pathname + window.location.search;
    const suiteOrigin = getSuiteOrigin();
    window.location.href = `${suiteOrigin}/?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return {
    status,
    expiresIn,
    windowSeconds,
    redirectTo2FA,
    redirectToLogin,
  };
}

/**
 * Get Suite origin URL
 */
function getSuiteOrigin(): string {
  // In production, this would be the Suite domain
  // For now, use current origin if on Suite, else hardcode
  const host = window.location.hostname;
  if (host.includes('lovable.app') || host.includes('localhost')) {
    return window.location.origin;
  }
  return 'https://suite.amineva.com';
}

/**
 * Utility to check gate status without hook (for edge functions)
 */
export function checkProductGate(
  isAuthenticated: boolean,
  productKey: string
): { passed: boolean; reason?: 'not_authenticated' | '2fa_expired' } {
  if (!isAuthenticated) {
    return { passed: false, reason: 'not_authenticated' };
  }
  
  if (!is2FARecent(productKey)) {
    return { passed: false, reason: '2fa_expired' };
  }
  
  return { passed: true };
}
