import { isSealAuthenticated } from '@/lib/sealAuth';

export interface ProductRouteConfig {
  baseUrl: string;
  defaultPath: string;
  requiresCountry?: boolean;
}

export const PRODUCT_ROUTES: Record<string, ProductRouteConfig> = {
  workspace: {
    baseUrl: '',
    defaultPath: '/workspace',
    requiresCountry: false,
  },
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
    defaultPath: '/',
    requiresCountry: false,
  },
  agroclimate: {
    baseUrl: 'https://agro.amineva.com',
    defaultPath: '/',
    requiresCountry: false,
  },
  adesua: {
    baseUrl: 'https://as.amineva.com',
    defaultPath: '/',
    requiresCountry: false,
  },
  // Keep the legacy key for existing product records, but open the public Info Services page.
  datalens: {
    baseUrl: '',
    defaultPath: '/explainer/info-services',
    requiresCountry: false,
  },
  abi: {
    baseUrl: 'https://abi.amineva.com',
    defaultPath: '/',
    requiresCountry: false,
  },
};

export function getProductRedirectUrl(productKey: string, path?: string): string {
  const config = PRODUCT_ROUTES[productKey];
  if (!config) return '/workspace';
  const targetPath = path || config.defaultPath;
  if (!config.baseUrl) return targetPath;
  return `${config.baseUrl}${targetPath}`;
}

export function productRequiresCountry(productKey: string): boolean {
  return PRODUCT_ROUTES[productKey]?.requiresCountry ?? false;
}

export function shouldRouteToSuite(userRole?: string): boolean {
  if (typeof window !== 'undefined' && isSealAuthenticated()) {
    return userRole === 'super_admin' || userRole === 'manager';
  }
  return false;
}
