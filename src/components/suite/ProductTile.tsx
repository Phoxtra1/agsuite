import React, { useState } from 'react';
import { Product, STATUS_LABELS, STATUS_COLORS } from '@/types/product';
import { getProductIcon } from '@/lib/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExternalLink, Lock, Star, StarOff } from 'lucide-react';

interface ProductTileProps {
  product: Product;
  onOpen: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
}

export function ProductTile({ product, onOpen, isFavorite = false, onToggleFavorite }: ProductTileProps) {
  const IconComponent = getProductIcon(product.id);
  const isAvailable = product.status === 'live' || product.status === 'restricted';
  
  return (
    <div 
      className={cn(
        "suite-card-elevated p-6 flex flex-col gap-4 transition-all duration-200 group",
        "hover:shadow-lg hover:border-accent/30",
        !isAvailable && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <IconComponent className="w-14 h-14" />
            {product.status === 'restricted' && (
              <div className="absolute -top-1 -right-1 bg-warning text-warning-foreground rounded-full p-1">
                <Lock className="w-3 h-3" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
            <Badge 
              variant="secondary" 
              className={cn("text-xs mt-1", STATUS_COLORS[product.status])}
            >
              {STATUS_LABELS[product.status]}
            </Badge>
          </div>
        </div>
        
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(product.id)}
            className="text-muted-foreground hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? (
              <Star className="w-5 h-5 fill-accent text-accent" />
            ) : (
              <StarOff className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground flex-1 line-clamp-2">
        {product.description}
      </p>
      
      <Button
        onClick={() => onOpen(product)}
        className={cn(
          "w-full btn-premium",
          isAvailable 
            ? "bg-accent text-accent-foreground hover:bg-accent/90" 
            : "bg-muted text-muted-foreground hover:bg-muted"
        )}
      >
        {isAvailable ? (
          <>
            Open
            {product.isExternal && <ExternalLink className="ml-2 w-4 h-4" />}
          </>
        ) : (
          'Coming Soon'
        )}
      </Button>
    </div>
  );
}