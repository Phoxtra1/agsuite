// src/data/products.ts
import { databases, APPWRITE_DB_ID } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import type { ProductData } from "@/types/product";

const DB_ID = APPWRITE_DB_ID;
const PRODUCTS_COLLECTION_ID = "products";

export const DEFAULT_ADMIN_PRODUCTS: ProductData[] = [
  { id: "agis", name: "AGIS Intelligence", shortName: "AGIS", description: "Enterprise spatial & data analytics portal", status: "live", adminUrl: "https://agis.amineva.com", order: 1, isPublic: true },
  { id: "agstock", name: "AG Stock", shortName: "AG Stock", description: "Inventory & supply chain management engine", status: "live", adminUrl: "https://stock.amineva.com", order: 2, isPublic: true },
  { id: "aminevaops", name: "Sikasɛm Financial Ops", shortName: "Sikasɛm", description: "Financial management and operational accounting", status: "live", adminUrl: "https://ops.amineva.com", order: 3, isPublic: true },
  { id: "agroclimate", name: "AgroClimate", shortName: "AgroClimate", description: "Agricultural climate intelligence & harvest telemetry", status: "live", adminUrl: "https://agro.amineva.com", order: 5, isPublic: true },
  { id: "adesua", name: "Adesua Career Intel", shortName: "Adesua", description: "Career development & professional pathways platform", status: "live", adminUrl: "https://as.amineva.com", order: 6, isPublic: true },
  { id: "datalens", name: "Info Services", shortName: "Info Services", description: "Information research, verification, analysis and professional reporting", status: "live", adminUrl: "/explainer/info-services", order: 7, isPublic: true },
];

const LOCAL_ADMIN_KEY = "amineva_admin_products_v8";
const deletedKey = "amineva_admin_products_deleted_v2";
const pendingKey = "amineva_admin_products_pending_v2";

function readIds(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch {}
}

function readLocal(): ProductData[] {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_KEY);
    const parsed = raw ? JSON.parse(raw) : DEFAULT_ADMIN_PRODUCTS;
    return Array.isArray(parsed) ? parsed : DEFAULT_ADMIN_PRODUCTS;
  } catch {
    return DEFAULT_ADMIN_PRODUCTS;
  }
}

function writeLocal(products: ProductData[]) {
  try { localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(products)); } catch {}
}

function notifyProductsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("adminProductsUpdated"));
  window.dispatchEvent(new Event("storage"));
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

function productToDocPayload(product: ProductData) {
  return {
    id: product.id,
    name: product.name,
    short_name: product.shortName || "",
    description: product.description || "",
    status: product.status || "coming_soon",
    url: product.url || "",
    admin_url: product.adminUrl || "",
    category: product.category || "",
    sort_order: product.order ?? 0,
    is_public: product.isPublic ?? true,
    is_external: product.isExternal ?? false,
    product_type: "admin",
  };
}

function withTimeout<T>(promise: Promise<T>, ms = 800): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Timeout")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export async function fetchAdminProducts(): Promise<ProductData[]> {
  const deleted = new Set([...readIds(deletedKey), "workspace"]);
  const cached = readLocal().filter((product) => !deleted.has(product.id));

  try {
    let documents: any[] = [];
    try {
      const response = await withTimeout(databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("product_type", "admin"),
        Query.limit(100),
      ]));
      documents = response.documents;
    } catch {
      try {
        const response = await withTimeout(databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]));
        documents = response.documents.filter((doc: any) => doc.product_type === "admin" || !doc.product_type);
      } catch {
        documents = [];
      }
    }

    if (documents.length === 0) {
      if (cached.length > 0) return cached;
      await seedDefaults(DEFAULT_ADMIN_PRODUCTS);
      return cached;
    }

    const cachedById = new Map(cached.map((product) => [product.id, product]));
    const merged = new Map<string, ProductData>();
    documents.map(docToProduct).forEach((product) => {
      const localProduct = cachedById.get(product.id);
      merged.set(product.id, localProduct ? { ...product, ...localProduct } : product);
    });
    cached.forEach((product) => {
      if (!merged.has(product.id)) merged.set(product.id, product);
    });
    deleted.forEach((id) => merged.delete(id));

    const result = Array.from(merged.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    writeLocal(result);
    return result;
  } catch (error) {
    console.warn("[Appwrite Products] Using cached admin products due to fetch error:", error);
    return cached;
  }
}

export async function upsertProduct(product: ProductData): Promise<boolean> {
  const products = readLocal();
  const index = products.findIndex((item) => item.id === product.id);
  const updated = [...products];
  if (index >= 0) updated[index] = product;
  else updated.push(product);
  writeLocal(updated);

  writeIds(deletedKey, readIds(deletedKey).filter((id) => id !== product.id));
  writeIds(pendingKey, Array.from(new Set([...readIds(pendingKey), product.id])));
  notifyProductsUpdated();

  const payload = productToDocPayload(product);
  try {
    let documentId: string | null = null;
    try {
      const existing = await withTimeout(databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("id", product.id),
        Query.equal("product_type", "admin"),
        Query.limit(1),
      ]));
      if (existing.documents.length > 0) documentId = existing.documents[0].$id;
    } catch {
      try {
        const all = await withTimeout(databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]));
        const match = all.documents.find((doc: any) =>
          (doc.id === product.id || doc.$id === product.id) && (doc.product_type === "admin" || !doc.product_type)
        );
        if (match) documentId = match.$id;
      } catch {}
    }

    if (documentId) {
      await withTimeout(databases.updateDocument(DB_ID, PRODUCTS_COLLECTION_ID, documentId, payload));
    } else {
      await withTimeout(databases.createDocument(DB_ID, PRODUCTS_COLLECTION_ID, ID.unique(), payload));
    }
    writeIds(pendingKey, readIds(pendingKey).filter((id) => id !== product.id));
    return true;
  } catch (error) {
    console.warn("[Appwrite Products] Appwrite upsert deferred, saved locally:", error);
    return true;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  writeLocal(readLocal().filter((product) => product.id !== id));
  writeIds(deletedKey, Array.from(new Set([...readIds(deletedKey), id])));
  notifyProductsUpdated();

  try {
    let documentId: string | null = null;
    try {
      const existing = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
        Query.equal("id", id),
        Query.equal("product_type", "admin"),
        Query.limit(1),
      ]);
      if (existing.documents.length > 0) documentId = existing.documents[0].$id;
    } catch {
      const all = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [Query.limit(100)]);
      const match = all.documents.find((doc: any) =>
        (doc.id === id || doc.$id === id) && (doc.product_type === "admin" || !doc.product_type)
      );
      if (match) documentId = match.$id;
    }
    if (documentId) await databases.deleteDocument(DB_ID, PRODUCTS_COLLECTION_ID, documentId);
    return true;
  } catch (error) {
    console.warn("[Appwrite Products] Appwrite delete deferred, deleted locally:", error);
    return true;
  }
}

async function seedDefaults(products: ProductData[]) {
  try {
    for (const product of products) {
      await databases.createDocument(DB_ID, PRODUCTS_COLLECTION_ID, ID.unique(), productToDocPayload(product)).catch(() => null);
    }
  } catch {}
}

export function loadAdminProducts(): ProductData[] {
  return readLocal();
}
