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
import { is2FARecent } from "@/lib/stepUpAuth";

type AuthUser = any;

export type MfaState = {
  required: boolean;
  setupRequired?: boolean;
  challengeId?: string;
} | null;

type AuthContextValue = {
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaState: MfaState;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  socialLogin: (
    provider: "google" | "microsoft" | "facebook" | "github"
  ) => Promise<void>;
  logout: () => Promise<void>;

  completeMfaSetup: () => void;
  completeMfaVerification: () => void;
  checkMfaFactors: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaState, setMfaState] = useState<MfaState>(null);

  // Prevent loadSession from resetting state after login/register
  const authActionInProgress = useRef(false);

  const checkMfaFactors = useCallback(async (): Promise<boolean> => {
    try {
      const factors = await (account as any).listMfaFactors();
      const totpVerified = !!factors?.totp;

      if (!totpVerified) {
        setMfaState({ required: true, setupRequired: true });
        return false;
      }

      if (is2FARecent()) {
        setMfaState(null);
        return true;
      }

      setMfaState({ required: true, setupRequired: false });
      return false;
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (/mfa|not enabled|not configured|disabled/i.test(msg)) {
        setMfaState(null);
        return true;
      }
      console.warn("[AuthContext] checkMfaFactors error:", err);
      setMfaState(null);
      return true;
    }
  }, []);

  // Load session ONCE on mount
  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      // Don't reset state if login/register is in progress
      if (authActionInProgress.current) return;

      try {
        const session = await getSession();
        if (cancelled || authActionInProgress.current) return;

        if (!session) {
          setUser(null);
          setIsAuthenticated(false);
          setMfaState(null);
          setIsLoading(false);
          return;
        }

        const currentUser = await account.get();
        if (cancelled || authActionInProgress.current) return;

        setUser(currentUser);
        setIsAuthenticated(true);
        await checkMfaFactors();
      } catch {
        if (cancelled || authActionInProgress.current) return;
        setUser(null);
        setIsAuthenticated(false);
        setMfaState(null);
      } finally {
        if (!cancelled && !authActionInProgress.current) setIsLoading(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [checkMfaFactors]);

  const login = useCallback(
    async (email: string, password: string) => {
      authActionInProgress.current = true;
      setIsLoading(true);
      try {
        await appwriteLogin(email, password);
        const currentUser = await account.get();
        setUser(currentUser);
        setIsAuthenticated(true);
        await checkMfaFactors();
      } finally {
        setIsLoading(false);
        authActionInProgress.current = false;
      }
    },
    [checkMfaFactors]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      authActionInProgress.current = true;
      setIsLoading(true);
      try {
        await appwriteRegister(email, password);
        const currentUser = await account.get();
        setUser(currentUser);
        setIsAuthenticated(true);
        // New user → always needs MFA setup (QR code)
        setMfaState({ required: true, setupRequired: true });
      } finally {
        setIsLoading(false);
        authActionInProgress.current = false;
      }
    },
    []
  );

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
      setUser(null);
      setIsAuthenticated(false);
      setMfaState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeMfaSetup = useCallback(() => {
    setMfaState(null);
  }, []);

  const completeMfaVerification = useCallback(() => {
    setMfaState(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      mfaState,
      login,
      register,
      socialLogin,
      logout,
      completeMfaSetup,
      completeMfaVerification,
      checkMfaFactors,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      mfaState,
      login,
      register,
      socialLogin,
      logout,
      completeMfaSetup,
      completeMfaVerification,
      checkMfaFactors,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
