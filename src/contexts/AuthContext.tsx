import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearLast2FAVerified } from "@/lib/stepUpAuth";
import { checkLoginDevice } from "@/lib/auth/loginAlert";
import { resetClientState } from "@/lib/auth/resetClientState";
import { useQueryClient } from "@tanstack/react-query";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  socialLogin: (provider: "google" | "apple") => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(supaUser: any): AuthUser | null {
  if (!supaUser) return null;
  return {
    id: supaUser.id,
    email: supaUser.email ?? "",
    name: supaUser.user_metadata?.name ?? supaUser.email,
    role: supaUser.user_metadata?.role ?? "user",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const authActionInProgress = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  // Reset all per-user caches whenever the active user.id changes
  // (sign-in, sign-out, account switch in same tab).
  const handleUserChange = useCallback(
    (nextUserId: string | null) => {
      if (lastUserIdRef.current !== nextUserId) {
        resetClientState(queryClient);
        lastUserIdRef.current = nextUserId;
      }
    },
    [queryClient]
  );

  useEffect(() => {
    // Listen for auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (authActionInProgress.current) return;
        const mapped = mapUser(session?.user ?? null);
        handleUserChange(mapped?.id ?? null);
        setUser(mapped);
        setIsAuthenticated(!!mapped);
        setIsLoading(false);

        // Trigger device check on sign-in events (non-blocking)
        if (event === "SIGNED_IN" && session?.user) {
          checkLoginDevice();
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (authActionInProgress.current) return;
      const mapped = mapUser(session?.user ?? null);
      handleUserChange(mapped?.id ?? null);
      setUser(mapped);
      setIsAuthenticated(!!mapped);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [handleUserChange]);

  const login = useCallback(async (email: string, password: string) => {
    authActionInProgress.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(mapUser(data.user));
      setIsAuthenticated(true);
      // Non-blocking device check
      checkLoginDevice();
    } finally {
      setIsLoading(false);
      authActionInProgress.current = false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    authActionInProgress.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback?returnTo=/`,
        },
      });
      if (error) throw error;

      // Auto-confirm is enabled, so session is available immediately
      if (data.session) {
        setUser(mapUser(data.session.user));
        setIsAuthenticated(true);

        // Send branded verification email via ComsSystem (non-blocking)
        supabase.functions
          .invoke("send-verification-email", {
            body: { origin: window.location.origin },
          })
          .catch((err) =>
            console.warn("[register] Verification email failed (non-blocking):", err)
          );
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
      authActionInProgress.current = false;
    }
  }, []);

  const socialLogin = useCallback(
    async (provider: "google" | "apple") => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback?returnTo=/suite` },
      });
      if (error) throw error;
    },
    []
  );

  const sendMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?returnTo=/suite`,
      },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      clearLast2FAVerified();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated, isLoading, login, register, socialLogin, sendMagicLink, logout }),
    [user, isAuthenticated, isLoading, login, register, socialLogin, sendMagicLink, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
