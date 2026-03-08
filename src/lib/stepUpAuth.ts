/**
 * Legacy Step-Up Auth Stubs
 * 
 * These are no-op stubs kept to prevent import errors.
 * Email verification is now handled via ComsSystem.
 */

/** @deprecated No-op stub */
export function setLast2FAVerifiedAt(): void {}

/** @deprecated Always returns true */
export function is2FAVerifiedThisSession(): boolean {
  return true;
}

/** @deprecated No-op stub */
export function clearLast2FAVerified(): void {}
