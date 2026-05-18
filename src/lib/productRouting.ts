/**
 * Product Routing Configuration
 */

export interface ProductRouteConfig {
  baseUrl: string;
  defaultPath: string;
  requiresCountry?: boolean;
}

export const PRODUCT_ROUTES: Record<string, ProductRouteConfig> = {
  agstock: {
    baseUrl: 'https://stock.amineva.com',
    defaultPath: '/shop',
    requiresCountry: true,
  },
  agis: {
    baseUrl: 'https://app.amineva.com',
    defaultPath: '/dashboard',
    requiresCountry: false,
  },
  amniva: {
    baseUrl: 'https://amniva.com',
    defaultPath: '/dashboard',
    requiresCountry: false,
  },
  aminevaops: {
    baseUrl: 'https://ops.amineva.com',
    defaultPath: '/dashboard',
    requiresCountry: false,
  },
  agroclimate: {
    baseUrl: 'https://agro.amineva.com',
    defaultPath: '/',
    requiresCountry: false,
  },
};

export function getProductRedirectUrl(productKey: string, path?: string): string {
  const config = PRODUCT_ROUTES[productKey];
  if (!config) return '/suite';
  const targetPath = path || config.defaultPath;
  return `${config.baseUrl}${targetPath}`;
}

export function productRequiresCountry(productKey: string): boolean {
  return PRODUCT_ROUTES[productKey]?.requiresCountry ?? false;
}

export function shouldRouteToSuite(userRole?: string): boolean {
  return userRole === 'super_admin' || userRole === 'manager';
}
