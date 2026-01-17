import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { loadProducts } from '@/data/products';
import { ProductData, STATUS_LABELS } from '@/types/product';
import { IconAGMain, IconAGApp, IconAGOps, IconAGStock, IconPlaceholder } from '@/components/icons/ProductIcons';
import { Globe, Lock, Clock } from 'lucide-react';

// Map product IDs to icons
function getProductIcon(productId: string) {
  const icons: Record<string, React.ReactNode> = {
    'ag-main': <IconAGMain className="w-10 h-10" />,
    'ag-hub': <Globe className="w-10 h-10 text-accent" />,
    'ag-app': <IconAGApp className="w-10 h-10" />,
    'ag-ops': <IconAGOps className="w-10 h-10" />,
    'ag-stock': <IconAGStock className="w-10 h-10" />,
  };
  return icons[productId] || <IconPlaceholder className="w-10 h-10" />;
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'live':
      return 'default';
    case 'restricted':
      return 'destructive';
    case 'coming_soon':
      return 'secondary';
    default:
      return 'outline';
  }
}

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  type: 'restricted' | 'coming_soon';
  productName: string;
}

function ProductModal({ open, onClose, type, productName }: ProductModalProps) {
  const handleRequestAccess = () => {
    // In production, this would store the request
    console.log(`Access requested for ${productName}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'restricted' ? (
              <>
                <Lock className="h-5 w-5 text-destructive" />
                Restricted Access
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-muted-foreground" />
                Coming Soon
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === 'restricted' ? (
              <>This product requires special access permissions. Request access to proceed.</>
            ) : (
              <>This product is currently under development and will be available soon.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {type === 'restricted' && (
            <Button onClick={handleRequestAccess}>Request Access</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [modalState, setModalState] = useState<{
    open: boolean;
    type: 'restricted' | 'coming_soon';
    productName: string;
  }>({ open: false, type: 'restricted', productName: '' });

  useEffect(() => {
    setProducts(loadProducts());
    
    const handleProductsUpdate = () => {
      setProducts(loadProducts());
    };
    
    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('storage', handleProductsUpdate);
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('storage', handleProductsUpdate);
    };
  }, []);

  const handleProductClick = (product: ProductData) => {
    if (product.status === 'live') {
      window.open(product.url, '_blank', 'noopener,noreferrer');
    } else if (product.status === 'restricted') {
      setModalState({ open: true, type: 'restricted', productName: product.name });
    } else if (product.status === 'coming_soon') {
      setModalState({ open: true, type: 'coming_soon', productName: product.name });
    }
  };

  // Product descriptions - text only, no icons or links
  const productDescriptions = [
    {
      id: 'ag-hub',
      name: 'AG Hub',
      status: 'live',
      description: 'Publications of insights, reports, previous works, careers/recruitments, resources, and previous work done.',
    },
    {
      id: 'ag-app',
      name: 'AG App',
      status: 'live',
      description: 'Services to clients needing data & insights, field project inspection, strategic assessment, and professional documentation.',
    },
    {
      id: 'ag-ops',
      name: 'AG Ops',
      status: 'coming_soon',
      description: 'Business operations platform allowing organizations/service providers to manage clients.',
    },
    {
      id: 'ag-stock',
      name: 'AG Stock',
      status: 'live',
      description: 'Secure inventory, sales, and loss-prevention platform for shop owners.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Products Grid - clickable icons at top */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6">Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.sort((a, b) => a.order - b.order).map((product) => (
            <Card 
              key={product.id}
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg ${
                product.status === 'live' ? 'hover:border-accent/50' : 'opacity-80'
              }`}
              onClick={() => handleProductClick(product)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="mb-3 transition-transform group-hover:scale-110">
                  {getProductIcon(product.id)}
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-2">{product.name}</h3>
                <Badge variant={getStatusBadgeVariant(product.status)} className="text-xs">
                  {STATUS_LABELS[product.status]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Product Descriptions - clean text only, no extra icons or links */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6">Descriptions</h2>
        <div className="space-y-4">
          {productDescriptions.map((product) => (
            <Card key={product.id} className="hover:border-accent/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                  <Badge variant={getStatusBadgeVariant(product.status)} className="text-xs">
                    {product.status === 'live' ? 'Live' : product.status === 'coming_soon' ? 'Coming Soon' : 'Restricted'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{product.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing Statement */}
      <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
        <CardContent className="py-8 text-center">
          <p className="text-lg text-foreground font-medium">
            "All products are geared toward one vital problem: protection of investments 
            through verified information and operational control."
          </p>
        </CardContent>
      </Card>

      {/* Modal */}
      <ProductModal
        open={modalState.open}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
        type={modalState.type}
        productName={modalState.productName}
      />
    </div>
  );
}
