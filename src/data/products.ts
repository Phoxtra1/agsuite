// src/data/products.ts
import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import type { ProductData } from "@/types/product";

const DB_ID = (import.meta as any).env?.VITE_DB_ID || "agsuite-db2";
const PRODUCTS_COLLECTION_ID = "products";

export const DEFAULT_ADMIN_PRODUCTS: ProductData[] = [
  {
    id: "agis",
    name: "AGIS Intelligence",
    shortName: "AGIS",
    description: "Enterprise spatial & data analytics portal",
    status: "live",
    adminUrl: "https://agis.amineva.com",
    order: 1,
    isPublic: true,
  },
  {
    id: "agstock",
    name: "AG Stock",
    shortName: "AG Stock",
    description: "Inventory & supply chain management engine",
    status: "live",
    adminUrl: "https://stock.amineva.com",
    order: 2,
    isPublic: true,
  },
  {
    id: "aminevaops",
    name: "Sikasɛm Financial Ops",
    shortName: "Sikasɛm",
    description: "Financial management and operational accounting",
    status: "live",
    adminUrl: "https://ops.amineva.com",
    order: 3,
    isPublic: true,
  },
  {
    id: "workspace",
    name: "Amineva Workspace",
    shortName: "Workspace",
    description: "Docs, Sheets, Slides, Forms, Drive collaboration",
    status: "live",
    adminUrl: "https://www.amineva.com/workspace",
    order: 4,
    isPublic: true,
  },
  {
    id: "agroclimate",
    name: "AgroClimate",
    shortName: "AgroClimate",
    description: "Agricultural climate intelligence & harvest telemetry",
    status: "live",
    adminUrl: "https://agro.amineva.com",
    order: 5,
    isPublic: true,
  },
  {
    id: "adesua",
    name: "Adesua Learning",
    shortName: "Adesua",
    description: "Education platform & scholarship portal",
    status: "live",
    adminUrl: "https://as.amineva.com",
    order: 6,
    isPublic: true,
  },
  {
    id: "datalens",
    name: "DataLens Intel",
    shortName: "DataLens",
    description: "Opportunity intelligence and automated outreach engine",
    status: "live",
    adminUrl: "https://datalens.amineva.com",
    order: 7,
    isPublic: true,
  },
];

export const DEFAULT_CATEGORY_PRODUCTS: ProductData[] = [
  {
    id: "agis",
    name: "AGIS Data Platform",
    shortName: "AGIS",
    description: "Real-time spatial data and analytics",
    status: "live",
    url: "https://agis.amineva.com",
    category: "data-intelligence",
    order: 1,
    isPublic: true,
  },
  {
    id: "datalens",
    name: "DataLens Intel",
    shortName: "DataLens",
    description: "Opportunity intelligence and automated outreach engine",
    status: "live",
    url: "https://datalens.amineva.com",
    category: "data-intelligence",
    order: 2,
    isPublic: true,
  },
  {
    id: "agroclimate",
    name: "AgroClimate Telemetry",
    shortName: "AgroClimate",
    description: "Agricultural climate intelligence & harvest telemetry",
    status: "live",
    url: "https://agro.amineva.com",
    category: "data-intelligence",
    order: 3,
    isPublic: true,
  },
  {
    id: "aminevaops",
    name: "Sikasɛm Financials",
    shortName: "Sikasɛm",
    description: "Unified enterprise financial operations",
    status: "live",
    url: "https://ops.amineva.com",
    category: "financial-operations",
    order: 4,
    isPublic: true,
  },
  {
    id: "amniva",
    name: "Amniva Intelligence",
    shortName: "Amniva",
    description: "Executive business intelligence suite",
    status: "live",
    url: "https://amniva.amineva.com",
    category: "business-intelligence",
    order: 5,
    isPublic: true,
  },
  {
    id: "workspace",
    name: "Workspace Platform",
    shortName: "Workspace",
    description: "Cloud office suite for team collaboration",
    status: "live",
    url: "https://www.amineva.com/workspace",
    category: "workspace",
    order: 6,
    isPublic: true,
  },
  {
    id: "adesua",
    name: "Adesua Learning",
    shortName: "Adesua",
    description: "Education platform & scholarship portal",
    status: "live",
    url: "https://as.amineva.com",
    category: "learning-inventory",
    order: 7,
    isPublic: true,
  },
  {
    id: "agstock",
    name: "Inventra Stock",
    shortName: "Inventra",
    description: "Inventory & supply chain management engine",
    status: "live",
    url: "https://stock.amineva.com",
    category: "learning-inventory",
    order: 8,
    isPublic: true,
  },
];

