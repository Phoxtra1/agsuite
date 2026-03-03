import type { ProductData } from "@/types/product";

const DEFAULT_PRODUCTS: ProductData[] = [
  {
    id: "agis",
    name: "AGIS",
    shortName: "AGIS",
    description: "Amineva Global Intelligence Service",
    status: "live",
    url: "https://app.amineva.com",
    adminUrl: "https://app.amineva.com/admin",
    category: "Data Intelligence",
    order: 1,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff", "customer"],
  },
  {
    id: "amniva",
    name: "Amniva",
    shortName: "Amniva",
    description: "Market trends, verification, and predictions",
    status: "offline",
    url: "https://amniva.io",
    adminUrl: "https://amniva.io/admin",
    category: "Trend & Forecasting",
    order: 2,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin"],
  },
  {
    id: "aminevaops",
    name: "AminevaOps",
    shortName: "Ops",
    description: "Internal operations, workflow automation & team management",
    status: "coming_soon",
    url: "https://ops.amineva.com",
    adminUrl: "https://ops.amineva.com/admin",
    category: "Service Workspace",
    order: 3,
    isPublic: false,
    isExternal: false,
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

    const legacyIds = new Set(["ag-main", "ag-hub", "ag-app", "ag-ops", "ag-stock", "hub", "ops", "agstock", "agroclimate"]);
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
