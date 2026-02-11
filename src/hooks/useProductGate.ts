/**
 * Product Gate Hook (Simplified)
 * 
 * ALL products in Amineva Global Suite MUST use this hook to enforce:
 * 1. Suite account authentication
 * 2. 2FA verification before access
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { is2FAVerifiedThisSession } from '@/lib/stepUpAuth';

export type GateStatus = 'checking' | 'passed' | 'needs_login' | 'needs_2fa';

interface UseProductGateOptions {
  productKey: string;
  currentPath?: string;
  enabled?: boolean;
}

interface UseProductGateResult {
  status: GateStatus;
  redirectTo2FA: () => void;
  redirectToLogin: () => void;
}

export function useProductGate({
  productKey,
  currentPath,
  enabled = true,
}: UseProductGateOptions): UseProductGateResult {
  const { isAuthenticated, isLoading } = useAuth();
  const [status, setStatus] = useState<GateStatus>('checking');

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

    if (is2FAVerifiedThisSession()) {
      setStatus('passed');
    } else {
      setStatus('needs_2fa');
    }
  }, [isAuthenticated, isLoading, enabled]);

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

  return { status, redirectTo2FA, redirectToLogin };
}

function getSuiteOrigin(): string {
  const host = window.location.hostname;
  if (host.includes('lovable.app') || host.includes('localhost')) {
    return window.location.origin;
  }
  return 'https://suite.amineva.com';
}
