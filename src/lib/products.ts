// src/lib/products.ts
import type { ProductData, Product } from "@/types/product";
import { loadProducts } from "@/data/products";
import {
  IconAGHub,
  IconAGIS,
  IconAminevaOps,
  IconAGStock,
  IconAmniva,
  IconPlaceholder,
} from "@/components/icons/ProductIcons";

/**
 * Product icon resolver.
 * - Works with known ids (hub/agis/agstock/ops/amniva)
 * - Also supports custom ids (e.g. "custom-...") and shortName-like ids by fuzzy match
 */
export function getProductIcon(productId: ProductData["id"] | string) {
  const id = String(productId || "").toLowerCase().trim();

  // Exact matches first
  switch (id) {
    case "hub":
      return IconAGHub;
    case "agis":
      return IconAGIS;
    case "agstock":
      return IconAGStock;
    case "ops":
      return IconAminevaOps;
    case "amniva":
      return IconAmniva;
  }

  // Fuzzy matching for custom ids / shortnames
  if (id.includes("stock")) return IconAGStock;
  if (id.includes("agis")) return IconAGIS;
  if (id.includes("hub")) return IconAGHub;
  if (id.includes("ops")) return IconAminevaOps;
  if (id.includes("amniva")) return IconAmniva;

  return IconPlaceholder;
}

/**
 * Loads products and returns them in a UI-friendly shape.
 * Icon is rendered via getProductIcon(product.id) at render-time.
 */
export function getProductsWithIcons(): Product[] {
  const products = loadProducts();
  return products.map((product) => ({
    ...product,
    icon: undefined,
  }));
}

/**
 * Role filter:
 * - No role => only public products
 * - Role => public products + products with allowedRoles including role
 */
export function filterProductsByRole(products: Product[], role?: string | null): Product[] {
  if (!role) return products.filter((p) => p.isPublic);

  return products.filter((p) => {
    if (p.isPublic) return true;
    if (!p.allowedRoles || p.allowedRoles.length === 0) return false;
    return p.allowedRoles.includes(role as any);
  });
}
