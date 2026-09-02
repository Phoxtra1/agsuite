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
    name: "Adesua Career Intel",
    shortName: "Adesua",
    description: "Career development & professional pathways platform",
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
    id: "datalens",
    name: "DataLens",
    shortName: "DataLens",
    description: "Opportunity and data intelligence",
    status: "live",
    url: "https://datalens.amineva.com",
    category: "data-intelligence",
    order: 1,
    isPublic: true,
  },
  {
    id: "aminevaops",
    name: "Sikasɛm",
    shortName: "Sikasɛm",
    description: "Enterprise financial operations",
    status: "live",
    url: "https://ops.amineva.com",
    category: "financial-operations",
    order: 2,
    isPublic: true,
  },
  {
    id: "abi",
    name: "ABI",
    shortName: "ABI",
    description: "Amineva business intelligence",
    status: "live",
    url: "https://abi.amineva.com",
    category: "business-intelligence",
    order: 3,
    isPublic: true,
  },
  {
    id: "workspace",
    name: "Amineva Workspace",
    shortName: "Workspace",
    description: "Cloud office suite for team collaboration",
    status: "live",
    url: "/workspace",
    category: "workspace",
    order: 4,
    isPublic: true,
  },
];

// Local cache keys
const LOCAL_ADMIN_KEY = "amineva_admin_products_v8";
const LOCAL_CATEGORY_KEY = "amineva_category_products_v8";
const deletedKey = (type: "admin" | "category") => `amineva_${type}_products_deleted_v2`;
const pendingKey = (type: "admin" | "category") => `amineva_${type}_products_pending_v2`;

function readPending(type: "admin" | "category"): string[] {
  try {
    const raw = localStorage.getItem(pendingKey(type));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addPending(type: "admin" | "category", id: string) {
  try {
    localStorage.setItem(pendingKey(type), JSON.stringify(Array.from(new Set([...readPending(type), id]))));
  } catch {}
}

function clearPending(type: "admin" | "category", id: string) {
  try {
    localStorage.setItem(pendingKey(type), JSON.stringify(readPending(type).filter((x) => x !== id)));
  } catch {}
}

function readDeleted(type: "admin" | "category"): string[] {
  try {
    const raw = localStorage.getItem(deletedKey(type));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addDeleted(type: "admin" | "category", id: string) {
  try {
    const next = Array.from(new Set([...readDeleted(type), id]));
    localStorage.setItem(deletedKey(type), JSON.stringify(next));
  } catch {}
}

function clearDeleted(type: "admin" | "category", id: string) {
  try {
    localStorage.setItem(deletedKey(type), JSON.stringify(readDeleted(type).filter((x) => x !== id)));
  } catch {}
}

function notifyProductsUpdated(productType: "admin" | "category") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(productType === "category" ? "categoryProductsUpdated" : "adminProductsUpdated"));
}

function readLocal(key: string, fallback: ProductData[]): ProductData[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
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
  // Workspace is a homepage/category product only — never an admin console entry
  const deleted = new Set([...readDeleted("admin"), "workspace"]);
  const cached = readLocal(LOCAL_ADMIN_KEY, DEFAULT_ADMIN_PRODUCTS).filter((p) => !deleted.has(p.id));

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
    const pending = new Set(readPending("admin"));
    const mergedMap = new Map<string, ProductData>();
    // Start from cached so locally-known items survive, then let the server win
    cached.forEach((p) => mergedMap.set(p.id, p));
    fetched.forEach((p) => {
      // Only unsynced local edits may override the server copy
      if (pending.has(p.id) && mergedMap.has(p.id)) return;
      mergedMap.set(p.id, p);
    });
    deleted.forEach((id) => mergedMap.delete(id));
    const merged = Array.from(mergedMap.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
  const deleted = new Set(readDeleted("category"));
  const cached = readLocal(LOCAL_CATEGORY_KEY, DEFAULT_CATEGORY_PRODUCTS).filter((p) => !deleted.has(p.id));

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
    const pending = new Set(readPending("category"));
    const mergedMap = new Map<string, ProductData>();
    // Start from cached so locally-known items survive, then let the server win
    cached.filter((p) => pending.has(p.id)).forEach((p) => mergedMap.set(p.id, p));
    fetched.forEach((p) => {
      // Only unsynced local edits may override the server copy
      if (pending.has(p.id) && mergedMap.has(p.id)) return;
      mergedMap.set(p.id, p);
    });
    deleted.forEach((id) => mergedMap.delete(id));
    const merged = Array.from(mergedMap.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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

  // Re-saving a previously deleted product resurrects it
  clearDeleted(productType, product.id);
  addPending(productType, product.id);

  // Notify active components immediately (both surfaces stay in sync)
  notifyProductsUpdated(productType);

  // 2. Sync to Appwrite for this product type, then mirror status onto the sibling doc
  const syncOne = async (p: ProductData, type: "admin" | "category") => {
    const payload = productToDocPayload(p, type);
    let docId: string | null = null;
    try {
      const existing = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("id", p.id),
        Query.equal("product_type", type),
        Query.limit(1),
      ]);
      if (existing.documents.length > 0) docId = existing.documents[0].$id;
    } catch {
      const all = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]);
      const match = all.documents.find(
        (d: any) => (d.id === p.id || d.$id === p.id) && (d.product_type === type || !d.product_type)
      );
      if (match) docId = match.$id;
    }

    if (docId) {
      await databases.updateDocument(DB_ID, PRODUCTS_COLLECTION_ID, docId, payload);
    } else {
      await databases.createDocument(DB_ID, PRODUCTS_COLLECTION_ID, ID.unique(), payload);
    }
  };

  try {
    await syncOne(product, productType);
    // Server now holds the truth — stop overriding it locally
    clearPending(productType, product.id);
    return true;
  } catch (error) {
    console.warn("[Appwrite Products] Appwrite upsert deferred, saved locally:", error);
    return true;
  }
}


// ===========================
// DELETE PRODUCT
// ===========================
export async function deleteProduct(id: string, productType: "admin" | "category"): Promise<boolean> {
  const cacheKey = productType === "admin" ? LOCAL_ADMIN_KEY : LOCAL_CATEGORY_KEY;
  const fallback = productType === "admin" ? DEFAULT_ADMIN_PRODUCTS : DEFAULT_CATEGORY_PRODUCTS;
  writeLocal(cacheKey, readLocal(cacheKey, fallback).filter((p) => p.id !== id));
  addDeleted(productType, id);
  notifyProductsUpdated(productType);

  try {
    let docId: string | null = null;
    try {
      const existing = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("id", id),
        Query.equal("product_type", productType),
        Query.limit(1),
      ]);
      if (existing.documents.length > 0) docId = existing.documents[0].$id;
    } catch {
      const all = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]);
      const match = all.documents.find((d: any) => (d.id === id || d.$id === id) && d.product_type === productType);
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
