import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo - in production this would use Supabase
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('amineva_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('amineva_user');
      }
    }
    setIsLoading(false);
  }, []);

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