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

export function getProductIcon(productId: ProductData["id"] | string) {
  switch (productId) {
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
    default:
      return IconPlaceholder;
  }
}

export function getProductsWithIcons(): Product[] {
  const products = loadProducts();
  return products.map((product) => ({
    ...product,
    icon: undefined, // Icon is rendered via getProductIcon
  }));
}

export function filterProductsByRole(products: Product[], role?: string | null): Product[] {
  if (!role) {
    // No role = only public products
    return products.filter((p) => p.isPublic);
  }

  return products.filter((p) => {
    if (p.isPublic) return true;
    if (!p.allowedRoles) return false;
    return p.allowedRoles.includes(role as any);
  });
}