// Local cache keys
const LOCAL_ADMIN_KEY = "amineva_admin_products_v2";
const LOCAL_CATEGORY_KEY = "amineva_category_products_v2";

function readLocal(key: string, fallback: ProductData[]): ProductData[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, data: ProductData[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function docToProduct(doc: any): ProductData {
  return {
    id: doc.id || doc.$id,
    name: doc.name || "Unnamed Product",
    shortName: doc.short_name || doc.shortName || undefined,
    description: doc.description || undefined,
    status: (doc.status || "live") as ProductData["status"],
    url: doc.url || undefined,
    adminUrl: doc.admin_url || doc.adminUrl || undefined,
    category: doc.category || undefined,
    order: doc.sort_order ?? doc.order ?? 0,
    isPublic: doc.is_public ?? doc.isPublic ?? true,
    isExternal: doc.is_external ?? doc.isExternal ?? false,
  };
}

function productToDocPayload(p: ProductData, productType: "admin" | "category") {
  return {
    id: p.id,
    name: p.name,
    short_name: p.shortName || "",
    description: p.description || "",
    status: p.status || "coming_soon",
    url: p.url || "",
    admin_url: p.adminUrl || "",
    category: p.category || "",
    sort_order: p.order ?? 0,
    is_public: p.isPublic ?? true,
    is_external: p.isExternal ?? false,
    product_type: productType,
  };
}

// ===========================
// FETCH ADMIN PRODUCTS
// ===========================
export async function fetchAdminProducts(): Promise<ProductData[]> {
  const cached = readLocal(LOCAL_ADMIN_KEY, DEFAULT_ADMIN_PRODUCTS);

  try {
    let docs: any[] = [];
    try {
      const res = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("product_type", "admin"),
        Query.limit(100),
      ]);
      docs = res.documents;
    } catch {
      const res = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]);
      docs = res.documents.filter((d: any) => d.product_type === "admin" || !d.product_type);
    }

    if (docs.length === 0) {
      seedDefaults("admin", DEFAULT_ADMIN_PRODUCTS);
      return cached;
    }

    const fetched = docs.map(docToProduct);
    // Prioritize cached local items so admin local edits (like status: "offline", custom links) strictly override remote defaults
    const mergedMap = new Map<string, ProductData>();
    fetched.forEach((p) => mergedMap.set(p.id, p));
    cached.forEach((p) => mergedMap.set(p.id, p));
    const merged = Array.from(mergedMap.values());

    writeLocal(LOCAL_ADMIN_KEY, merged);
    return merged;
  } catch (error) {
    console.warn("[Appwrite Products] Using cached admin products due to fetch error:", error);
    return cached;
  }
}

// ===========================
// FETCH CATEGORY PRODUCTS
// ===========================
export async function fetchCategoryProducts(): Promise<ProductData[]> {
  const cached = readLocal(LOCAL_CATEGORY_KEY, DEFAULT_CATEGORY_PRODUCTS);

  try {
    let docs: any[] = [];
    try {
      const res = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("product_type", "category"),
        Query.limit(100),
      ]);
      docs = res.documents;
    } catch {
      const res = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]);
      docs = res.documents.filter((d: any) => d.product_type === "category");
    }

    if (docs.length === 0) {
      seedDefaults("category", DEFAULT_CATEGORY_PRODUCTS);
      return cached;
    }

    const fetched = docs.map(docToProduct);
    // Prioritize cached local items so admin local edits (like status: "offline", custom links) strictly override remote defaults
    const mergedMap = new Map<string, ProductData>();
    fetched.forEach((p) => mergedMap.set(p.id, p));
    cached.forEach((p) => mergedMap.set(p.id, p));
    const merged = Array.from(mergedMap.values());

    writeLocal(LOCAL_CATEGORY_KEY, merged);
    return merged;
  } catch (error) {
    console.warn("[Appwrite Products] Using cached category products due to fetch error:", error);
    return cached;
  }
}

