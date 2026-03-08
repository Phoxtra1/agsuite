/**
 * 2FA Session Tracking (DISABLED)
 * 
 * 2FA has been disabled. These functions are stubs that always pass.
 * This file is kept to prevent import errors in existing code.
 */

const STORAGE_KEY = 'suite_2fa_verified_at';

/** Mark 2FA as completed for this session (no-op) */
export function setLast2FAVerifiedAt(): void {
  // No-op: 2FA disabled
}

/** Check if 2FA was completed - always returns true (2FA disabled) */
export function is2FAVerifiedThisSession(): boolean {
  return true;
}

/** Clear 2FA status (no-op) */
export function clearLast2FAVerified(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
