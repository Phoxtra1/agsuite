/**
 * Step-Up Authentication (Recurring 2FA)
 * 
 * Tracks last 2FA verification time and enforces recency windows per product.
 */

// Security windows in milliseconds
export const STEP_UP_WINDOWS = {
  agstock: 5 * 60 * 1000,    // 5 minutes
  agis: 10 * 60 * 1000,      // 10 minutes
  hub: 10 * 60 * 1000,
  ops: 10 * 60 * 1000,
  amniva: 10 * 60 * 1000,
  default: 10 * 60 * 1000,
} as const;

// Rate limiting
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000; // 1 minute cooldown after max attempts

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const STORAGE_KEY = 'suite_last_2fa_verified';
const RATE_LIMIT_KEY = 'suite_2fa_rate_limit';

/**
 * Get last 2FA verification timestamp
 */
export function getLast2FAVerifiedAt(): number | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Set last 2FA verification timestamp (called after successful 2FA)
 */
export function setLast2FAVerifiedAt(timestamp?: number): void {
  try {
    const ts = timestamp ?? Date.now();
    sessionStorage.setItem(STORAGE_KEY, ts.toString());
  } catch {
    console.warn('Failed to store 2FA verification timestamp');
  }
}

/**
 * Clear 2FA verification (on logout)
 */
export function clearLast2FAVerified(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(RATE_LIMIT_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Check if 2FA is recent enough for a product
 */
export function is2FARecent(productKey?: string): boolean {
  const lastVerified = getLast2FAVerifiedAt();
  if (!lastVerified) return false;
  
  const window = STEP_UP_WINDOWS[productKey as keyof typeof STEP_UP_WINDOWS] ?? STEP_UP_WINDOWS.default;
  const elapsed = Date.now() - lastVerified;
  
  return elapsed < window;
}

/**
 * Get remaining time until 2FA expires (in seconds)
 */
export function get2FAExpiresIn(productKey?: string): number {
  const lastVerified = getLast2FAVerifiedAt();
  if (!lastVerified) return 0;
  
  const window = STEP_UP_WINDOWS[productKey as keyof typeof STEP_UP_WINDOWS] ?? STEP_UP_WINDOWS.default;
  const elapsed = Date.now() - lastVerified;
  const remaining = window - elapsed;
  
  return Math.max(0, Math.floor(remaining / 1000));
}

/**
 * Rate limiting helpers
 */
function getRateLimitState(): RateLimitState {
  try {
    const stored = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return { attempts: 0, lastAttempt: 0, lockedUntil: null };
}

function setRateLimitState(state: RateLimitState): void {
  try {
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

/**
 * Check if rate limited
 */
export function isRateLimited(): { limited: boolean; cooldownRemaining: number } {
  const state = getRateLimitState();
  
  if (state.lockedUntil) {
    const remaining = state.lockedUntil - Date.now();
    if (remaining > 0) {
      return { limited: true, cooldownRemaining: Math.ceil(remaining / 1000) };
    }
    // Cooldown expired, reset
    setRateLimitState({ attempts: 0, lastAttempt: 0, lockedUntil: null });
  }
  
  return { limited: false, cooldownRemaining: 0 };
}

/**
 * Record an OTP attempt
 */
export function recordOTPAttempt(success: boolean): void {
  if (success) {
    // Reset on success
    setRateLimitState({ attempts: 0, lastAttempt: Date.now(), lockedUntil: null });
    return;
  }
  
  const state = getRateLimitState();
  state.attempts += 1;
  state.lastAttempt = Date.now();
  
  if (state.attempts >= MAX_ATTEMPTS) {
    state.lockedUntil = Date.now() + COOLDOWN_MS;
  }
  
  setRateLimitState(state);
}

/**
 * Get attempts remaining before lockout
 */
export function getAttemptsRemaining(): number {
  const state = getRateLimitState();
  return Math.max(0, MAX_ATTEMPTS - state.attempts);
}
