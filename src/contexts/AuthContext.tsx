import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
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

  /**
   * Check MFA factors for the current user.
   * Returns true if TOTP is already set up & verified.
   * Does NOT create any challenge — that's Verify2FA's job.
   */
  const checkMfaFactors = useCallback(async (): Promise<boolean> => {
    try {
      const factors = await (account as any).listMfaFactors();
      const totpVerified = !!factors?.totp;

      if (!totpVerified) {
        // User hasn't set up TOTP yet → needs setup
        setMfaState({ required: true, setupRequired: true });
        return false;
      }

      // TOTP is set up. Check if step-up is recent.
      if (is2FARecent()) {
        setMfaState(null);
        return true;
      }

      // TOTP set up but not recently verified → needs verification
      setMfaState({ required: true, setupRequired: false });
      return false;
    } catch (err: any) {
      // If the endpoint fails (e.g., MFA not enabled on project), treat as no MFA required
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

  /**
   * Load session on mount — determines initial auth state.
   */
  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const session = await getSession();
        if (cancelled) return;

        if (!session) {
          setUser(null);
          setIsAuthenticated(false);
          setMfaState(null);
          setIsLoading(false);
          return;
        }

        // Session exists — get user
        const currentUser = await account.get();
        if (cancelled) return;

        setUser(currentUser);
        setIsAuthenticated(true);

        // Check MFA (no challenge creation!)
        await checkMfaFactors();
      } catch {
        if (cancelled) return;
        setUser(null);
        setIsAuthenticated(false);
        setMfaState(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [checkMfaFactors]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        await appwriteLogin(email, password);
        const currentUser = await account.get();
        setUser(currentUser);
        setIsAuthenticated(true);
        await checkMfaFactors();
      } finally {
        setIsLoading(false);
      }
    },
    [checkMfaFactors]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        await appwriteRegister(email, password);
        const currentUser = await account.get();
        setUser(currentUser);
        setIsAuthenticated(true);
        // New user → always needs MFA setup
        setMfaState({ required: true, setupRequired: true });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const socialLogin = useCallback(
    async (provider: "google" | "microsoft" | "facebook" | "github") => {
      // Appwrite OAuth creates a redirect flow
      const successUrl = `${window.location.origin}/suite`;
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
