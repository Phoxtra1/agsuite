import { useState, useEffect } from "react";
import { loadCategoryProducts } from "@/data/products";

export function useProducts() {
  const [products, setProducts] = useState(loadCategoryProducts());

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(loadCategoryProducts());
    };

    window.addEventListener("categoryProductsUpdated", handleUpdate);

    return () => {
      window.removeEventListener("categoryProductsUpdated", handleUpdate);
    };
  }, []);

  return { products, setProducts };
}
