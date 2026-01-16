import { ProductData } from '@/types/product';

const STORAGE_KEY = 'amineva_products';

// Default products for Amineva Global
export const DEFAULT_PRODUCTS: ProductData[] = [
  {
    id: 'ag-hub',
    name: 'AG Hub',
    shortName: 'Hub',
    description: 'Publications of insights, reports, previous works, careers/recruitments, resources, and previous work done.',
    url: 'https://hub.amineva.com',
    status: 'live',
    isPublic: true,
    allowedRoles: ['super_admin', 'staff', 'customer', 'visitor'],
    isExternal: true,
    order: 1,
  },
  {
    id: 'ag-app',
    name: 'AG App',
    shortName: 'App',
    description: 'Services to clients needing data & insights, field project inspection, strategic assessment, and professional documentation.',
    url: 'https://app.amineva.com',
    status: 'live',
    isPublic: false,
    allowedRoles: ['super_admin', 'staff', 'customer'],
    isExternal: true,
    order: 2,
  },
  {
    id: 'ag-ops',
    name: 'AG Ops',
    shortName: 'Ops',
    description: 'Business operations platform allowing organizations/service providers to manage clients.',
    url: 'https://ops.amineva.com',
    status: 'coming_soon',
    isPublic: false,
    allowedRoles: ['super_admin', 'staff'],
    isExternal: true,
    order: 3,
  },
  {
    id: 'ag-stock',
    name: 'AG Stock',
    shortName: 'Stock',
    description: 'Secure inventory, sales, and loss-prevention platform for shop owners.',
    url: 'https://stock.amineva.com',
    status: 'live',
    isPublic: false,
    allowedRoles: ['super_admin', 'staff', 'customer'],
    isExternal: true,
    order: 4,
  },
];

// Load products from localStorage or return defaults
export function loadProducts(): ProductData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.error('Failed to load products from storage');
  }
  return DEFAULT_PRODUCTS;
}

// Save products to localStorage
export function saveProducts(products: ProductData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    // Dispatch event for same-tab updates
    window.dispatchEvent(new Event('productsUpdated'));
  } catch {
    console.error('Failed to save products to storage');
  }
}

// Reset products to defaults
export function resetProducts(): ProductData[] {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('productsUpdated'));
  return DEFAULT_PRODUCTS;
}
