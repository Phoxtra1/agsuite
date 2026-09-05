import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearSealSession, isSealAuthenticated } from "@/lib/sealAuth";
import { useAuth } from "@/contexts/AuthContext";

// Idle window: 35 minutes of true inactivity before sign-out.
// Admins/managers often monitor dashboards without touching the machine,
// so this must be generous — any mouse, keyboard, scroll, or touch resets it.
const IDLE_TIMEOUT_MS = 35 * 60 * 1000; // 35 minutes (2,100,000 ms)

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;

export function useIdleSignout() {
  const navigate = useNavigate();
  const { logout: signOut, isAuthenticated } = useAuth();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep live refs so the timer/activity handlers never act on stale state.
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSignout = useCallback(() => {
    timerRef.current = null;
    const wasSealAuth = isSealAuthenticated();
    clearSealSession();

    if (isAuthenticatedRef.current && signOutRef.current) {
      try {
        signOutRef.current();
      } catch {}
    }

    if (wasSealAuth || isAuthenticatedRef.current) {
      navigateRef.current("/", { replace: true });
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimer();
    // Only arm idle sign-out when there is an active session (Seal or account).
    if (isSealAuthenticated() || isAuthenticatedRef.current) {
      timerRef.current = setTimeout(handleSignout, IDLE_TIMEOUT_MS);
    }
  }, [clearTimer, handleSignout]);

  useEffect(() => {
    const onUserActivity = () => resetTimer();

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, onUserActivity, { passive: true })
    );
    resetTimer();

    return () => {
      clearTimer();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onUserActivity));
    };
  }, [resetTimer, clearTimer]);

  // Re-arm when auth state flips (e.g. fresh sign-in or sign-out elsewhere).
  useEffect(() => {
    if (isAuthenticated || isSealAuthenticated()) {
      resetTimer();
    } else {
      clearTimer();
    }
  }, [isAuthenticated, resetTimer, clearTimer]);
}
