import type { ProductData } from "@/types/product";
import {
  IconAGApp,
  IconAGOps,
  IconAGStock,
  IconPlaceholder,
} from "@/components/icons/ProductIcons";
import { Globe } from "lucide-react";

/**
 * Returns a React component (icon) for a product ID.
 * AdminPanel uses: const IconComponent = getProductIcon(product.id);
 * then: <IconComponent className="w-10 h-10" />
 */
export function getProductIcon(productId: ProductData["id"] | string) {
  switch (productId) {
    case "hub":
      return Globe;
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
