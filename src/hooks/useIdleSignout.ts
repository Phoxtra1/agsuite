import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clearSealSession, isSealAuthenticated } from "@/lib/sealAuth";
import { useAuth } from "@/contexts/AuthContext";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)

export function useIdleSignout() {
  const navigate = useNavigate();
  const { logout: signOut, isAuthenticated } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSignout = () => {
    const wasSealAuth = isSealAuthenticated();
    clearSealSession();

    if (isAuthenticated && signOut) {
      try {
        signOut();
      } catch {}
    }

    if (wasSealAuth || isAuthenticated) {
      navigate("/", { replace: true });
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Only arm idle signout if user has active session (Seal or Supabase)
    if (isSealAuthenticated() || isAuthenticated) {
      timerRef.current = setTimeout(handleSignout, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

    const onUserActivity = () => {
      resetTimer();
    };

    events.forEach((evt) => window.addEventListener(evt, onUserActivity, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((evt) => window.removeEventListener(evt, onUserActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}
