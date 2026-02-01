import React from 'react';
import { loadProducts } from '@/data/products';
import { DEFAULT_CATEGORIES } from '@/types/product';
import { getProductIcon } from '@/lib/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Settings } from 'lucide-react';

export function AdminProductLinks() {
  const products = loadProducts();
  
  // Group products by category for admin links
  const adminProducts = DEFAULT_CATEGORIES.map(category => ({
    ...category,
    products: category.products
      .map(id => products.find(p => p.id === id))
      .filter(p => p && p.adminUrl)
      .map(p => p!),
  })).filter(cat => cat.products.length > 0);

  const handleOpenAdmin = (adminUrl: string) => {
    window.open(adminUrl, '_blank');
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Which application do you want to manage?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminProducts.map((category) => (
            <div key={category.id} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {category.name}
              </h3>
              {category.products.map((product) => {
                const IconComponent = getProductIcon(product.id);
                const isDisabled = product.status === 'offline' || product.status === 'coming_soon';
                
                return (
                  <button
                    key={product.id}
                    onClick={() => !isDisabled && handleOpenAdmin(product.adminUrl!)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                      ${isDisabled 
                        ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                        : 'hover:bg-accent/10 hover:border-accent/50 cursor-pointer'
                      }
                    `}
                  >
                    <IconComponent className="w-8 h-8 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{product.name} Admin</span>
                        {isDisabled && (
                          <Badge variant="secondary" className="text-xs">
                            {product.status === 'offline' ? 'Offline' : 'Coming Soon'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!isDisabled && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
