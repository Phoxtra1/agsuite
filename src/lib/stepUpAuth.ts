/**
 * Step-up authentication compatibility layer.
 *
 * Multi-factor verification is not yet implemented for the configured
 * identity provider. These compatibility exports deliberately fail closed:
 * callers must never treat an unimplemented verification check as success.
 */

/** @deprecated MFA verification is unavailable; do not mark a session verified. */
export function setLast2FAVerifiedAt(): void {
  // Intentionally unavailable until a real server-verified MFA flow exists.
}

/** @deprecated Fail closed until the identity provider confirms MFA. */
export function is2FAVerifiedThisSession(): boolean {
  return false;
}

/** Clear any legacy client-side marker. */
export function clearLast2FAVerified(): void {
  try {
    sessionStorage.removeItem("amineva_last_2fa_verified_at");
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}
