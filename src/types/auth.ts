export type UserRole = 'super_admin' | 'staff' | 'customer' | 'visitor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'microsoft' | 'facebook' | 'github') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  staff: 'Staff',
  customer: 'Customer',
  visitor: 'Visitor',
};

export const ROLE_PERMISSIONS = {
  super_admin: ['view_all', 'manage_products', 'manage_users', 'admin_access'],
  staff: ['view_restricted', 'view_public'],
  customer: ['view_restricted', 'view_public'],
  visitor: ['view_public'],
} as const;