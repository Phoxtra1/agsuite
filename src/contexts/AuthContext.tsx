import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { supabase } from "@/integrations/appwrite/client";
import { clearLast2FAVerified } from "@/lib/stepUpAuth";
import { checkLoginDevice } from "@/lib/auth/loginAlert";
import { resetClientState } from "@/lib/auth/resetClientState";
import { setWorkspaceUser } from "@/lib/workspace/scope";
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
  register: (email: string, password: string, name?: string, registeredProduct?: string) => Promise<{ user: any; session: any } | null>;
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
        // Bind every Workspace offline cache to the new account and drop
        // any cache that belongs to a different account on this device.
        setWorkspaceUser(nextUserId);
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
      // Force every sign-in to start from a clean session. This prevents a
      // previous account/app dashboard from being reused while credentials swap.
      resetClientState(queryClient);
      if (lastUserIdRef.current) {
        await supabase.auth.signOut();
        lastUserIdRef.current = null;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const mapped = mapUser(data.user);
      handleUserChange(mapped?.id ?? null);
      setUser(mapped);
      setIsAuthenticated(true);
      // Non-blocking device check
      checkLoginDevice();
    } finally {
      setIsLoading(false);
      authActionInProgress.current = false;
    }
  }, [handleUserChange, queryClient]);

  const register = useCallback(async (email: string, password: string, name?: string, registeredProduct?: string) => {
    authActionInProgress.current = true;
    setIsLoading(true);
    try {
      const redirectTarget = registeredProduct ? `/auth/verify-email?product=${registeredProduct}` : '/auth/verify-email';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name,
            registered_product: registeredProduct
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(redirectTarget)}`,
        },
      });
      if (error) throw error;

      if (data.session) {
        const mapped = mapUser(data.session.user);
        handleUserChange(mapped?.id ?? null);
        setUser(mapped);
        setIsAuthenticated(true);
      } else {
        handleUserChange(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      return data;
    } finally {
      setIsLoading(false);
      authActionInProgress.current = false;
    }
  }, [handleUserChange]);

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
    authActionInProgress.current = true;
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      clearLast2FAVerified();
      setUser(null);
      setIsAuthenticated(false);
      // Wipe all per-user caches so the next account starts cold.
      resetClientState(queryClient);
      setWorkspaceUser(null);
      lastUserIdRef.current = null;
    } finally {
      setIsLoading(false);
      authActionInProgress.current = false;
    }
  }, [queryClient]);

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
