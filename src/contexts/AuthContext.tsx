import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Models, OAuthProvider, AuthenticationFactor } from "appwrite";
import { account } from "@/lib/appwrite";
import { User, AuthContextType, MfaState } from "@/types/auth";
import { setLast2FAVerifiedAt, clearLast2FAVerified, is2FARecent } from "@/lib/stepUpAuth";
import {
  getSession as appwriteGetSession,
  login as appwriteLogin,
  register as appwriteRegister,
  logout as appwriteLogout,
  formatAuthError,
} from "@/lib/auth/appwriteAuth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isLovablePreview(): boolean {
  try {
    const host = window.location.hostname;
    return (
      host.includes("lovable.app") ||
      host.includes("lovableproject.com") ||
      host.includes("localhost") ||
      host.includes("127.0.0.1")
    );
  } catch {
    return false;
  }
}

function mapAppwriteUser(u: Models.User<Models.Preferences>): User {
  return {
    id: u.$id,
    email: u.email,
    name: u.name || u.email.split("@")[0],
    role: ((u.prefs as Record<string, unknown>)?.role ?? "customer") as User["role"],
    mfa: u.mfa,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaState, setMfaState] = useState<MfaState | null>(null);
  const preview = isLovablePreview();

  // Check if MFA is enabled for the account
  const checkMfaFactors = useCallback(async (): Promise<boolean> => {
    try {
      const factors = await account.listMFAFactors();
      return factors.totp === true;
    } catch {
      return false;
    }
  }, []);

  // Load session and check MFA status with step-up enforcement
  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        // HARD RULE: never call account.get() before confirming a session exists.
        const session = await appwriteGetSession();
        if (!active) return;

        if (!session) {
          setUser(null);
          setMfaState(null);
          return;
        }

        const u = await account.get();
        if (!active) return;
        setUser(mapAppwriteUser(u));

        // Check if MFA is enabled (safe now that session exists)
        const mfaEnabled = await checkMfaFactors();

        if (!mfaEnabled) {
          // User needs to set up MFA
          setMfaState({
            required: true,
            setupRequired: true,
          });
        } else {
          // MFA is set up - check if 2FA verification is recent (step-up)
          if (is2FARecent("default")) {
            setMfaState(null);
          } else {
            try {
              const challenge = await account.createMfaChallenge(
                AuthenticationFactor.Totp
              );
              setMfaState({
                required: true,
                challengeId: challenge.$id,
                setupRequired: false,
              });
            } catch (err) {
              console.error("Failed to create MFA challenge for step-up:", err);
              setMfaState({
                required: true,
                setupRequired: false,
              });
            }
          }
        }
      } catch {
        if (active) {
          setUser(null);
          setMfaState(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, [checkMfaFactors]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Deterministic login: create session -> confirm session -> then fetch user
      await appwriteLogin(email, password);
      const u = await account.get();
      setUser(mapAppwriteUser(u));

      // Check if user has MFA enabled
      // CRITICAL: Only assume setup required if we CONFIRM totp is false
      // If the check fails, we default to verification (not setup)
      let mfaEnabled: boolean | null = null; // null = unknown
      try {
        mfaEnabled = await checkMfaFactors();
      } catch (err) {
        console.warn("MFA factor check failed, will attempt verification:", err);
        // Don't assume - we'll try to create a challenge
      }
      
      if (mfaEnabled === false) {
        // CONFIRMED: User doesn't have MFA set up - needs to set it up
        setMfaState({
          required: true,
          setupRequired: true,
        });
      } else {
        // User has MFA OR check failed - try to create verification challenge
        // This handles both mfaEnabled === true AND mfaEnabled === null (unknown)
        try {
          const challenge = await account.createMfaChallenge(
            AuthenticationFactor.Totp
          );
          // Challenge created successfully - user has MFA, verify it
          setMfaState({
            required: true,
            challengeId: challenge.$id,
            setupRequired: false,
          });
        } catch (err: unknown) {
          // Challenge creation failed - check the error to determine next step
          const errorMsg = err instanceof Error ? err.message : String(err);
          const appwriteErr = err as { code?: number; type?: string };
          
          // Appwrite error codes:
          // 401 = not authenticated (session issue)
          // 400 "user_mfa_not_enabled" = no MFA factors set up
          if (appwriteErr.type === 'user_mfa_not_enabled' || 
              errorMsg.includes('MFA is not enabled') ||
              errorMsg.includes('not enabled')) {
            // Confirmed: User needs to set up MFA
            setMfaState({
              required: true,
              setupRequired: true,
            });
          } else {
            console.error("MFA challenge creation failed:", err);
            // Unknown error - still require MFA verification
            // The TwoFactorDialog will handle creating a new challenge
            setMfaState({
              required: true,
              setupRequired: false,
            });
          }
        }
      }
    } catch (err) {
      // Re-throw so AuthStep can display the error
      // Ensure UI can surface network/CORS + Appwrite status clearly
      throw new Error(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Deterministic register: create user -> create session -> confirm session
      await appwriteRegister(email, password);
      // Store default role
      await account.updatePrefs({ role: "customer" });
      // Verify session/user before completing
      const u = await account.get();
      setUser(mapAppwriteUser(u));
      
      // New users always need to set up MFA
      setMfaState({
        required: true,
        setupRequired: true,
      });
    } catch (err) {
      throw new Error(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin: AuthContextType["socialLogin"] = async (provider) => {
    // Build redirect URLs - ensure clean /suite path (no hash)
    const successUrl = `${window.location.origin}/suite`;
    const failureUrl = `${window.location.origin}/?oauth=failed`;

    const providerMap: Record<string, OAuthProvider> = {
      google: OAuthProvider.Google,
      microsoft: OAuthProvider.Microsoft,
      facebook: OAuthProvider.Facebook,
      github: OAuthProvider.Github,
    };

    const oauthProvider = providerMap[provider];
    if (!oauthProvider) return;

    // Redirects to provider; on callback, AuthProvider's loadSession() will run
    account.createOAuth2Session(oauthProvider, successUrl, failureUrl);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await appwriteLogout();
      setUser(null);
      setMfaState(null);
      clearLast2FAVerified(); // Clear step-up 2FA timestamp
    } finally {
      setIsLoading(false);
    }
  };

  // Called when user completes MFA setup
  const completeMfaSetup = useCallback(() => {
    setMfaState(null);
    setLast2FAVerifiedAt(); // Record step-up 2FA timestamp
  }, []);

  // Called when user completes MFA verification
  const completeMfaVerification = useCallback(() => {
    setMfaState(null);
    setLast2FAVerifiedAt(); // Record step-up 2FA timestamp
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      login,
      register,
      socialLogin,
      logout,
      isAuthenticated: !!user,
      mfaState,
      completeMfaSetup,
      completeMfaVerification,
      checkMfaFactors,
      ...(preview ? ({ isPreview: true } as Record<string, unknown>) : {}),
    }),
    [user, isLoading, preview, mfaState, completeMfaSetup, completeMfaVerification, checkMfaFactors]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
