import { useState, useEffect, useCallback } from "react";
import {
  fetchAdminProducts,
  fetchCategoryProducts,
  upsertProduct,
  deleteProduct,
} from "@/data/products";
import type { ProductData } from "@/types/product";

// ============================================
// ADMIN PRODUCTS HOOK (READ-ONLY)
// ============================================

export function useAdminProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchAdminProducts();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("adminProductsUpdated", refresh);
    return () => window.removeEventListener("adminProductsUpdated", refresh);
  }, [refresh]);

  return { products, loading, refresh };
}

// ============================================
// CATEGORY PRODUCTS HOOK (HOMEPAGE)
// ============================================

export function useCategoryProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchCategoryProducts();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handleUpdate = () => {
      refresh();
    };
    window.addEventListener("categoryProductsUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("categoryProductsUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return { products, loading, refresh };
}

// ============================================
// CATEGORY MUTATIONS (DB-backed)
// ============================================

export function useCategoryProductMutations() {
  const save = useCallback(async (product: ProductData) => {
    return upsertProduct(product, "category");
  }, []);

  const remove = useCallback(async (id: string) => {
    return deleteProduct(id);
  }, []);

  return { save, remove };
}

// ============================================
// ADMIN MUTATIONS (DB-backed)
// ============================================

export function useAdminProductMutations() {
  const save = useCallback(async (product: ProductData) => {
    return upsertProduct(product, "admin");
  }, []);

  const remove = useCallback(async (id: string) => {
    return deleteProduct(id);
  }, []);

  return { save, remove };
}

// Legacy alias
export function useProducts() {
  return useCategoryProducts();
}
