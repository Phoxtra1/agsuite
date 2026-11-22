import React, { useEffect, useState, useCallback } from "react";
import { fetchAdminProducts } from "@/data/products";
import type { ProductData } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProductIcon } from "@/lib/products";
import { ArrowRight, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSelectionStepProps {
  onSelectProduct: (productKey: string) => void;
  onExploreLater: () => void;
}

export function ProductSelectionStep({ onSelectProduct, onExploreLater }: ProductSelectionStepProps) {
  const [products, setProducts] = useState<ProductData[]>([]);

  const refreshProducts = useCallback(async () => {
    try {
      setProducts(await fetchAdminProducts());
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
    window.addEventListener("adminProductsUpdated", refreshProducts);
    window.addEventListener("storage", refreshProducts);
    return () => {
      window.removeEventListener("adminProductsUpdated", refreshProducts);
      window.removeEventListener("storage", refreshProducts);
    };
  }, [refreshProducts]);

  const getStatusBadge = (status: ProductData["status"]) => {
    switch (status) {
      case "live":
        return <Badge className="bg-success/20 text-success text-xs">Live</Badge>;
      case "coming_soon":
        return <Badge variant="secondary" className="text-xs gap-1"><Clock className="h-3 w-3" />Coming Soon</Badge>;
      case "offline":
        return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" />Offline</Badge>;
      default:
        return null;
    }
  };

  const handleProductClick = (product: ProductData) => {
    if (product.status === "coming_soon" || product.status === "offline") return;
    onSelectProduct(product.id);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">What are you here to do?</h2>
        <p className="text-sm text-muted-foreground">Select a product to get started</p>
      </div>
      <div className="space-y-2">
        {products.map((product) => {
          const IconComponent = getProductIcon(product.id);
          const isDisabled = product.status === "coming_soon" || product.status === "offline";
          return (
            <button key={product.id} type="button" onClick={() => handleProductClick(product)} disabled={isDisabled}
              className={cn("flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all",
                isDisabled ? "cursor-not-allowed bg-muted/30 opacity-50" : "cursor-pointer hover:border-accent/50 hover:bg-accent/10")}
              aria-disabled={isDisabled}>
              <IconComponent className="h-10 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="font-medium text-foreground">{product.name}</span>{getStatusBadge(product.status)}</div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{product.description || "No description"}</p>
              </div>
              {!isDisabled && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
            </button>
          );
        })}
      </div>
      <div className="pt-4">
        <Button type="button" variant="ghost" onClick={onExploreLater} className="w-full text-muted-foreground hover:text-foreground">Explore Later — Skip for now</Button>
      </div>
    </div>
  );
}
