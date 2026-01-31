import type { ProductData } from "@/types/product";
import {
  IconAGIS,
  IconAGOps,
  IconAGStock,
  IconPlaceholder,
} from "@/components/icons/ProductIcons";
import { Globe } from "lucide-react";

export function getProductIcon(productId: ProductData["id"] | string) {
  switch (productId) {
    case "hub":
      return Globe;
    case "agis":
      return IconAGIS;
    case "agstock":
      return IconAGStock;
    case "ops":
      return IconAGOps;
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
