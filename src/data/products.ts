import type { ProductData } from "@/types/product";

/**
 * Locked default products for Amineva Suite
 * This file is the single source of truth.
 */

const DEFAULT_PRODUCTS: ProductData[] = [
  {
    id: "hub",
    name: "Amineva Hub",
    shortName: "Hub",
    description: "Reports, publications and research from Amineva Global",
    status: "live",
    url: "https://hub.amineva.com",
    adminUrl: "https://hub.amineva.com/wp-admin",
    category: "Reports & Publications",
    order: 1,
    isPublic: true,
    isExternal: true,
    allowedRoles: ["super_admin", "staff", "customer", "visitor"],
  },
  {
    id: "agis",
    name: "AGIS",
    shortName: "AGIS",
    description: "Intelligence and analytics platform for data-driven decisions",
    status: "live",
    url: "https://app.amineva.com",
    adminUrl: "https://app.amineva.com/admin",
    category: "Data & Intelligence",
    order: 2,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff", "customer"],
  },
  {
    id: "ops",
    name: "AminevaOps",
    shortName: "Ops",
    description: "Service operations management and workflow automation",
    status: "coming_soon",
    url: "https://ops.amineva.com",
    adminUrl: "https://ops.amineva.com/admin",
    category: "Service Operations",
    order: 3,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff"],
  },
  {
    id: "agstock",
    name: "AGStock",
    shortName: "Stock",
    description: "Inventory management and point-of-sale for businesses",
    status: "live",
    url: "https://stock.amineva.com",
    adminUrl: "https://stock.amineva.com/admin",
    category: "Sell & Manage Business",
    order: 4,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff", "customer"],
  },
  {
    id: "amniva",
    name: "Amniva",
    shortName: "Amniva",
    description: "Identity verification and authentication services",
    status: "offline",
    url: "https://www.amniva.io",
    adminUrl: "https://www.amniva.io/admin",
    category: "Identity & Verification",
    order: 5,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin"],
  },
];

const STORAGE_KEY = "amineva_products";

/**
 * Load products from localStorage.
 * If legacy or corrupted data is found, reset to defaults.
 */
export function loadProducts(): ProductData[] {
  const stored = localStorage.getItem(STORAGE_KEY);

  // First run → store defaults
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    window.dispatchEvent(new Event("productsUpdated"));
    return DEFAULT_PRODUCTS;
  }

  try {
    const parsed = JSON.parse(stored) as ProductData[];

    // Detect old/legacy IDs
    const legacyIds = new Set([
      "ag-main",
      "ag-hub",
      "ag-app",
      "ag-ops",
      "ag-stock",
    ]);

    const hasLegacy = parsed.some((p) => legacyIds.has(p.id));

    // Ensure required products exist
    const required = new Set(["hub", "agis", "agstock", "amniva", "ops"]);
    const hasRequired = parsed.some((p) => required.has(p.id));

    if (hasLegacy || !hasRequired) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      window.dispatchEvent(new Event("productsUpdated"));
      return DEFAULT_PRODUCTS;
    }

    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    window.dispatchEvent(new Event("productsUpdated"));
    return DEFAULT_PRODUCTS;
  }
}

/**
 * Persist products to storage
 */
export function saveProducts(products: ProductData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("productsUpdated"));
}

/**
 * Get default products (for reset)
 */
export function getDefaultProducts(): ProductData[] {
  return [...DEFAULT_PRODUCTS];
}
