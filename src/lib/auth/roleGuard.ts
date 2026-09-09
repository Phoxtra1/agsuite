/**
 * Role Guard - Strict Access Control
 * 
 * Ensures employees cannot access shop owner dashboards and vice versa.
 * This is a client-side security layer - the ultimate enforcement must
 * happen at the product backend level.
 * 
 * SECURITY PRINCIPLE: Defense in depth
 * - Suite validates roles before redirect
 * - Product validates roles on arrival
 * - Neither trusts the other completely
 */

// Define role categories with explicit typing
export type OwnerRole = 'owner' | 'super_admin' | 'manager' | 'customer';
export type EmployeeRole = 'staff' | 'salesperson' | 'accountant' | 'cashier' | 'inventory_clerk' | 'employee';
export type AllRoles = OwnerRole | EmployeeRole;

// Explicit lists for role categorization
const OWNER_ROLES: readonly string[] = ['owner', 'super_admin', 'manager', 'customer'];
const EMPLOYEE_ROLES: readonly string[] = ['staff', 'salesperson', 'accountant', 'cashier', 'inventory_clerk', 'employee'];

// Product-specific dashboard paths
const OWNER_PATHS: Record<string, string[]> = {
  agstock: ['/shop', '/dashboard', '/settings', '/billing'],
  agis: ['/dashboard', '/clients', '/projects', '/billing'],
  aminevaops: ['/dashboard', '/organizations', '/projects', '/billing'],
  amniva: ['/dashboard', '/teams', '/settings'],
};

const EMPLOYEE_PATHS: Record<string, string[]> = {
  agstock: ['/employees', '/pos', '/inventory', '/sales'],
  agis: ['/team', '/team-register', '/tasks', '/reports'],
  aminevaops: ['/team', '/tasks', '/reports'],
  amniva: ['/team', '/tasks'],
};

/**
 * Check if role is an owner/manager role (can access owner dashboards)
 */
export function isOwnerRole(role?: string | null): boolean {
  if (!role) return false;
  return OWNER_ROLES.includes(role.toLowerCase());
}

/**
 * Check if role is an employee role (must use employee dashboard)
 */
export function isEmployeeRole(role?: string | null): boolean {
  if (!role) return false;
  return EMPLOYEE_ROLES.includes(role.toLowerCase());
}

/**
 * Get the role category for a given role
 */
export function getRoleCategory(role?: string | null): 'owner' | 'employee' | 'unknown' {
  if (!role) return 'unknown';
  if (isOwnerRole(role)) return 'owner';
  if (isEmployeeRole(role)) return 'employee';
  return 'unknown';
}

/**
 * Validate if a redirect URL is allowed for a given role
 * CRITICAL: Prevents credential swapping attacks
 */
export function isRedirectAllowedForRole(
  redirectUrl: string,
  role?: string | null,
  product?: string
): { allowed: boolean; reason?: string } {
  if (!redirectUrl || !product) {
    return { allowed: true }; // Can't validate without context
  }

  try {
    const url = new URL(redirectUrl);
    const path = url.pathname.toLowerCase();

    const roleCategory = getRoleCategory(role);

    // Get blocked paths based on role
    if (roleCategory === 'employee') {
      // Employees CANNOT access owner paths
      const blockedPaths = OWNER_PATHS[product] || [];
      for (const blocked of blockedPaths) {
        if (path.startsWith(blocked)) {
          return {
            allowed: false,
            reason: `Employees cannot access ${blocked}. Redirecting to employee dashboard.`,
          };
        }
      }
    }

    if (roleCategory === 'owner') {
      // Owners CAN access employee paths (for management), but warn if unusual
      // This is intentionally permissive for owner roles
    }

    return { allowed: true };
  } catch {
    // Invalid URL - allow (will fail at redirect anyway)
    return { allowed: true };
  }
}

/**
 * Get the correct dashboard URL for a role
 * This is the canonical source of truth for role-based routing
 */
export function getDashboardForRole(product: string, role?: string | null): string {
  const roleCategory = getRoleCategory(role);

  switch (product) {
    case 'agstock':
      if (roleCategory === 'employee') {
        return 'https://stock.amineva.com/employees';
      }
      return 'https://stock.amineva.com/shop';

    case 'agis':
      if (roleCategory === 'employee') {
        return 'https://app.amineva.com/team';
      }
      return 'https://app.amineva.com/dashboard';

    case 'aminevaops':
      if (roleCategory === 'employee') {
        return 'https://ops.amineva.com/team';
      }
      return 'https://ops.amineva.com/dashboard';

    case 'amniva':
      if (roleCategory === 'employee') {
        return 'https://amniva.com/team';
      }
      return 'https://amniva.com/dashboard';

    case 'workspace':
      return '/workspace';

    case 'adesua':
      return 'https://as.amineva.com';

    case 'agroclimate':
      return 'https://agro.amineva.com';

    case 'datalens':
      return 'https://datalens.amineva.com';

    case 'abi':
      return 'https://abi.amineva.com';

    default:
      return '/workspace';
  }
}

/**
 * Sanitize a redirect URL for a given role
 * If the URL is not allowed, returns the correct dashboard instead
 */
export function sanitizeRedirectForRole(
  requestedUrl: string,
  role?: string | null,
  product?: string
): string {
  if (!product) return requestedUrl;

  const validation = isRedirectAllowedForRole(requestedUrl, role, product);
  
  if (!validation.allowed) {
    console.warn('[RoleGuard]', validation.reason);
    return getDashboardForRole(product, role);
  }

  return requestedUrl;
}

/**
 * Detect if credentials might have been swapped
 * (e.g., employee trying to use owner credentials or vice versa)
 * 
 * This checks if the stored auth context matches the current user context
 */
export function detectCredentialMismatch(
  storedRole?: string | null,
  currentRole?: string | null
): { mismatch: boolean; severity: 'none' | 'warning' | 'critical' } {
  if (!storedRole || !currentRole) {
    return { mismatch: false, severity: 'none' };
  }

  const storedCategory = getRoleCategory(storedRole);
  const currentCategory = getRoleCategory(currentRole);

  // Same category = no mismatch
  if (storedCategory === currentCategory) {
    return { mismatch: false, severity: 'none' };
  }

  // Cross-category access = CRITICAL security issue
  if (
    (storedCategory === 'employee' && currentCategory === 'owner') ||
    (storedCategory === 'owner' && currentCategory === 'employee')
  ) {
    return { mismatch: true, severity: 'critical' };
  }

  // Unknown role involved = warning
  return { mismatch: true, severity: 'warning' };
}

/**
 * Log security events for audit purposes
 */
export function logSecurityEvent(
  event: 'access_denied' | 'credential_mismatch' | 'role_validation_failed',
  details: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  console.warn(`[SECURITY:${event}]`, timestamp, details);
  
  // In production, this should send to a security logging service
  // For now, just log to console
}
