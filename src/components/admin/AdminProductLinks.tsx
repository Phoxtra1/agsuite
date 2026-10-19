import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_CATEGORIES, ProductData, STATUS_COLORS, STATUS_LABELS } from '@/types/product';
import { getProductIcon } from '@/lib/products';
import { useAdminProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Settings } from 'lucide-react';

export function AdminProductLinks() {
  const { products } = useAdminProducts();
  const navigate = useNavigate();

  const categoryOf = (id: string, productCategory?: string) => {
    if (productCategory) {
      const match = DEFAULT_CATEGORIES.find(c => c.id === productCategory);
      if (match) return match.name;
    }
    return DEFAULT_CATEGORIES.find(c => c.products.includes(id))?.name ?? 'Other Applications';
  };

  const manageable = products
    .filter(p => !!(p.adminUrl || p.url))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleOpenAdmin = (product: ProductData) => {
    const targetUrl = product.adminUrl || product.url;
    if (!targetUrl) return;
    navigate(
      `/suite?viewport=${encodeURIComponent(targetUrl)}&name=${encodeURIComponent(
        product.name
      )}&app=${encodeURIComponent(product.id)}`
    );
  };

  if (manageable.length === 0) return null;

  return (
    <Card className="mb-8">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Settings className="h-5 w-5 text-accent" />
          Application Management
        </CardTitle>
        <CardDescription>Select an application to open its administration console.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {manageable.map(product => {
            const IconComponent = getProductIcon(product.id);
            const isDisabled = product.status === 'offline' || product.status === 'coming_soon';

            return (
              <button
                key={product.id}
                onClick={() => !isDisabled && handleOpenAdmin(product)}
                disabled={isDisabled}
                className={cn(
                  'group relative flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all',
                  isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-accent/60 hover:shadow-md hover:-translate-y-0.5'
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <IconComponent className="h-6 w-6" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-sm text-foreground">{product.name}</p>
                    {!isDisabled && (
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {categoryOf(product.id, product.category)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={cn('text-[10px]', STATUS_COLORS[product.status])}>
                      {STATUS_LABELS[product.status]}
                    </Badge>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {(product.adminUrl || product.url)?.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
