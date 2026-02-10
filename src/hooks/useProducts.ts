import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadProducts, saveProducts } from "@/data/products";
import type { ProductData } from "@/types/product";
import { useCallback, useEffect } from "react";

const QUERY_KEY = ["products"] as const;

/**
 * Shared React Query hook for products.
 * Both Homepage and Console use the same query key.
 */
export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], ...rest } = useQuery<ProductData[]>({
    queryKey: QUERY_KEY,
    queryFn: () => loadProducts(),
    staleTime: 0,
  });

  // Also listen for localStorage events (cross-tab sync)
  useEffect(() => {
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    };
    window.addEventListener("productsUpdated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("productsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [queryClient]);

  return { products, ...rest };
}

/**
 * Mutation helper: save products and invalidate the shared query.
 */
export function useProductMutations() {
  const queryClient = useQueryClient();

  const updateProducts = useCallback(
    (updater: (prev: ProductData[]) => ProductData[]) => {
      const current = loadProducts();
      const next = updater(current);
      saveProducts(next);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    [queryClient]
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  return { updateProducts, invalidate };
}
