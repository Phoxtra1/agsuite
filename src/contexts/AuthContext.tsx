import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Client, Account, ID, Models, OAuthProvider } from "appwrite";
import { User, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isLovablePreview(): boolean {
  try {
    const host = window.location.hostname;
    return (
      host.includes("lovable.app") ||
      host.includes("localhost") ||
      host.includes("127.0.0.1")
    );
  } catch {
    return false;
  }
}

const APPWRITE_ENDPOINT =
  (import.meta as any)?.env?.VITE_APPWRITE_ENDPOINT ??
  "https://fra.cloud.appwrite.io/v1";

const APPWRITE_PROJECT_ID =
  (import.meta as any)?.env?.VITE_APPWRITE_PROJECT_ID ?? "";

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);

function mapAppwriteUser(u: Models.User<Models.Preferences>): User {
  return {
    id: u.$id,
    email: u.email,
    name: u.name || u.email.split("@")[0],
    role: ((u.prefs as any)?.role ?? "customer") as any,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const preview = isLovablePreview();

  useEffect(() => {
    let active = true;

    async function loadSession() {
      // ✅ IMPORTANT: Never leave the app stuck in loading state
      if (!APPWRITE_PROJECT_ID) {
        console.error("Appwrite Project ID is missing");
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const u = await account.get();
        if (active) setUser(mapAppwriteUser(u));
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!APPWRITE_PROJECT_ID) {
      throw new Error("Appwrite Project ID is missing");
    }

    setIsLoading(true);
    try {
      await account.createEmailPasswordSession(email.trim(), password);
      const u = await account.get();
      setUser(mapAppwriteUser(u));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    if (!APPWRITE_PROJECT_ID) {
      throw new Error("Appwrite Project ID is missing");
    }

    setIsLoading(true);
    try {
      // ✅ This creates a real Appwrite user (will show in Auth → Users)
      await account.create(ID.unique(), email.trim(), password);

      // ✅ Sign them in immediately
      await account.createEmailPasswordSession(email.trim(), password);

      // ✅ Optional: store default role in prefs
      await account.updatePrefs({ role: "customer" });

      const u = await account.get();
      setUser(mapAppwriteUser(u));
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin: AuthContextType["socialLogin"] = async (provider) => {
    if (!APPWRITE_PROJECT_ID) {
      throw new Error("Appwrite Project ID is missing");
    }

    const successUrl = `${window.location.origin}/suite`;
    const failureUrl = `${window.location.origin}/?oauth=failed`;

    // Map our provider strings to Appwrite's OAuthProvider enum
    const providerMap: Record<string, OAuthProvider> = {
      google: OAuthProvider.Google,
      microsoft: OAuthProvider.Microsoft,
      facebook: OAuthProvider.Facebook,
      github: OAuthProvider.Github,
    };

    const oauthProvider = providerMap[provider];
    if (oauthProvider) {
      account.createOAuth2Session(oauthProvider, successUrl, failureUrl);
    }
  };

  const logout = async () => {
    if (!APPWRITE_PROJECT_ID) {
      // If env is missing, just clear local state
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await account.deleteSession("current");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      login,
      register,
      socialLogin,
      logout,
      isAuthenticated: !!user,
      ...(preview ? ({ isPreview: true } as any) : {}),
    }),
    [user, isLoading, preview]
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
