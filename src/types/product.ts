import { UserRole } from './auth';

export type ProductStatus = 'live' | 'restricted' | 'offline' | 'coming_soon';

export interface Product {
  id: string;
  name: string;
  shortName: string;
  description: string;
  url: string;
  status: ProductStatus;
  icon: React.ReactNode;
  isPublic: boolean;
  allowedRoles: UserRole[];
  isExternal: boolean;
  order: number;
}

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