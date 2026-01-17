import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Client, Account, ID, Models } from "appwrite";
import { User, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isLovablePreview() {
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

// ✅ Configure Appwrite here (use env if you have it; fallback to your known endpoint)
const APPWRITE_ENDPOINT =
  (import.meta as any)?.env?.VITE_APPWRITE_ENDPOINT ||
  "https://fra.cloud.appwrite.io/v1";

const APPWRITE_PROJECT_ID =
  (import.meta as any)?.env?.VITE_APPWRITE_PROJECT_ID ||
  ""; // <-- MUST be set correctly

const client = new Client().setEndpoint(APPWRITE_ENDPOINT);
if (APPWRITE_PROJECT_ID) client.setProject(APPWRITE_PROJECT_ID);
const account = new Account(client);

// Convert Appwrite user to your app User type
function mapAppwriteUser(u: Models.User<Models.Preferences>): User {
  // Role: if you store role in preferences later, read it; otherwise default.
  const role = (u.prefs as any)?.role || "customer";

  return {
    id: u.$id,
    email: u.email,
    name: u.name || u.email?.split("@")?.[0] || "User",
    role,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const preview = isLovablePreview();

  // On app load: check if there is an existing Appwrite session
  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        if (!APPWRITE_PROJECT_ID) {
          // If project ID is missing, auth cannot work properly.
          // Keep app running but show not authenticated.
          if (!cancelled) setUser(null);
          return;
        }

        const u = await account.get();
        if (!cancelled) setUser(mapAppwriteUser(u));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
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
    setIsLoading(true);
    try {
      // ✅ This is the missing part in your current code.
      // Without this, Appwrite will NOT list users.
      await account.create(ID.unique(), email.trim(), password);

      // Create a session right after register
      await account.createEmailPasswordSession(email.trim(), password);

      const u = await account.get();
      setUser(mapAppwriteUser(u));
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin: AuthContextType["socialLogin"] = async (provider) => {
    // ✅ provider must be lowercase: "google" | "microsoft" | "facebook" | "github"
    if (!APPWRITE_PROJECT_ID) {
      throw new Error("Appwrite Project ID is missing. Set VITE_APPWRITE_PROJECT_ID.");
    }

    const success = `${window.location.origin}/suite`;
    const failure = `${window.location.origin}/?oauth=failed`;

    // Appwrite handles the provider callback internally;
    // you do NOT paste provider callback URLs in your code.
    account.createOAuth2Session(provider, success, failure);
  };

  const logout = async () => {
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

      // Optional flag you can use in your route guard:
      // allow /suite to be visible in preview even when not authenticated,
      // without faking users in localStorage.
      ...(preview ? ({ isPreview: true } as any) : {}),
    }),
    [user, isLoading, preview]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
