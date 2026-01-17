import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- Local mock auth (frontend-only) ----
// NOTE: This is NOT real Appwrite OAuth. It exists so email/password + social buttons
// can be tested in preview without a backend.

const USERS_STORAGE_KEY = 'amineva_users';
const CURRENT_USER_KEY = 'amineva_user';

const INITIAL_USERS: Record<string, { password: string; user: User }> = {
  'admin@amineva.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@amineva.com',
      name: 'Super Admin',
      role: 'super_admin',
    },
  },
  'staff@amineva.com': {
    password: 'staff123',
    user: {
      id: '2',
      email: 'staff@amineva.com',
      name: 'Staff Member',
      role: 'staff',
    },
  },
  'customer@amineva.com': {
    password: 'customer123',
    user: {
      id: '3',
      email: 'customer@amineva.com',
      name: 'Customer User',
      role: 'customer',
    },
  },
};

function isLovablePreview() {
  try {
    const host = window.location.hostname;
    return host.includes('lovable.app') || host.includes('localhost') || host.includes('127.0.0.1');
  } catch {
    return false;
  }
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getStoredUsers(): Record<string, { password: string; user: User }> {
  const stored = safeParse<Record<string, { password: string; user: User }>>(localStorage.getItem(USERS_STORAGE_KEY));
  if (stored && Object.keys(stored).length > 0) return stored;

  // Seed once
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
  return { ...INITIAL_USERS };
}

function saveUsers(users: Record<string, { password: string; user: User }>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function nameFromEmail(email: string) {
  const local = email.split('@')[0] || 'User';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // IMPORTANT:
  // - Production (amineva.com): never auto-login.
  // - Lovable preview: auto-login as Super Admin so developer is never blocked.
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = safeParse<User>(localStorage.getItem(CURRENT_USER_KEY));
    if (storedUser) return storedUser;

    if (isLovablePreview()) {
      const defaultAdmin = getStoredUsers()['admin@amineva.com']?.user;
      if (defaultAdmin) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultAdmin));
        return defaultAdmin;
      }
    }

    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const key = email.toLowerCase();
    const record = users[key];

    if (!record || record.password !== password) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }

    setUser(record.user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(record.user));
    setIsLoading(false);
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const key = email.toLowerCase();

    if (users[key]) {
      setIsLoading(false);
      throw new Error('An account with this email already exists');
    }

    const newUser: User = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      email: key,
      name: nameFromEmail(key),
      role: 'customer',
    };

    users[key] = { password, user: newUser };
    saveUsers(users);

    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    setIsLoading(false);
  };

  const socialLogin: AuthContextType['socialLogin'] = async (provider) => {
    // Real OAuth requires Appwrite (or another backend) configuration.
    // For now: in Lovable preview we simulate a successful OAuth login.
    if (!isLovablePreview()) {
      throw new Error(`${provider.toUpperCase()} login is not configured yet.`);
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    const key = `${provider}_user@amineva.com`;
    const users = getStoredUsers();

    if (!users[key]) {
      users[key] = {
        password: '__oauth__',
        user: {
          id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
          email: key,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          role: 'customer',
        },
      };
      saveUsers(users);
    }

    setUser(users[key].user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[key].user));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);

    // Keep developer unblocked in preview by immediately restoring the dev session.
    if (isLovablePreview()) {
      const defaultAdmin = getStoredUsers()['admin@amineva.com']?.user;
      if (defaultAdmin) {
        setUser(defaultAdmin);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultAdmin));
      }
    }
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    login,
    register,
    socialLogin,
    logout,
    isAuthenticated: !!user,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

