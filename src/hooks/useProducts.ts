import { useState, useEffect, useCallback } from "react";
import { fetchAdminProducts, upsertProduct, deleteProduct } from "@/data/products";
import type { ProductData } from "@/types/product";

export function useAdminProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchAdminProducts();
    setProducts((previous) => JSON.stringify(previous) === JSON.stringify(data) ? previous : data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("adminProductsUpdated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("adminProductsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { products, loading, refresh };
}

export function useAdminProductMutations() {
  const save = useCallback((product: ProductData) => upsertProduct(product), []);
  const remove = useCallback((id: string) => deleteProduct(id), []);
  return { save, remove };
}
