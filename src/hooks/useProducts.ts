import { useState, useEffect, useCallback } from "react";
import {
  loadAdminProducts,
  loadCategoryProducts,
  saveCategoryProducts,
} from "@/data/products";
import type { ProductData } from "@/types/product";

// ============================================
// ADMIN PRODUCTS HOOK (READ-ONLY)
// ============================================

export function useAdminProducts() {
  const [products, setProducts] = useState(loadAdminProducts());

  useEffect(() => {
    const refresh = () => setProducts(loadAdminProducts());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return { products };
}

// ============================================
// CATEGORY PRODUCTS HOOK (HOMEPAGE)
// ============================================

export function useCategoryProducts() {
  const [products, setProducts] = useState(loadCategoryProducts());

  useEffect(() => {
    const refresh = () => setProducts(loadCategoryProducts());
    window.addEventListener("categoryProductsUpdated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("categoryProductsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return { products };
}

// ============================================
// CATEGORY MUTATIONS
// ============================================

export function useCategoryProductMutations() {
  const updateProducts = useCallback(
    (updater: (prev: ProductData[]) => ProductData[]) => {
      const current = loadCategoryProducts();
      const next = updater(current);
      saveCategoryProducts(next);
    },
    []
  );

  return { updateProducts };
}

// Legacy alias
export function useProducts() {
  return useCategoryProducts();
}
