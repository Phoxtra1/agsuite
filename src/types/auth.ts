export type UserRole = 'super_admin' | 'manager' | 'staff' | 'customer' | 'visitor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  mfa?: boolean; // Whether MFA is enabled for this user
}

export interface MfaState {
  required: boolean;
  challengeId?: string;
  setupRequired?: boolean; // True if user needs to set up MFA for the first time
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'microsoft' | 'facebook' | 'github') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  // MFA-related
  mfaState: MfaState | null;
  completeMfaSetup: () => void;
  completeMfaVerification: () => void;
  checkMfaFactors: () => Promise<boolean>;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  staff: 'Staff',
  customer: 'Customer',
  visitor: 'Visitor',
};

export const ROLE_PERMISSIONS = {
  super_admin: ['view_all', 'manage_products', 'manage_users', 'admin_access'],
  manager: ['view_all', 'manage_products', 'admin_access'],
  staff: ['view_restricted', 'view_public'],
  customer: ['view_restricted', 'view_public'],
  visitor: ['view_public'],
} as const;
