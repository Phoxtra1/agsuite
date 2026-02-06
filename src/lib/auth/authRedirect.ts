/**
 * Auth Redirect Storage
 * 
 * Stores and retrieves the intended redirect destination after authentication.
 * Used for:
 * - Employees returning to employee dashboard after 2FA step-up
 * - Users redirecting to specific product pages after auth
 * - Role-based routing after 2FA completion
 * 
 * SECURITY: This module enforces strict role separation.
 * Employees can NEVER be redirected to owner dashboards and vice versa.
 */

import { 
  isEmployeeRole as roleGuardIsEmployee, 
  isOwnerRole,
  sanitizeRedirectForRole,
  getDashboardForRole,
  detectCredentialMismatch,
  logSecurityEvent 
} from './roleGuard';

const AUTH_REDIRECT_KEY = 'suite_auth_redirect';
const USER_ROLE_KEY = 'suite_pending_user_role';
const INVITE_CONTEXT_KEY = 'suite_invite_context';

export interface AuthRedirectData {
  url: string;
  product?: string;
  role?: string;
  timestamp: number;
  source?: 'invite' | 'step_up' | 'direct';
}

export interface InviteContext {
  productKey: string;
  token: string;
  email?: string;
  roleHint?: string;
  timestamp: number;
}

/**
 * Store intended redirect destination at login start
 * SECURITY: Validates role-URL compatibility before storing
 */
export function setAuthRedirect(
  url: string, 
  product?: string, 
  role?: string,
  source: 'invite' | 'step_up' | 'direct' = 'direct'
): void {
  try {
    // CRITICAL: Sanitize URL for role before storing
    const sanitizedUrl = product 
      ? sanitizeRedirectForRole(url, role, product)
      : url;

    const data: AuthRedirectData = {
      url: sanitizedUrl,
      product,
      role,
      timestamp: Date.now(),
      source,
    };
    sessionStorage.setItem(AUTH_REDIRECT_KEY, JSON.stringify(data));
    console.log('[AuthRedirect] Stored:', { url: sanitizedUrl, product, role, source });
  } catch {
    console.warn('Failed to store auth redirect');
  }
}

/**
 * Get stored redirect destination
 * Returns null if expired (older than 30 minutes) or not set
 */
export function getAuthRedirect(): AuthRedirectData | null {
  try {
    const stored = sessionStorage.getItem(AUTH_REDIRECT_KEY);
    if (!stored) return null;

    const data: AuthRedirectData = JSON.parse(stored);
    
    // Expire after 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - data.timestamp > thirtyMinutes) {
      clearAuthRedirect();
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clear stored redirect after use
 */
export function clearAuthRedirect(): void {
  try {
    sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    sessionStorage.removeItem(INVITE_CONTEXT_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Store invite context for security validation
 */
export function setInviteContext(context: Omit<InviteContext, 'timestamp'>): void {
  try {
    const data: InviteContext = {
      ...context,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(INVITE_CONTEXT_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

/**
 * Get stored invite context
 */
export function getInviteContext(): InviteContext | null {
  try {
    const stored = sessionStorage.getItem(INVITE_CONTEXT_KEY);
    if (!stored) return null;
    
    const data: InviteContext = JSON.parse(stored);
    
    // Expire after 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - data.timestamp > thirtyMinutes) {
      sessionStorage.removeItem(INVITE_CONTEXT_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Store pending user role (for routing decisions before profile is loaded)
 */
export function setPendingUserRole(role: string): void {
  try {
    sessionStorage.setItem(USER_ROLE_KEY, role);
  } catch {
    // Ignore
  }
}

/**
 * Get pending user role
 */
export function getPendingUserRole(): string | null {
  try {
    return sessionStorage.getItem(USER_ROLE_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear pending user role
 */
export function clearPendingUserRole(): void {
  try {
    sessionStorage.removeItem(USER_ROLE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Employee role check - determines if user should go to employee dashboard
 * Re-exported from roleGuard for backwards compatibility
 */
export function isEmployeeRole(role?: string | null): boolean {
  return roleGuardIsEmployee(role);
}

/**
 * Get the correct redirect URL based on role and product
 * 
 * SECURITY PRIORITY:
 * 1. Validate invite context (highest security)
 * 2. Stored authRedirect with role validation
 * 3. Explicit authRedirectOverride with validation
 * 4. Role-based default routing (safest)
 */
export function getRedirectForRole(
  product: string,
  role?: string | null,
  authRedirectOverride?: string | null
): string {
  // Check for credential mismatch (security audit)
  const stored = getAuthRedirect();
  const inviteContext = getInviteContext();
  
  if (stored?.role && role) {
    const mismatch = detectCredentialMismatch(stored.role, role);
    if (mismatch.mismatch) {
      logSecurityEvent('credential_mismatch', {
        storedRole: stored.role,
        currentRole: role,
        severity: mismatch.severity,
        product,
      });
      
      if (mismatch.severity === 'critical') {
        // CRITICAL: Force correct dashboard, ignore stored redirect
        console.warn('[AuthRedirect] SECURITY: Credential mismatch detected, forcing role-based redirect');
        clearAuthRedirect();
        return getDashboardForRole(product, role);
      }
    }
  }

  // PRIORITY 1: Invite context takes precedence (employee invites)
  if (inviteContext && inviteContext.productKey === product) {
    // For invite flows, ALWAYS use the role-based dashboard
    // The invite implies employee role
    if (inviteContext.roleHint === 'employee' || roleGuardIsEmployee(role)) {
      return getDashboardForRole(product, 'employee');
    }
  }

  // PRIORITY 2: Check stored auth redirect with validation
  if (stored?.url) {
    // Validate the stored URL is appropriate for the current role
    const sanitized = sanitizeRedirectForRole(stored.url, role, product);
    if (sanitized !== stored.url) {
      console.warn('[AuthRedirect] Stored URL sanitized for role:', { original: stored.url, sanitized });
    }
    return sanitized;
  }

  // PRIORITY 3: Explicit authRedirect param with validation
  if (authRedirectOverride) {
    const sanitized = sanitizeRedirectForRole(authRedirectOverride, role, product);
    return sanitized;
  }

  // PRIORITY 4: Role-based default routing (most secure)
  return getDashboardForRole(product, role);
}
