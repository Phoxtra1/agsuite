// src/data/products.ts
import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import type { ProductData } from "@/types/product";

const DB_ID = (import.meta as any).env?.VITE_DB_ID || "agsuite-db2";
const PRODUCTS_COLLECTION_ID = "products";

// ===== Appwrite Doc → ProductData mapper =====
function docToProduct(doc: any): ProductData {
  return {
    id: doc.id || doc.$id,
    name: doc.name,
    shortName: doc.short_name || undefined,
    description: doc.description || undefined,
    status: doc.status as ProductData["status"],
    url: doc.url || undefined,
    adminUrl: doc.admin_url || undefined,
    category: doc.category || undefined,
    order: doc.sort_order ?? 0,
    isPublic: doc.is_public ?? false,
    isExternal: doc.is_external ?? false,
  };
}

// ===== ProductData → Appwrite Doc payload mapper =====
function productToDocPayload(p: ProductData, productType: "admin" | "category") {
  return {
    id: p.id,
    name: p.name,
    short_name: p.shortName || "",
    description: p.description || "",
    status: p.status,
    url: p.url || "",
    admin_url: p.adminUrl || "",
    category: p.category || "",
    sort_order: p.order ?? 0,
    is_public: p.isPublic ?? false,
    is_external: p.isExternal ?? false,
    product_type: productType,
  };
}

// ===========================
// FETCH ADMIN PRODUCTS
// ===========================
export async function fetchAdminProducts(): Promise<ProductData[]> {
  try {
    const res = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
      Query.equal("product_type", "admin"),
      Query.orderAsc("sort_order"),
      Query.limit(100),
    ]);
    return res.documents.map(docToProduct);
  } catch (error) {
    console.error("Failed to load admin products from Appwrite:", error);
    return [];
  }
}

// ===========================
// FETCH CATEGORY PRODUCTS
// ===========================
export async function fetchCategoryProducts(): Promise<ProductData[]> {
  try {
    const res = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
      Query.equal("product_type", "category"),
      Query.orderAsc("sort_order"),
      Query.limit(100),
    ]);
    return res.documents.map(docToProduct);
  } catch (error) {
    console.error("Failed to load category products from Appwrite:", error);
    return [];
  }
}

// ===========================
// UPSERT PRODUCT
// ===========================
export async function upsertProduct(
  product: ProductData,
  productType: "admin" | "category"
): Promise<boolean> {
  try {
    const payload = productToDocPayload(product, productType);
    
    // Check if document exists with id == product.id
    const existing = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
      Query.equal("id", product.id),
      Query.limit(1),
    ]).catch(() => null);

    if (existing && existing.documents.length > 0) {
      const docId = existing.documents[0].$id;
      await databases.updateDocument(DB_ID, PRODUCTS_COLLECTION_ID, docId, payload);
    } else {
      await databases.createDocument(DB_ID, PRODUCTS_COLLECTION_ID, ID.unique(), payload);
    }
    return true;
  } catch (error) {
    console.error("Failed to save product in Appwrite:", error);
    return false;
  }
}

// ===========================
// DELETE PRODUCT
// ===========================
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const existing = await databases.listDocuments(DB_ID, PRODUCTS_COLLECTION_ID, [
      Query.equal("id", id),
      Query.limit(1),
    ]);
    
    if (existing.documents.length > 0) {
      await databases.deleteDocument(DB_ID, PRODUCTS_COLLECTION_ID, existing.documents[0].$id);
    }
    return true;
  } catch (error) {
    console.error("Failed to delete product from Appwrite:", error);
    return false;
  }
}

// Legacy sync helpers (no-ops now)
export function loadAdminProducts(): ProductData[] { return []; }
export function loadCategoryProducts(): ProductData[] { return []; }
export function saveCategoryProducts(_products: ProductData[]) {}
export function deleteCategoryProduct(_id: string) {}
export function resetCategoryProductsToDefault() {}
