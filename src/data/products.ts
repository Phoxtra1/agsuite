import type { ProductData } from "@/types/product";

/**
 * Default products for Amineva Suite (seed only)
 * NOTE: Defaults should NOT force-restore deleted products.
 */

const DEFAULT_PRODUCTS: ProductData[] = [
  {
    id: "agstock",
    name: "AGStock",
    shortName: "Stock",
    description: "Inventory management and point-of-sale for businesses",
    status: "live",
    url: "https://stock.amineva.com",
    adminUrl: "https://stock.amineva.com/admin",
    category: "Inventory & Sales Management",
    order: 4,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff", "customer"],
  },
  {
    id: "agis",
    name: "AGIS",
    shortName: "AGIS",
    description: "Amineva Global Intelligence Service",
    status: "live",
    url: "https://app.amineva.com",
    adminUrl: "https://app.amineva.com/admin",
    category: "Data Intelligence",
    order: 2,
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
    url: "https://amniva.io",
    adminUrl: "https://amniva.io/admin",
    category: "Decision System",
    order: 5,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin"],
  },
  {
    id: "ops",
    name: "AminevaOps",
    shortName: "Ops",
    description: "Service operations management and workflow automation",
    status: "coming_soon",
    url: "https://ops.amineva.com",
    adminUrl: "https://ops.amineva.com/admin",
    category: "Service Operation",
    order: 3,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff"],
  },
];

const STORAGE_KEY = "amineva_products";

/**
 * Load products from localStorage.
 * - First run: seed defaults
 * - If corrupted / legacy schema: reset to defaults
 * - IMPORTANT: Do NOT force-restore "required" products (supports real deletes)
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
    const parsed = JSON.parse(stored);

    // Must be an array
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      window.dispatchEvent(new Event("productsUpdated"));
      return DEFAULT_PRODUCTS;
    }

    const products = parsed as ProductData[];

    // Detect old/legacy IDs (if present, reset to clean defaults)
    const legacyIds = new Set(["ag-main", "ag-hub", "ag-app", "ag-ops", "ag-stock", "hub"]);
    const hasLegacy = products.some((p) => legacyIds.has(String(p?.id || "")));

    if (hasLegacy) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      window.dispatchEvent(new Event("productsUpdated"));
      return DEFAULT_PRODUCTS;
    }

    // If user intentionally deleted everything, respect it
    // (return [] instead of restoring defaults)
    return products;
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
