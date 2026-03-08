/**
 * Client-side login rate limiter
 * 
 * Tracks failed attempts in sessionStorage and locks the form
 * after too many consecutive failures.
 */

const STORAGE_KEY = 'auth_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutes

interface AttemptData {
  count: number;
  lockedUntil: number | null;
}

function getData(): AttemptData {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function setData(data: AttemptData) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

/** Record a failed login attempt. Returns lockout info. */
export function recordFailedAttempt(): { locked: boolean; remainingMs: number } {
  const data = getData();
  data.count += 1;

  if (data.count >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    setData(data);
    return { locked: true, remainingMs: LOCKOUT_DURATION_MS };
  }

  setData(data);
  return { locked: false, remainingMs: 0 };
}

/** Check if currently locked out */
export function checkLockout(): { locked: boolean; remainingMs: number; attemptsLeft: number } {
  const data = getData();

  if (data.lockedUntil) {
    const remaining = data.lockedUntil - Date.now();
    if (remaining > 0) {
      return { locked: true, remainingMs: remaining, attemptsLeft: 0 };
    }
    // Lockout expired — reset
    clearAttempts();
    return { locked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  return {
    locked: false,
    remainingMs: 0,
    attemptsLeft: MAX_ATTEMPTS - data.count,
  };
}

/** Clear failed attempts (call on successful login) */
export function clearAttempts(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/** Format remaining lockout time as "X:XX" */
export function formatLockoutTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
