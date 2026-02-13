import type { UserRole } from "./auth";

export type ProductStatus =
  | "live"
  | "restricted"
  | "offline"
  | "coming_soon";

/**
 * Base product data for storage & sync
 */
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

/**
 * Product with icon (UI layer)
 */
export interface Product extends ProductData {
  icon?: React.ReactNode;
}

/**
 * Status helpers
 */
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

/**
 * Category structure (Homepage + Suite shared)
 */
export interface ProductCategory {
  id: string;
  name: string;
  order: number;
  products: string[]; // product IDs
}

/**
 * ✅ FINAL categories (NO HUB)
 * Software / Web apps only
 */
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    id: "inventory",
    name: "Inventory & Sales Management",
    order: 1,
    products: ["agstock"],
  },
  {
    id: "data-intelligence",
    name: "Data Intelligence",
    order: 2,
    products: ["agis"],
  },
  {
    id: "trust-forecasting",
    name: "Trust & Forecasting",
    order: 3,
    products: ["amniva"],
  },
  {
    id: "service-operations",
    name: "Service Operations",
    order: 4,
    products: ["ops"],
  },
];
