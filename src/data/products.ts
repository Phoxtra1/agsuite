import type { ProductData } from "@/types/product";

/**
 * Locked default products for Amineva Suite
 * This file is the single source of truth.
 */

const DEFAULT_PRODUCTS: ProductData[] = [
  {
    id: "hub",
    name: "Amineva Hub",
    status: "live",
    url: "https://hub.amineva.com",
    adminUrl: "https://hub.amineva.com/wp-admin",
    category: "Reports & Publications",
    order: 1,
  },
  {
    id: "agis",
    name: "AGIS",
    status: "live",
    url: "https://app.amineva.com",
    adminUrl: "https://app.amineva.com/admin",
    category: "Intelligence & Analytics",
    order: 2,
  },
  {
    id: "ops",
    name: "AminevaOps",
    status: "coming_soon",
    url: "",
    adminUrl: "",
    category: "Operations",
    order: 3,
  },
  {
    id: "agstock",
    name: "AGStock",
    status: "live",
    url: "https://stock.amineva.com",
    adminUrl: "https://stock.amineva.com/admin",
    category: "Sell & Manage Business",
    order: 4,
  },
  {
    id: "amniva",
    name: "Amniva",
    status: "offline",
    url: "https://www.amniva.io",
    adminUrl: "",
    category: "Identity & Verification",
    order: 5,
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
