import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo - in production this would use Supabase/Appwrite
const MOCK_USERS: Record<string, { password: string; user: User }> = {
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

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Auto-login as Super Admin for development - keeps you logged in
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('amineva_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('amineva_user');
      }
    }
    // Default to Super Admin so you can see the UI
    const defaultAdmin = MOCK_USERS['admin@amineva.com'].user;
    localStorage.setItem('amineva_user', JSON.stringify(defaultAdmin));
    return defaultAdmin;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = MOCK_USERS[email.toLowerCase()];
    
    if (!mockUser || mockUser.password !== password) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
    
    setUser(mockUser.user);
    localStorage.setItem('amineva_user', JSON.stringify(mockUser.user));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('amineva_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
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
