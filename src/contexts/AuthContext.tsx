import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Client, Account, ID, Models } from "appwrite";
import { User, AuthContextType } from "@/types/auth";

/* ------------------------------------------------------------------ */
/* Context setup */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Appwrite configuration */
/* ------------------------------------------------------------------ */

const APPWRITE_ENDPOINT =
  (import.meta as any)?.env?.VITE_APPWRITE_ENDPOINT ??
  "https://fra.cloud.appwrite.io/v1";

const APPWRITE_PROJECT_ID =
  (import.meta as any)?.env?.VITE_APPWRITE_PROJECT_ID ?? "";

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);

/* ------------------------------------------------------------------ */
/* Mapping Appwrite user → App user */
/* ------------------------------------------------------------------ */

function mapAppwriteUser(
  u: Models.User<Models.Preferences>
): User {
  return {
    id: u.$id,
    email: u.email,
    name: u.name || u.email.split("@")[0],
    role: (u.prefs as any)?.role ?? "customer",
  };
}

/* ------------------------------------------------------------------ */
/* Provider */
/* ------------------------------------------------------------------ */

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const preview = isLovablePreview();

  /* -------------------------------------------------------------- */
  /* Load existing session on app start */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        if (!APPWRITE_PROJECT_ID) {
          console.error("Appwrite Project ID is missing");
          return;
        }

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

  /* -------------------------------------------------------------- */
  /* Login */
  /* -------------------------------------------------------------- */

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await account.createEmailPasswordSession(
        email.trim(),
        password
      );

      const u = await account.get();
      setUser(mapAppwriteUser(u));
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------------------------------------- */
  /* Register */
  /* -------------------------------------------------------------- */

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await account.create(
        ID.unique(),
        email.trim(),
        password
      );

      await account.createEmailPasswordSession(
        email.trim(),
        password
      );

      // Default role for new users
      await account.updatePrefs({ role: "customer" });

      const u = await account.get();
      setUser(mapAppwriteUser(u));
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------------------------------------- */
  /* Social login (OAuth) */
  /* -------------------------------------------------------------- */

  const socialLogin: AuthContextType["socialLogin"] = async (
    provider
  ) => {
    if (!APPWRITE_PROJECT_ID) {
      console.error("Appwrite Project ID is missing");
      return;
    }

    const successUrl = `${window.location.origin}/suite`;
    const failureUrl = `${window.location.origin}/?oauth=failed`;

    // Redirect handled by Appwrite
    account.createOAuth2Session(
      provider,
      successUrl,
      failureUrl
    );
  };

  /* -------------------------------------------------------------- */
  /* Logout */
  /* -------------------------------------------------------------- */

  const logout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession("current");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------------------------------------- */
  /* Context value */
  /* -------------------------------------------------------------- */

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      login,
      register,
      socialLogin,
      logout,
      isAuthenticated: !!user,

      // Preview flag for route guards (NO fake auth)
      ...(preview ? ({ isPreview: true } as any) : {}),
    }),
    [user, isLoading, preview]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Hook */
/* ------------------------------------------------------------------ */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
