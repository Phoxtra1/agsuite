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
    url: "https://agro.amineva.com",
    adminUrl: "https://agro.amineva.com/admin",
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
  // Only your existing category products; nothing extra
];

// ===== LOCAL STORAGE KEY =====
const STORAGE_KEY = "amineva_products";

// ===== LOAD PRODUCTS =====
export function loadProducts(): ProductData[] {
  const stored = localStorage.getItem(STORAGE_KEY);

  let products: ProductData[];

  if (!stored) {
    products = [...DEFAULT_PRODUCTS];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event("productsUpdated"));
  } else {
    try {
      const parsed = JSON.parse(stored);
      products = Array.isArray(parsed) ? parsed : [...DEFAULT_PRODUCTS];
    } catch {
      products = [...DEFAULT_PRODUCTS];
    }
  }

  // Ensure top/admin products exist in storage
  const adminIds = ["agis", "amniva", "phoxtra", "agroclimate", "aminevaops"];
  for (const adminId of adminIds) {
    if (!products.find((p) => p.id === adminId)) {
      const newProduct = DEFAULT_PRODUCTS.find((p) => p.id === adminId);
      if (newProduct) products.push(newProduct);
    }
  }

  // Ensure top/admin products always live (except coming_soon)
  for (const p of products) {
    if (["agis", "amniva", "phoxtra", "agroclimate"].includes(p.id)) p.status = "live";
    if (p.id === "aminevaops") {
      p.status = "coming_soon";
      p.url = "";
      p.adminUrl = "";
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("productsUpdated"));

  return products;
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
