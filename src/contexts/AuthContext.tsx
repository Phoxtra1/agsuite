import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

type AuthUser = any;

type AuthContextValue = {
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Common auth actions used across the app
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: "google" | "microsoft" | "facebook" | "github") => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ These are minimal safe stubs.
  // Replace internals with your Appwrite logic if you already have it elsewhere.
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: call your real auth service here
      // e.g. await account.createEmailPasswordSession(email, password);
      setUser({ email });
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: call your real auth service here
      // e.g. await account.create(ID.unique(), email, password);
      setUser({ email });
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const socialLogin = useCallback(
    async (provider: "google" | "microsoft" | "facebook" | "github") => {
      setIsLoading(true);
      try {
        // TODO: call your real OAuth flow here
        setUser({ provider });
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: call your real logout here
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