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

  useEffect(() => {
    // Listen for auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (authActionInProgress.current) return;
        const mapped = mapUser(session?.user ?? null);
        setUser(mapped);
        setIsAuthenticated(!!mapped);
        setIsLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (authActionInProgress.current) return;
      const mapped = mapUser(session?.user ?? null);
      setUser(mapped);
      setIsAuthenticated(!!mapped);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    authActionInProgress.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(mapUser(data.user));
      setIsAuthenticated(true);
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

      if (!data.session) {
        setUser(null);
        setIsAuthenticated(false);
        throw new Error("Please verify your email before signing in.");
      }

      setUser(mapUser(data.session.user));
      setIsAuthenticated(true);
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
    () => ({ user, isAuthenticated, isLoading, login, register, socialLogin, logout }),
    [user, isAuthenticated, isLoading, login, register, socialLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
