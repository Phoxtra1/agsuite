import React from "react";

// ✅ Use whatever component currently renders your products UI.
// If your products UI is in a different component, replace the import below.
import { ProductGrid } from "@/components/suite/ProductGrid";

export function ProductsPage() {
  return <ProductGrid />;
}

// ✅ Also export default to avoid import-style issues elsewhere
export default ProductsPage;
