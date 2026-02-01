// Suite profile model for Appwrite database
export interface SuiteProfile {
  userId: string;
  primaryProduct: string;
  enabledProducts: string[];
  role: 'owner' | 'employee' | 'team' | 'client' | 'manager';
  countryCode?: string;
  currencyCode?: string;
  pinCreated?: boolean;
  onboardingComplete: boolean;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PROFILE: Partial<SuiteProfile> = {
  enabledProducts: [],
  role: 'client',
  pinCreated: false,
  onboardingComplete: false,
  isAdmin: false,
};
