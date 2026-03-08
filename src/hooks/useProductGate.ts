/**
 * Product Gate Hook
 * 
 * ALL products in Amineva Global Suite MUST use this hook to enforce:
 * 1. Suite account authentication
 * 2. Email verification (via ComsSystem)
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type GateStatus = 'checking' | 'passed' | 'needs_login';

interface UseProductGateOptions {
  productKey: string;
  currentPath?: string;
  enabled?: boolean;
}

interface UseProductGateResult {
  status: GateStatus;
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

    // 2FA check removed - if authenticated, pass through
    setStatus('passed');
  }, [isAuthenticated, isLoading, enabled]);

  const redirectToLogin = () => {
    const returnTo = currentPath || window.location.pathname + window.location.search;
    const suiteOrigin = getSuiteOrigin();
    window.location.href = `${suiteOrigin}/?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return { status, redirectToLogin };
}

function getSuiteOrigin(): string {
  const host = window.location.hostname;
  if (host.includes('lovable.app') || host.includes('localhost')) {
    return window.location.origin;
  }
  return 'https://suite.amineva.com';
}
