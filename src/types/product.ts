import { UserRole } from './auth';

export type ProductStatus = 'live' | 'restricted' | 'offline' | 'coming_soon';

// Base product data for storage
export type ProductData = {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  status: ProductStatus;
  url: string;
  adminUrl?: string;
  category?: string;
  order: number;
  isPublic?: boolean;
  isExternal?: boolean;
  allowedRoles?: UserRole[];
};

// Product with icon for display
export interface Product extends ProductData {
  icon?: React.ReactNode;
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

// Category structure for gateway flow
export interface ProductCategory {
  id: string;
  name: string;
  order: number;
  products: string[]; // product IDs
}

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 'sell-manage', name: 'Sell & Manage Business', order: 1, products: ['agstock'] },
  { id: 'data-intel', name: 'Data & Intelligence', order: 2, products: ['agis'] },
  { id: 'reports', name: 'Reports & Publications', order: 3, products: ['hub'] },
  { id: 'identity', name: 'Identity & Verification', order: 4, products: ['amniva'] },
  { id: 'operations', name: 'Service Operations', order: 5, products: ['ops'] },
];
