import type { ProductData } from "@/types/product";

/**
 * Default products for Amineva Suite (seed only)
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
    category: "Data Intelligence",
    order: 1,
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
    description: "Market forecast, verification, predictions & social community",
    status: "offline",
    url: "https://amniva.io",
    adminUrl: "https://amniva.io/admin",
    category: "Trend & Forecasting",
    order: 3,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin"],
  },
  {
    id: "agroclimate",
    name: "AgroClimate",
    shortName: "Agro",
    description: "Smart farming with weather, AI assistant & agro alerts",
    status: "coming_soon",
    url: "https://agro.amineva.com",
    adminUrl: "https://agro.amineva.com/admin",
    category: "Smart Agriculture",
    order: 4,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff"],
  },
];

const STORAGE_KEY = "amineva_products";

export function loadProducts(): ProductData[] {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    window.dispatchEvent(new Event("productsUpdated"));
    return DEFAULT_PRODUCTS;
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      window.dispatchEvent(new Event("productsUpdated"));
      return DEFAULT_PRODUCTS;
    }

    const products = parsed as ProductData[];

    // Detect old/legacy IDs or removed products — reset
    const legacyIds = new Set(["ag-main", "ag-hub", "ag-app", "ag-ops", "ag-stock", "hub", "ops"]);
    const hasLegacy = products.some((p) => legacyIds.has(String(p?.id || "")));

    if (hasLegacy) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      window.dispatchEvent(new Event("productsUpdated"));
      return DEFAULT_PRODUCTS;
    }

    return products;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    window.dispatchEvent(new Event("productsUpdated"));
    return DEFAULT_PRODUCTS;
  }
}

export function saveProducts(products: ProductData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("productsUpdated"));
}

export function getDefaultProducts(): ProductData[] {
  return [...DEFAULT_PRODUCTS];
}
