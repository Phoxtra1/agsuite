/**
 * Invite Bridge System
 * 
 * AG Suite handles invite validation handoff:
 * - /invite/agstock?token=XXXX → validates with AGStock, redirects to stock.amineva.com/employees
 * - /invite/agis?token=YYYY → validates with AGIS, redirects to app.amineva.com/team
 * 
 * Suite does NOT interpret roles or permissions.
 * Suite only validates invite intent and routes users.
 */

export type InviteProduct = 'agstock' | 'agis';

export interface InviteIntent {
  productKey: InviteProduct;
  token: string;
  timestamp: number;
}

export interface InviteValidationResponse {
  tokenValid: boolean;
  inviteType?: 'employee' | 'team';
  shopId?: string;    // AGStock employee invites
  orgId?: string;     // AGIS team invites
  projectId?: string; // AGIS project-specific invites
  error?: string;
}

const STORAGE_KEY = 'amineva_invite_intent';

// Product endpoints for invite validation
const PRODUCT_ENDPOINTS: Record<InviteProduct, string> = {
  agstock: 'https://stock.amineva.com/api/validate-invite',
  agis: 'https://app.amineva.com/api/validate-invite',
};

// Post-validation redirect URLs (Suite routes to entry points, apps handle PIN/roles)
const PRODUCT_REDIRECTS: Record<InviteProduct, Record<string, string>> = {
  agstock: {
    employee: 'https://stock.amineva.com/employees', // Employee dashboard entry - AGStock handles PIN
  },
  agis: {
    team: 'https://app.amineva.com/team', // Team panel entry - handles registration
  },
};

/**
 * Store invite intent before authentication
 */
export function storeInviteIntent(productKey: InviteProduct, token: string): void {
  const intent: InviteIntent = {
    productKey,
    token,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
}

/**
 * Retrieve stored invite intent
 */
export function getInviteIntent(): InviteIntent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const intent = JSON.parse(stored) as InviteIntent;
    
    // Expire after 1 hour
    if (Date.now() - intent.timestamp > 3600000) {
      clearInviteIntent();
      return null;
    }
    
    return intent;
  } catch {
    return null;
  }
}

/**
 * Clear invite intent after processing
 */
export function clearInviteIntent(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Validate invite token with the respective product backend
 * AG Suite does NOT interpret roles - only validates and routes
 */
export async function validateInviteWithProduct(
  productKey: InviteProduct,
  token: string,
  userAccessToken?: string
): Promise<InviteValidationResponse> {
  const endpoint = PRODUCT_ENDPOINTS[productKey];
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Pass user's auth token if available
    if (userAccessToken) {
      headers['Authorization'] = `Bearer ${userAccessToken}`;
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      return {
        tokenValid: false,
        error: 'Invite validation failed',
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Invite validation error:', error);
    return {
      tokenValid: false,
      error: 'Unable to validate invite. Please try again.',
    };
  }
}

/**
 * Get redirect URL based on invite validation response
 */
export function getInviteRedirectUrl(
  productKey: InviteProduct,
  validationResponse: InviteValidationResponse
): string | null {
  if (!validationResponse.tokenValid || !validationResponse.inviteType) {
    return null;
  }
  
  const redirects = PRODUCT_REDIRECTS[productKey];
  return redirects[validationResponse.inviteType] || null;
}

/**
 * Check if current URL is an invite route
 */
export function parseInviteRoute(pathname: string, search: string): { productKey: InviteProduct; token: string } | null {
  const inviteMatch = pathname.match(/^\/invite\/(agstock|agis)$/);
  if (!inviteMatch) return null;
  
  const productKey = inviteMatch[1] as InviteProduct;
  const params = new URLSearchParams(search);
  const token = params.get('token');
  
  if (!token) return null;
  
  return { productKey, token };
}
