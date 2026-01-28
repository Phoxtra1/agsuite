import React, { useState, useMemo, useEffect } from "react";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { ensureProfile } from "@/lib/profile";
import { ProductTile } from "./ProductTile";
import { ComingSoonModal } from "./ComingSoonModal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

// ✅ Your approved products list (locked)
const BASE_PRODUCTS: Product[] = [
  {
    id: "hub",
    key: "hub",
    name: "AG Hub",
    description: "Reports, insights & publications.",
    url: "https://hub.amineva.com",
    status: "live",
    order: 1,
    isExternal: true,
  },
  {
    id: "agis",
    key: "agis",
    name: "AGIS",
    description: "Intelligence system and operational tools.",
    url: "https://app.amineva.com",
    status: "live",
    order: 2,
    isExternal: true,
  },
  {
    id: "agstock",
    key: "agstock",
    name: "AGStock",
    description: "Stock & inventory management.",
    url: "https://stock.amineva.com",
    status: "live",
    order: 3,
    isExternal: true,
  },
  {
    id: "amniva",
    key: "amniva",
    name: "Amniva",
    description: "Verify & predictions (currently inactive).",
    url: "https://www.amniva.io",
    status: "offline", // matches your "off"
    order: 4,
    isExternal: true,
  },
  {
    id: "ops",
    key: "ops",
    name: "AminevaOps",
    description: "Service operations tools (coming soon).",
    url: "", // not created yet
    status: "coming_soon",
    order: 5,
    isExternal: true,
  },
];

type ViewMode = "grid" | "list";
type SortBy = "name" | "status" | "order";
type FilterStatus = "all" | "live" | "restricted" | "coming_soon" | "offline";

export function ProductGrid() {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [enabledSet, setEnabledSet] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("order");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("amineva_favorites");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // 1) Load base products
  useEffect(() => {
    setProducts(BASE_PRODUCTS);
  }, []);

  // 2) Load Suite profile enabledProducts -> used to prevent wandering
  useEffect(() => {
    (async () => {
      try {
        // IMPORTANT: adjust according to your AuthContext user shape
        const userId = (user as any)?.$id || (user as any)?.id;
        if (!userId) return;

        const prof = await ensureProfile(userId);
        setEnabledSet(new Set(prof.enabledProducts));
      } catch {
        setEnabledSet(new Set());
      }
    })();
  }, [user]);

  // 3) Apply access gating:
  // If product is LIVE but user is not enabled -> mark as "restricted"
  const accessibleProducts = useMemo(() => {
    return products.map((p) => {
      const key = (p as any).key || p.id;
      const assigned = enabledSet.has(key);

      // If not assigned, show but lock it (restricted)
      if (!assigned) return { ...p, status: "restricted" as any };

      // Respect your global enable rules:
      // - ops stays coming_soon
      // - amniva stays offline
      return p;
    });
  }, [products, enabledSet]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...accessibleProducts];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    // Filter status
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "status":
        const statusOrder: Record<string, number> = {
          live: 0,
          restricted: 1,
          coming_soon: 2,
          offline: 3,
        };
        result.sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
        break;
      case "order":
      default:
        result.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }

    // Favorites on top
    const favArray = Array.from(favorites);
    result.sort((a, b) => {
      const aFav = favArray.includes(a.id) ? 0 : 1;
      const bFav = favArray.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });

    return result;
  }, [accessibleProducts, searchQuery, filterStatus, sortBy, favorites]);

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);

      localStorage.setItem("amineva_favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleOpenProduct = (product: Product) => {
    // Block restricted / coming soon / offline
    if (product.status === "restricted" || product.status === "coming_soon" || product.status === "offline") {
      setSelectedProduct(product);
      setShowComingSoon(true);
      return;
    }

    // Live products
    if (product.url) window.location.href = product.url;
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[160px] h-10">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="coming_soon">Coming Soon</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[120px] h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order">Default</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Grid/List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No products found matching your criteria.</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {filteredAndSortedProducts.map((product, index) => (
            <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <ProductTile
                product={product}
                onOpen={handleOpenProduct}
                isFavorite={favorites.has(product.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal for Restricted/Coming Soon/Offline */}
      <ComingSoonModal
        open={showComingSoon}
        onOpenChange={setShowComingSoon}
        productName={selectedProduct?.name}
      />
    </div>
  );
}
