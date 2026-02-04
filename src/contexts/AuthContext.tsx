import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ID, Models, OAuthProvider, AuthenticationFactor } from "appwrite";
import { account } from "@/lib/appwrite";
import { User, AuthContextType, MfaState } from "@/types/auth";
import { setLast2FAVerifiedAt, clearLast2FAVerified } from "@/lib/stepUpAuth";

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

  // Load session and check MFA status
  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const u = await account.get();
        if (active) {
          setUser(mapAppwriteUser(u));
          
          // Check if MFA is enabled
          const mfaEnabled = await checkMfaFactors();
          
          if (!mfaEnabled) {
            // User needs to set up MFA
            setMfaState({
              required: true,
              setupRequired: true,
            });
          } else {
            // MFA is already set up and verified (session is valid)
            setMfaState(null);
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
      await account.createEmailPasswordSession(email.trim(), password);
      const u = await account.get();
      setUser(mapAppwriteUser(u));

      // Check if user has MFA enabled
      // Wrap in try-catch to prevent hanging on partial sessions
      let mfaEnabled = false;
      try {
        mfaEnabled = await checkMfaFactors();
      } catch (err) {
        console.warn("MFA factor check failed, assuming setup required:", err);
      }
      
      if (mfaEnabled) {
        // User has MFA - need to create challenge and verify
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
          console.error("MFA challenge creation failed:", err);
          // If challenge fails, user may need to re-setup MFA
          setMfaState({
            required: true,
            setupRequired: true,
          });
        }
      } else {
        // User doesn't have MFA - needs to set it up
        setMfaState({
          required: true,
          setupRequired: true,
        });
      }
    } catch (err) {
      // Re-throw so AuthStep can display the error
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Create REAL Appwrite user (shows in Auth → Users)
      await account.create(ID.unique(), email.trim(), password);
      // Then create session
      await account.createEmailPasswordSession(email.trim(), password);
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
      await account.deleteSession("current");
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
