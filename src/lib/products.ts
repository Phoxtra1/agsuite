// src/lib/products.ts
import type { ProductData, Product } from "@/types/product";
import {
  IconAGIS,
  IconAminevaOps,
  IconAGStock,
  IconAmniva,
  IconPhoxtra,
  IconAgroClimate,
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

  if (id.includes("agroclimate") || id.includes("agro")) {
    return IconAgroClimate;
  }

  if (id.includes("amniva")) {
    return IconAmniva;
  }

  if (id.includes("phoxtra") || id.includes("photo")) {
    return IconPhoxtra;
  }

  return IconPlaceholder;
}

/**
 * Loads products and returns them in a UI-friendly shape.
 */
export function getProductsWithIcons(): Product[] {
  // This is now a no-op; use useCategoryProducts() hook instead
  return [];
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
