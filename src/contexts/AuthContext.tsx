import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { account } from "@/lib/appwrite";
import {
  getSession,
  login as appwriteLogin,
  register as appwriteRegister,
  logout as appwriteLogout,
} from "@/lib/auth";
import { clearLast2FAVerified } from "@/lib/stepUpAuth";

type AuthUser = any;

type AuthContextValue = {
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  socialLogin: (
    provider: "google" | "microsoft" | "facebook" | "github"
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent loadSession from resetting state after login/register
  const authActionInProgress = useRef(false);

  // Load session ONCE on mount
  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (authActionInProgress.current) return;

      try {
        const session = await getSession();
        if (cancelled || authActionInProgress.current) return;

        if (!session) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const currentUser = await account.get();
        if (cancelled || authActionInProgress.current) return;

        setUser(currentUser);
        setIsAuthenticated(true);
      } catch {
        if (cancelled || authActionInProgress.current) return;
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled && !authActionInProgress.current) setIsLoading(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    authActionInProgress.current = true;
    setIsLoading(true);
    try {
      await appwriteLogin(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
      authActionInProgress.current = false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    authActionInProgress.current = true;
    setIsLoading(true);
    try {
      await appwriteRegister(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
      authActionInProgress.current = false;
    }
  }, []);

  const socialLogin = useCallback(
    async (provider: "google" | "microsoft" | "facebook" | "github") => {
      const successUrl = `${window.location.origin}/auth/callback?returnTo=/suite`;
      const failureUrl = `${window.location.origin}/?auth=failed`;
      await (account as any).createOAuth2Session(provider, successUrl, failureUrl);
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await appwriteLogout();
      clearLast2FAVerified();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      socialLogin,
      logout,
    }),
    [user, isAuthenticated, isLoading, login, register, socialLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
