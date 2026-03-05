import { supabase } from "@/integrations/supabase/client";
import type { ProductData } from "@/types/product";

// ===== DB → ProductData mapper =====
function rowToProduct(row: any): ProductData {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name || undefined,
    description: row.description || undefined,
    status: row.status as ProductData["status"],
    url: row.url || undefined,
    adminUrl: row.admin_url || undefined,
    category: row.category || undefined,
    order: row.sort_order ?? 0,
    isPublic: row.is_public ?? false,
    isExternal: row.is_external ?? false,
  };
}

// ===== ProductData → DB row mapper =====
function productToRow(p: ProductData, productType: "admin" | "category") {
  return {
    id: p.id,
    name: p.name,
    short_name: p.shortName || null,
    description: p.description || null,
    status: p.status,
    url: p.url || null,
    admin_url: p.adminUrl || null,
    category: p.category || null,
    sort_order: p.order,
    is_public: p.isPublic ?? false,
    is_external: p.isExternal ?? false,
    product_type: productType,
  };
}

// ===========================
// FETCH ADMIN PRODUCTS
// ===========================
export async function fetchAdminProducts(): Promise<ProductData[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("product_type", "admin")
    .order("sort_order");

  if (error) {
    console.error("Failed to load admin products:", error);
    return [];
  }
  return (data || []).map(rowToProduct);
}

// ===========================
// FETCH CATEGORY PRODUCTS
// ===========================
export async function fetchCategoryProducts(): Promise<ProductData[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("product_type", "category")
    .order("sort_order");

  if (error) {
    console.error("Failed to load category products:", error);
    return [];
  }
  return (data || []).map(rowToProduct);
}

// ===========================
// UPSERT PRODUCT
// ===========================
export async function upsertProduct(
  product: ProductData,
  productType: "admin" | "category"
): Promise<boolean> {
  const row = productToRow(product, productType);
  const { error } = await supabase
    .from("products")
    .upsert(row as any, { onConflict: "id" });

  if (error) {
    console.error("Failed to save product:", error);
    return false;
  }
  return true;
}

// ===========================
// DELETE PRODUCT
// ===========================
export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete product:", error);
    return false;
  }
  return true;
}

// Legacy sync helpers (no-ops now)
export function loadAdminProducts(): ProductData[] { return []; }
export function loadCategoryProducts(): ProductData[] { return []; }
export function saveCategoryProducts(_products: ProductData[]) {}
export function deleteCategoryProduct(_id: string) {}
export function resetCategoryProductsToDefault() {}
