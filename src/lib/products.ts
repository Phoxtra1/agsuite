import type { ProductData } from "@/types/product";
import {
  IconAGHub,
  IconAGIS,
  IconAminevaOps,
  IconAGStock,
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
    default:
      return IconPlaceholder;
  }
}

export function getProductsWithIcons() {
  return [];
}

export function filterProductsByRole(products: any[], role?: string) {
  return products;
}
