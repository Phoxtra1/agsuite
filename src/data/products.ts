import type { ProductData } from "@/types/product";

// Helper to generate unique icons for admin products
function generateIcon(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-") + "-icon";
}

// ===== DEFAULT PRODUCTS =====
const DEFAULT_PRODUCTS: ProductData[] = [
  // ---- Top / Admin Products ----
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
    icon: generateIcon("AGIS"),
  },
  {
    id: "amniva",
    name: "Amniva",
    shortName: "Amniva",
    description: "Market trends, verification, and predictions",
    status: "live",
    url: "https://amniva.io",
    adminUrl: "https://amniva.io/admin",
    category: "Trend & Forecasting",
    order: 2,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin"],
    icon: generateIcon("Amniva"),
  },
  {
    id: "phoxtra",
    name: "Phoxtra",
    shortName: "Phoxtra",
    description: "Business identity and document verification",
    status: "live",
    url: "https://phoxtra.com/admin",
    adminUrl: "https://phoxtra.com/admin",
    category: "Service Workspace",
    order: 3,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff"],
    icon: generateIcon("Phoxtra"),
  },
  {
    id: "agroclimate",
    name: "AgroClimate",
    shortName: "AgroClimate",
    description: "Smart Farming and Agro-Production",
    status: "live",
    url: "https://agro.amineva.com/admin",
    adminUrl: "https://agro.amineva.com/admin",
    category: "Service Workspace",
    order: 4,
    isPublic: false,
    isExternal: true,
    allowedRoles: ["super_admin", "staff"],
    icon: generateIcon("AgroClimate"),
  },
  {
    id: "aminevaops",
    name: "AminevaOps",
    shortName: "Ops",
    description: "Internal operations, workflow automation & team management",
    status: "coming_soon",
    url: "",
    adminUrl: "",
    category: "Service Workspace",
    order: 5,
    isPublic: false,
    isExternal: false,
    allowedRoles: ["super_admin", "staff"],
    icon: generateIcon("AminevaOps"),
  },

  // ---- Category / Homepage Products ----
  // Keep only existing category products already in your system
];

// ===== LOCAL STORAGE KEY =====
const STORAGE_KEY = "amineva_products";

// ===== LOAD PRODUCTS =====
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

    // Ensure top/admin products remain live unless coming_soon
    const adminIds = ["agis", "amniva", "phoxtra", "agroclimate"];
    for (const p of products) {
      if (adminIds.includes(p.id)) p.status = "live";
    }

    // Ensure AminevaOps stays coming_soon without links
    const ops = products.find((p) => p.id === "aminevaops");
    if (ops) {
      ops.status = "coming_soon";
      ops.url = "";
      ops.adminUrl = "";
    }

    return products;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    window.dispatchEvent(new Event("productsUpdated"));
    return DEFAULT_PRODUCTS;
  }
}

// ===== SAVE PRODUCTS =====
export function saveProducts(products: ProductData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("productsUpdated"));
}

// ===== GET DEFAULT PRODUCTS =====
export function getDefaultProducts(): ProductData[] {
  return [...DEFAULT_PRODUCTS];
}
