/**
 * Simple 2FA session tracking
 * 
 * Tracks whether 2FA was completed in the current browser session.
 * sessionStorage clears on browser/tab close, enforcing "every new login/device" rule.
 */

const STORAGE_KEY = 'suite_2fa_verified_at';

/** Mark 2FA as completed for this session */
export function setLast2FAVerifiedAt(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

/** Check if 2FA was completed in this browser session */
export function is2FAVerifiedThisSession(): boolean {
  try {
    return !!sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

/** Clear 2FA status (called on logout) */
export function clearLast2FAVerified(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
