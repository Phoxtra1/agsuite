import type { ProductData } from "@/types/product";

// ===== STORAGE KEYS =====
const ADMIN_STORAGE_KEY = "amineva_admin_products";
const CATEGORY_STORAGE_KEY = "amineva_category_products";

//
// ============================
// ADMIN PRODUCTS (LOCKED)
// ============================
//

const DEFAULT_ADMIN_PRODUCTS: ProductData[] = [
  {
    id: "agis",
    name: "AGIS",
    shortName: "AGIS",
    description: "Amineva Global Intelligence Service",
    status: "live",
    adminUrl: "https://app.amineva.com/admin",
    order: 1,
  },
  {
    id: "amniva",
    name: "Amniva",
    shortName: "Amniva",
    status: "live",
    adminUrl: "https://amniva.io/admin",
    order: 2,
  },
  {
    id: "phoxtra",
    name: "Phoxtra",
    shortName: "Phoxtra",
    status: "live",
    adminUrl: "https://phoxtra.com/admin",
    order: 3,
  },
  {
    id: "agroclimate",
    name: "AgroClimate",
    shortName: "AgroClimate",
    status: "live",
    adminUrl: "https://agro.amineva.com/admin",
    order: 4,
  },
];

//
// ============================
// HOMEPAGE CATEGORY PRODUCTS
// ============================
//

const DEFAULT_CATEGORY_PRODUCTS: ProductData[] = [
  {
    id: "agis",
    name: "AGIS",
    shortName: "AGIS",
    description: "Amineva Global Intelligence Service",
    status: "live",
    url: "https://app.amineva.com",
    order: 1,
  },
  {
    id: "amniva",
    name: "Amniva",
    shortName: "Amniva",
    description: "Market trends, verification & prediction",
    status: "live",
    url: "https://amniva.io",
    order: 2,
  },
  {
    id: "aminevaops",
    name: "AminevaOps",
    shortName: "Ops",
    description: "Scalable operational tools for teams",
    status: "coming_soon",
    url: "",
    order: 3,
  },
];

//
// ============================
// LOAD ADMIN PRODUCTS (LOCKED)
// ============================
//

export function loadAdminProducts(): ProductData[] {
  const stored = localStorage.getItem(ADMIN_STORAGE_KEY);

  if (!stored) {
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify(DEFAULT_ADMIN_PRODUCTS)
    );
    return DEFAULT_ADMIN_PRODUCTS;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_ADMIN_PRODUCTS;
  }
}

//
// ============================
// LOAD CATEGORY PRODUCTS (HARDENED)
// ============================
//

export function loadCategoryProducts(): ProductData[] {
  const stored = localStorage.getItem(CATEGORY_STORAGE_KEY);

  // First-time initialization
  if (!stored) {
    localStorage.setItem(
      CATEGORY_STORAGE_KEY,
      JSON.stringify(DEFAULT_CATEGORY_PRODUCTS)
    );
    return DEFAULT_CATEGORY_PRODUCTS;
  }

  try {
    return JSON.parse(stored) as ProductData[];
  } catch {
    return DEFAULT_CATEGORY_PRODUCTS;
  }
}

//
// ============================
// SAVE CATEGORY PRODUCTS (SAFE)
// ============================
//

export function saveCategoryProducts(products: ProductData[]) {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("categoryProductsUpdated"));
}

//
// ============================
// DELETE CATEGORY PRODUCT
// ============================
//

export function deleteCategoryProduct(id: string) {
  const products = loadCategoryProducts();

  const updated = products.filter((p) => p.id !== id);

  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("categoryProductsUpdated"));
}

//
// ============================
// OPTIONAL: MANUAL RESET (DEV TOOL)
// ============================
//

export function resetCategoryProductsToDefault() {
  localStorage.setItem(
    CATEGORY_STORAGE_KEY,
    JSON.stringify(DEFAULT_CATEGORY_PRODUCTS)
  );
  window.dispatchEvent(new Event("categoryProductsUpdated"));
}
