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
    const data = await fetchAdminProducts();
    setProducts((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
      return data;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handleUpdate = () => {
      refresh();
    };
    window.addEventListener("adminProductsUpdated", handleUpdate);
    window.addEventListener("categoryProductsUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("adminProductsUpdated", handleUpdate);
      window.removeEventListener("categoryProductsUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return { products, loading, refresh };
}

// ============================================
// CATEGORY PRODUCTS HOOK (HOMEPAGE)
// ============================================

const HOME_CACHE_KEY = "amineva_home_products_cache_v1";

function readHomeCache(): ProductData[] {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCategoryProducts() {
  // Render instantly from the last known list, then refresh quietly.
  const [products, setProducts] = useState<ProductData[]>(() => readHomeCache());
  const [loading, setLoading] = useState(() => readHomeCache().length === 0);

  const refresh = useCallback(async () => {
    const data = await fetchCategoryProducts();
    setProducts((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
      return data;
    });
    setLoading(false);
    try { localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data)); } catch {}
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
    return deleteProduct(id, "category");
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
    return deleteProduct(id, "admin");
  }, []);

  return { save, remove };
}

// Legacy alias
export function useProducts() {
  return useCategoryProducts();
}
