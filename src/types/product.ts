import type { UserRole } from "./auth";

export type ProductStatus =
  | "live"
  | "restricted"
  | "offline"
  | "coming_soon";

export type ProductData = {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  status: ProductStatus;
  url?: string;
  adminUrl?: string;
  category?: string;
  order: number;
  isPublic?: boolean;
  isExternal?: boolean;
  allowedRoles?: UserRole[];
};

export interface Product extends ProductData {
  icon?: React.ReactNode;
}

export const STATUS_LABELS: Record<ProductStatus, string> = {
  live: "Live",
  restricted: "Restricted",
  offline: "Offline",
  coming_soon: "Coming Soon",
};

export const STATUS_COLORS: Record<ProductStatus, string> = {
  live: "bg-success text-success-foreground",
  restricted: "bg-warning text-warning-foreground",
  offline: "bg-muted text-muted-foreground",
  coming_soon: "bg-accent/20 text-accent-foreground",
};

export interface ProductCategory {
  id: string;
  name: string;
  order: number;
  products: string[];
}

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    id: "data-intelligence",
    name: "Data Intelligence",
    order: 1,
    products: ["agis"],
  },
  {
    id: "trend-forecasting",
    name: "Trend & Forecasting",
    order: 2,
    products: ["amniva"],
  },
  {
    id: "financial-operations",
    name: "Financial Operations",
    order: 3,
    products: ["aminevaops"],
  },
];
