/**
 * Product Routing Configuration
 * 
 * Defines external product URLs for routing after authentication.
 * Suite only routes users - it does NOT manage permissions.
 */

export interface ProductRouteConfig {
  baseUrl: string;
  defaultPath: string;
  requiresCountry?: boolean;
}

export const PRODUCT_ROUTES: Record<string, ProductRouteConfig> = {
  agstock: {
    baseUrl: 'https://stock.amineva.com',
    defaultPath: '/',
    requiresCountry: true,
  },
  agis: {
    baseUrl: 'https://app.amineva.com',
    defaultPath: '/',
    requiresCountry: false,
  },
  hub: {
    baseUrl: 'https://hub.amineva.com',
    defaultPath: '/',
    requiresCountry: false,
  },
  ops: {
    baseUrl: 'https://ops.amineva.com',
    defaultPath: '/',
    requiresCountry: false,
  },
  amniva: {
    baseUrl: 'https://www.amniva.io',
    defaultPath: '/',
    requiresCountry: false,
  },
};

/**
 * Get the full redirect URL for a product
 */
export function getProductRedirectUrl(productKey: string, path?: string): string {
  const config = PRODUCT_ROUTES[productKey];
  if (!config) {
    return '/suite'; // Fallback to suite dashboard
  }
  
  const targetPath = path || config.defaultPath;
  return `${config.baseUrl}${targetPath}`;
}

/**
 * Check if a product requires country selection
 */
export function productRequiresCountry(productKey: string): boolean {
  return PRODUCT_ROUTES[productKey]?.requiresCountry ?? false;
}

/**
 * Determine if a user should be routed to Suite dashboard
 * Only managers/super_admins access Suite dashboard
 */
export function shouldRouteToSuite(userRole?: string): boolean {
  return userRole === 'super_admin' || userRole === 'manager';
}
