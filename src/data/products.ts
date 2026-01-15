import { ProductData } from '@/types/product';

const STORAGE_KEY = 'amineva_products';

// Default products for Amineva Suite
export const DEFAULT_PRODUCTS: ProductData[] = [
  {
    id: 'ag-main',
    name: 'AG Main',
    shortName: 'Main',
    description: 'Corporate website and public information',
    url: 'https://amineva.com',
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
    description: "Amineva's internal client and project workspace",
    url: 'https://app.amineva.com',
    status: 'restricted',
    isPublic: false,
    allowedRoles: ['super_admin', 'staff', 'customer'],
    isExternal: true,
    order: 2,
  },
  {
    id: 'ag-ops',
    name: 'AG Ops',
    shortName: 'Ops',
    description: 'A business operations platform that allows organizations to manage clients, staff, payments, files, and service workflows',
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
    description: 'A secure stock, sales, and loss-prevention platform for shop owners, traders, warehouses, and distributors',
    url: 'https://stock.amineva.com',
    status: 'coming_soon',
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
