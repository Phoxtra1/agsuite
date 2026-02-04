/**
 * Product Gate Hook
 * 
 * CRITICAL SECURITY REQUIREMENT:
 * ==============================
 * ALL products in Amineva Global Suite MUST use this hook to enforce:
 * 1. Suite account authentication (no product-level login allowed)
 * 2. 2FA verification before access (recurring, time-limited)
 * 
 * NO PRODUCT MAY BYPASS THIS GATE.
 * Any product attempting to show content without passing the gate is a security violation.
 * 
 * Security Windows:
 * - AGStock: 5 minutes (high-security POS/inventory)
 * - All other products: 10 minutes
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { is2FARecent, get2FAExpiresIn, STEP_UP_WINDOWS, REGISTERED_PRODUCTS } from '@/lib/stepUpAuth';

export type GateStatus = 'checking' | 'passed' | 'needs_login' | 'needs_2fa';

interface UseProductGateOptions {
  /** Product key - must match a key in STEP_UP_WINDOWS */
  productKey: string;
  /** Current path for return redirect after auth */
  currentPath?: string;
  /** Enable/disable the gate (default: true) */
  enabled?: boolean;
}

interface UseProductGateResult {
  /** Current gate status */
  status: GateStatus;
  /** Seconds remaining until 2FA expires */
  expiresIn: number;
  /** Total window in seconds for this product */
  windowSeconds: number;
  /** Redirect to Suite 2FA verification */
  redirectTo2FA: () => void;
  /** Redirect to Suite login */
  redirectToLogin: () => void;
  /** Whether this product is registered in the security system */
  isRegisteredProduct: boolean;
}

/**
 * REQUIRED Hook for ALL products to gate access with Suite auth + 2FA
 * 
 * Usage (MANDATORY for all product entry points):
 * ```tsx
 * function ProductDashboard() {
 *   const { status, redirectTo2FA, redirectToLogin } = useProductGate({
 *     productKey: 'agstock',
 *     currentPath: '/shop/dashboard'
 *   });
 * 
 *   useEffect(() => {
 *     if (status === 'needs_login') redirectToLogin();
 *     if (status === 'needs_2fa') redirectTo2FA();
 *   }, [status, redirectTo2FA, redirectToLogin]);
 * 
 *   if (status !== 'passed') {
 *     return <LoadingSpinner />; // MUST block content until passed
 *   }
 * 
 *   return <ActualDashboardContent />;
 * }
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
  const isRegisteredProduct = REGISTERED_PRODUCTS.includes(productKey as any);

  // Warn if product is not registered (security audit)
  useEffect(() => {
    if (!isRegisteredProduct && productKey !== 'default') {
      console.warn(
        `[SECURITY] Product "${productKey}" is not registered in STEP_UP_WINDOWS. ` +
        `Using default 10-minute window. Add it to src/lib/stepUpAuth.ts for explicit configuration.`
      );
    }
  }, [productKey, isRegisteredProduct]);

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
    isRegisteredProduct,
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
