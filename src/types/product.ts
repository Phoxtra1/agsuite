import { UserRole } from './auth';

export type ProductStatus = 'live' | 'restricted' | 'offline' | 'coming_soon';

// Base product data without icon (for storage)
export interface ProductData {
  id: string;
  name: string;
  shortName: string;
  description: string;
  url: string;
  status: ProductStatus;
  isPublic: boolean;
  allowedRoles: UserRole[];
  isExternal: boolean;
  order: number;
}

// Product with icon for display
export interface Product extends ProductData {
  icon: React.ReactNode;
}

// Alias for clarity
export type ProductWithIcon = Product;

export const STATUS_LABELS: Record<ProductStatus, string> = {
  live: 'Live',
  restricted: 'Restricted',
  offline: 'Offline',
  coming_soon: 'Coming Soon',
};

export const STATUS_COLORS: Record<ProductStatus, string> = {
  live: 'bg-success text-success-foreground',
  restricted: 'bg-warning text-warning-foreground',
  offline: 'bg-muted text-muted-foreground',
  coming_soon: 'bg-accent/20 text-accent-foreground',
};
