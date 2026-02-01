import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';
import { getProductsWithIcons, filterProductsByRole } from '@/lib/products';
import { ProductTile } from './ProductTile';
import { ComingSoonModal } from './ComingSoonModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'status' | 'order';
type FilterStatus = 'all' | 'live' | 'restricted' | 'coming_soon';

export function ProductGrid() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('order');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('amineva_favorites');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Load products from localStorage
  useEffect(() => {
    setProducts(getProductsWithIcons());
  }, []);

  // Listen for product updates
  useEffect(() => {
    const handleProductsUpdated = () => {
      setProducts(getProductsWithIcons());
    };

    window.addEventListener('productsUpdated', handleProductsUpdated);
    window.addEventListener('storage', handleProductsUpdated);

    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
      window.removeEventListener('storage', handleProductsUpdated);
    };
  }, []);
  
  const accessibleProducts = useMemo(() => {
    return filterProductsByRole(products, user?.role || null);
  }, [products, user?.role]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...accessibleProducts];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(query) || 
             (p.description || '').toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'status':
        const statusOrder = { live: 0, restricted: 1, coming_soon: 2, offline: 3 };
        result.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
      case 'order':
      default:
        result.sort((a, b) => a.order - b.order);
    }

    // Move favorites to top
    const favArray = Array.from(favorites);
    result.sort((a, b) => {
      const aFav = favArray.includes(a.id) ? 0 : 1;
      const bFav = favArray.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });

    return result;
  }, [accessibleProducts, searchQuery, filterStatus, sortBy, favorites]);

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      localStorage.setItem('amineva_favorites', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleOpenProduct = (product: Product) => {
    if (product.status === 'coming_soon' || product.status === 'offline') {
      setSelectedProduct(product);
      setShowComingSoon(true);
    } else if (product.url) {
      window.location.href = product.url;
    }
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
            <SelectTrigger className="w-[140px] h-10">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="coming_soon">Coming Soon</SelectItem>
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
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-l-none"
              onClick={() => setViewMode('list')}
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
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "flex flex-col gap-4"
        }>
          {filteredAndSortedProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
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

      {/* Coming Soon Modal */}
      <ComingSoonModal
        open={showComingSoon}
        onOpenChange={setShowComingSoon}
        productName={selectedProduct?.name}
      />
    </div>
  );
}
