import React from 'react';
import { loadProducts } from '@/data/products';
import { DEFAULT_CATEGORIES, ProductData } from '@/types/product';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getProductIcon } from '@/lib/products';
import { ArrowRight, Clock, XCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductSelectionStepProps {
  onSelectProduct: (productKey: string) => void;
  onExploreLater: () => void;
}

export function ProductSelectionStep({ onSelectProduct, onExploreLater }: ProductSelectionStepProps) {
  const products = loadProducts();
  
  // Group products by category
  const productsByCategory = DEFAULT_CATEGORIES.map(category => ({
    ...category,
    products: category.products
      .map(id => products.find(p => p.id === id))
      .filter(Boolean) as ProductData[],
  }));

  const getStatusBadge = (status: ProductData['status']) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-success/20 text-success text-xs">Live</Badge>;
      case 'coming_soon':
        return (
          <Badge variant="secondary" className="text-xs gap-1">
            <Clock className="w-3 h-3" />
            Coming Soon
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="destructive" className="text-xs gap-1">
            <XCircle className="w-3 h-3" />
            Offline
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleProductClick = (product: ProductData) => {
    // AG Hub is public - open directly
    if (product.id === 'hub') {
      window.open(product.url, '_blank');
      return;
    }
    
    // Disabled products show modal (handled elsewhere)
    if (product.status === 'coming_soon' || product.status === 'offline') {
      return;
    }
    
    onSelectProduct(product.id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          What are you here to do?
        </h2>
        <p className="text-muted-foreground text-sm">
          Select a product to get started
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {productsByCategory.map((category) => (
          <AccordionItem 
            key={category.id} 
            value={category.id}
            className="border rounded-lg px-4 bg-card/50"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="font-medium text-foreground">{category.name}</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">
                {category.products.map((product) => {
                  const IconComponent = getProductIcon(product.id);
                  const isDisabled = product.status === 'coming_soon' || product.status === 'offline';
                  const isPublic = product.id === 'hub';
                  
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
                        isDisabled 
                          ? "opacity-50 cursor-not-allowed bg-muted/30" 
                          : "hover:bg-accent/10 hover:border-accent/50 cursor-pointer",
                      )}
                    >
                      <IconComponent className="w-10 h-10 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{product.name}</span>
                          {getStatusBadge(product.status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {product.description || 'No description'}
                        </p>
                      </div>
                      {!isDisabled && (
                        isPublic ? (
                          <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="pt-4">
        <Button
          variant="ghost"
          onClick={onExploreLater}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          Explore Later — Skip for now
        </Button>
      </div>
    </div>
  );
}
