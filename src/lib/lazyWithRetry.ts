import { lazy, type ComponentType } from "react";

const RETRY_DELAYS_MS = [500, 1500];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Retry a failed lazy import without destroying the app's offline resources.
 *
 * A temporary weak-network failure is not proof that the service worker or
 * cached assets are stale. Keep the existing worker and caches intact so a
 * refresh during a poor connection can still use previously cached assets.
 * If all attempts fail, let React's route error boundary show its recovery UI
 * instead of leaving the root route blank or forcing a destructive reload.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        return await factory();
      } catch (error) {
        lastError = error;

        if (attempt < RETRY_DELAYS_MS.length) {
          await wait(RETRY_DELAYS_MS[attempt]);
        }
      }
    }

    throw lastError;
  });
}
