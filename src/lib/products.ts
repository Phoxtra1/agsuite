import React from 'react';
import { Product, ProductData } from '@/types/product';
import { loadProducts } from '@/data/products';
import { IconAGMain, IconAGApp, IconAGOps, IconAGStock, IconPlaceholder } from '@/components/icons/ProductIcons';
import { UserRole } from '@/types/auth';

// Icon mapping by product ID
const PRODUCT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'ag-main': IconAGMain,
  'ag-app': IconAGApp,
  'ag-ops': IconAGOps,
  'ag-stock': IconAGStock,
};

export function getProductIcon(productId: string): React.ComponentType<{ className?: string }> {
  return PRODUCT_ICON_MAP[productId] || IconPlaceholder;
}

export function getProductsWithIcons(productsData?: ProductData[]): Product[] {
  const data = productsData || loadProducts();
  return data.map(product => {
    const IconComponent = getProductIcon(product.id);
    return {
      ...product,
      icon: React.createElement(IconComponent),
    };
  });
}

export function filterProductsByRole(products: Product[], role: UserRole | null): Product[] {
  if (!role) {
    // Visitor - only public products
    return products.filter(p => p.isPublic);
  }
  
  if (role === 'super_admin') {
    return products;
  }
  
  return products.filter(p => p.allowedRoles.includes(role));
}

export function canAccessProduct(product: Product, role: UserRole | null): boolean {
  if (!role) {
    return product.isPublic;
  }
  
  if (role === 'super_admin') {
    return true;
  }
  
  return product.allowedRoles.includes(role);
}
