import type { ProductData } from "@/types/product";

const DEFAULT_PRODUCTS: ProductData[] = [
  {
    id: "hub",
    name: "Amineva Hub",
    status: "live",
    url: "https://hub.amineva.com",
    order: 1,
  },
  {
    id: "agis",
    name: "AGIS",
    status: "live",
    url: "https://app.amineva.com",
    order: 2,
  },
  {
    id: "ops",
    name: "AminevaOps",
    status: "coming_soon",
    url: "",
    order: 3,
  },
  {
    id: "agstock",
    name: "AGStock",
    status: "live",
    url: "https://stock.amineva.com",
    order: 4,
  },
  {
    id: "amniva",
    name: "Amniva",
    status: "offline",
    url: "https://www.amniva.io",
    order: 5,
  },
];

const STORAGE_KEY = "amineva_products";

export function loadProducts(): ProductData[] {
  // If you had old products saved, wipe them once and replace with new defaults.
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    window.dispatchEvent(new Event("productsUpdated"));
    return DEFAULT_PRODUCTS;
  }

  try {
    const parsed = JSON.parse(stored) as ProductData[];

    // Detect legacy IDs and reset
    const legacyIds = new Set(["ag-main", "ag-hub", "ag-app", "ag-ops", "ag-stock"]);
    const hasLegacy = parsed.some((p) => legacyIds.has(p.id));

    // Detect missing required IDs and reset
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

export function saveProducts(products: ProductData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("productsUpdated"));
}
