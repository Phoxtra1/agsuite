// src/lib/products.ts
import type { ProductData, Product } from "@/types/product";
import { loadProducts } from "@/data/products";
import {
  IconAGIS,
  IconAminevaOps,
  IconAGStock,
  IconAmniva,
  IconPlaceholder,
} from "@/components/icons/ProductIcons";

/**
 * Normalize product id for reliable icon matching.
 */
function normalizeId(id: string): string {
  return String(id || "")
    .toLowerCase()
    .replace(/[-_\s]/g, "")
    .trim();
}

/**
 * Product icon resolver.
 * Hub removed completely.
 */
export function getProductIcon(productId: ProductData["id"] | string) {
  const id = normalizeId(productId as string);

  if (id.includes("agstock") || id.includes("stock")) {
    return IconAGStock;
  }

  if (id.includes("agis")) {
    return IconAGIS;
  }

  if (id.includes("ops")) {
    return IconAminevaOps;
  }

  if (id.includes("amniva")) {
    return IconAmniva;
  }

  return IconPlaceholder;
}

/**
 * Loads products and returns them in a UI-friendly shape.
 */
export function getProductsWithIcons(): Product[] {
  const products = loadProducts();

  return products.map((product) => ({
    ...product,
    icon: undefined,
  }));
}

/**
 * Role filter
 */
export function filterProductsByRole(
  products: Product[],
  role?: string | null
): Product[] {
  if (!role) return products.filter((p) => p.isPublic);

  return products.filter((p) => {
    if (p.isPublic) return true;
    if (!p.allowedRoles || p.allowedRoles.length === 0) return false;
    return p.allowedRoles.includes(role as any);
  });
}
