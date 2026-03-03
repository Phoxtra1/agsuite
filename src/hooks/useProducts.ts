import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loadAdminProducts,
  loadCategoryProducts,
  saveCategoryProducts,
} from "@/data/products";
import type { ProductData } from "@/types/product";
import { useCallback, useEffect } from "react";

//
// ============================================
// QUERY KEYS (SEPARATED)
// ============================================
//

const ADMIN_QUERY_KEY = ["admin_products"] as const;
const CATEGORY_QUERY_KEY = ["category_products"] as const;

//
// ============================================
// ADMIN PRODUCTS HOOK (READ-ONLY)
// ============================================
//

export function useAdminProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], ...rest } = useQuery<ProductData[]>({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => loadAdminProducts(),
    staleTime: 0,
  });

  useEffect(() => {
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
    };

    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
    };
  }, [queryClient]);

  return { products, ...rest };
}

//
// ============================================
// CATEGORY PRODUCTS HOOK (EDITABLE)
// ============================================
//

export function useCategoryProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], ...rest } = useQuery<ProductData[]>({
    queryKey: CATEGORY_QUERY_KEY,
    queryFn: () => loadCategoryProducts(),
    staleTime: 0,
  });

  useEffect(() => {
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY });
    };

    window.addEventListener("categoryProductsUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("categoryProductsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [queryClient]);

  return { products, ...rest };
}

//
// ============================================
// CATEGORY MUTATIONS (DELETE / EDIT / TOGGLE)
// ============================================
//

export function useCategoryProductMutations() {
  const queryClient = useQueryClient();

  const updateProducts = useCallback(
    (updater: (prev: ProductData[]) => ProductData[]) => {
      const current = loadCategoryProducts();
      const next = updater(current);

      saveCategoryProducts(next);

      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY });
    },
    [queryClient]
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY });
  }, [queryClient]);

  return { updateProducts, invalidate };
}