// ===========================
// UPSERT PRODUCT
// ===========================
export async function upsertProduct(
  product: ProductData,
  productType: "admin" | "category"
): Promise<boolean> {
  const primaryCacheKey = productType === "admin" ? LOCAL_ADMIN_KEY : LOCAL_CATEGORY_KEY;
  const secondaryCacheKey = productType === "admin" ? LOCAL_CATEGORY_KEY : LOCAL_ADMIN_KEY;

  // 1. Update primary local cache immediately
  const primaryLocal = readLocal(primaryCacheKey, productType === "admin" ? DEFAULT_ADMIN_PRODUCTS : DEFAULT_CATEGORY_PRODUCTS);
  const existingIdx = primaryLocal.findIndex((p) => p.id === product.id);
  let updatedPrimary: ProductData[];
  if (existingIdx >= 0) {
    updatedPrimary = [...primaryLocal];
    updatedPrimary[existingIdx] = product;
  } else {
    updatedPrimary = [...primaryLocal, product];
  }
  writeLocal(primaryCacheKey, updatedPrimary);

  // 2. Also update secondary cache so Homepage & Console stay 100% synchronized
  const secondaryLocal = readLocal(secondaryCacheKey, productType === "admin" ? DEFAULT_CATEGORY_PRODUCTS : DEFAULT_ADMIN_PRODUCTS);
  const secIdx = secondaryLocal.findIndex((p) => p.id === product.id);
  if (secIdx >= 0) {
    const updatedSec = [...secondaryLocal];
    updatedSec[secIdx] = {
      ...updatedSec[secIdx],
      name: product.name,
      shortName: product.shortName || updatedSec[secIdx].shortName,
      description: product.description || updatedSec[secIdx].description,
      status: product.status,
      url: product.url || updatedSec[secIdx].url,
      adminUrl: product.adminUrl || updatedSec[secIdx].adminUrl,
    };
    writeLocal(secondaryCacheKey, updatedSec);
  }

  // Sync to Appwrite
  try {
    const payload = productToDocPayload(product, productType);

    let docId: string | null = null;
    try {
      const existing = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("id", product.id),
        Query.limit(1),
      ]);
      if (existing.documents.length > 0) docId = existing.documents[0].$id;
    } catch {
      const all = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]);
      const match = all.documents.find((d: any) => d.id === product.id || d.$id === product.id);
      if (match) docId = match.$id;
    }

    if (docId) {
      await databases.updateDocument(DB_ID, PRODUCTS_COLLECTION_ID, docId, payload);
    } else {
      await databases.createDocument(DB_ID, PRODUCTS_COLLECTION_ID, ID.unique(), payload);
    }
    return true;
  } catch (error) {
    console.warn("[Appwrite Products] Appwrite upsert deferred, saved locally:", error);
    return true;
  }
}

// ===========================
// DELETE PRODUCT
// ===========================
export async function deleteProduct(id: string): Promise<boolean> {
  // Update local caches
  const adminLocal = readLocal(LOCAL_ADMIN_KEY, DEFAULT_ADMIN_PRODUCTS).filter((p) => p.id !== id);
  const categoryLocal = readLocal(LOCAL_CATEGORY_KEY, DEFAULT_CATEGORY_PRODUCTS).filter((p) => p.id !== id);
  writeLocal(LOCAL_ADMIN_KEY, adminLocal);
  writeLocal(LOCAL_CATEGORY_KEY, categoryLocal);

  try {
    let docId: string | null = null;
    try {
      const existing = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("id", id),
        Query.limit(1),
      ]);
      if (existing.documents.length > 0) docId = existing.documents[0].$id;
    } catch {
      const all = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]);
      const match = all.documents.find((d: any) => d.id === id || d.$id === id);
      if (match) docId = match.$id;
    }

    if (docId) {
      await databases.deleteDocument(DB_ID, PRODUCTS_COLLECTION_ID, docId);
    }
    return true;
  } catch (error) {
    console.warn("[Appwrite Products] Appwrite delete deferred, deleted locally:", error);
    return true;
  }
}

// Helper to seed default items into Appwrite
async function seedDefaults(productType: "admin" | "category", items: ProductData[]) {
  try {
    for (const item of items) {
      const payload = productToDocPayload(item, productType);
      await databases.createDocument(DB_ID, PRODUCTS_COLLECTION_ID, ID.unique(), payload).catch(() => null);
    }
  } catch {}
}

// Legacy sync helpers
export function loadAdminProducts(): ProductData[] { return readLocal(LOCAL_ADMIN_KEY, DEFAULT_ADMIN_PRODUCTS); }
export function loadCategoryProducts(): ProductData[] { return readLocal(LOCAL_CATEGORY_KEY, DEFAULT_CATEGORY_PRODUCTS); }
export function saveCategoryProducts(_products: ProductData[]) {}
export function deleteCategoryProduct(_id: string) {}
export function resetCategoryProductsToDefault() {}
