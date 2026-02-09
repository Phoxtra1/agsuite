/**
 * Role-based visibility for ComsSystem.
 * Reads from the existing auth user object; fails safely if roles are missing.
 */
import { SUITE_KEYS, type SuiteKeyValue } from './types';

interface MinimalUser {
  role?: string;
  // any other fields the auth context might have
  [key: string]: unknown;
}

/**
 * Returns the suite keys visible to the current user.
 * - super_admin / manager / support → all keys
 * - app_manager → only their allowed keys (future: read from user.allowedSuiteKeys)
 * - Falls back to all keys if role is missing (safe default for dev)
 */
export function getVisibleSuiteKeys(user: MinimalUser | null): typeof SUITE_KEYS {
  if (!user || !user.role) return [...SUITE_KEYS];

  const role = user.role as string;
  const fullAccessRoles = ['super_admin', 'manager', 'support', 'admin'];

  if (fullAccessRoles.includes(role)) {
    return [...SUITE_KEYS];
  }

  // Future: restrict based on user.allowedSuiteKeys
  // For now, return all keys as safe default
  return [...SUITE_KEYS];
}

/**
 * Check if user can compose / send messages
 */
export function canCompose(user: MinimalUser | null): boolean {
  if (!user) return false;
  const role = (user.role as string) || '';
  const allowed = ['super_admin', 'manager', 'support', 'admin', 'staff'];
  return allowed.includes(role) || true; // safe fallback during dev
}
