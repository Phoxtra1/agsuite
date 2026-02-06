/**
 * Auth Redirect Storage
 * 
 * Stores and retrieves the intended redirect destination after authentication.
 * Used for:
 * - Employees returning to employee dashboard after 2FA step-up
 * - Users redirecting to specific product pages after auth
 * - Role-based routing after 2FA completion
 */

const AUTH_REDIRECT_KEY = 'suite_auth_redirect';
const USER_ROLE_KEY = 'suite_pending_user_role';

export interface AuthRedirectData {
  url: string;
  product?: string;
  role?: string;
  timestamp: number;
}

/**
 * Store intended redirect destination at login start
 */
export function setAuthRedirect(url: string, product?: string, role?: string): void {
  try {
    const data: AuthRedirectData = {
      url,
      product,
      role,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(AUTH_REDIRECT_KEY, JSON.stringify(data));
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
  } catch {
    // Ignore
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
 * Employees include: salesperson, manager, accountant, cashier, etc.
 * NOT shop owners (they go to /shop)
 */
export function isEmployeeRole(role?: string | null): boolean {
  if (!role) return false;
  
  const employeeRoles = [
    'staff',
    'salesperson',
    'manager',
    'accountant',
    'cashier',
    'inventory_clerk',
    'employee',
  ];
  
  return employeeRoles.includes(role.toLowerCase());
}

/**
 * Get the correct redirect URL based on role and product
 * 
 * Priority order:
 * 1. Stored authRedirect (from invite flow or step-up re-auth)
 * 2. Explicit authRedirectOverride param
 * 3. Role-based default routing
 */
export function getRedirectForRole(
  product: string,
  role?: string | null,
  authRedirectOverride?: string | null
): string {
  // PRIORITY 1: Check stored auth redirect FIRST (critical for invite/step-up flows)
  const stored = getAuthRedirect();
  if (stored?.url) {
    // If stored redirect has a role, validate it matches the expected employee role
    // This prevents credential swapping attacks
    if (stored.role && isEmployeeRole(stored.role)) {
      // Employee stored - must use employee path
      return stored.url;
    }
    return stored.url;
  }

  // PRIORITY 2: Explicit authRedirect param
  if (authRedirectOverride) {
    return authRedirectOverride;
  }

  // PRIORITY 3: Role-based routing for AGStock
  if (product === 'agstock') {
    if (isEmployeeRole(role)) {
      return 'https://stock.amineva.com/employees';
    }
    // Shop owner (default)
    return 'https://stock.amineva.com/shop';
  }

  // Role-based routing for AGIS
  if (product === 'agis') {
    if (isEmployeeRole(role)) {
      return 'https://app.amineva.com/team';
    }
    return 'https://app.amineva.com/dashboard';
  }

  // Default fallback
  return '/suite';
}
