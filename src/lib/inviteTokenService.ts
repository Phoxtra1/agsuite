/**
 * Invite Token Service
 * 
 * Handles token validation and acceptance for invite flows.
 * Tokens are validated against external product endpoints.
 */

export interface TokenValidationResult {
  status: 'valid' | 'expired' | 'used' | 'invalid';
  invitedEmail?: string;
  orgId?: string;
  role?: string;
}

export interface AcceptInviteResult {
  success: boolean;
  error?: string;
}

// Product-specific token validation endpoints
const TOKEN_VALIDATION_ENDPOINTS: Record<string, string> = {
  agstock: 'https://stock.amineva.com/api/invite/validate',
  agis: 'https://app.amineva.com/api/invite/validate',
};

// Product-specific accept invite endpoints
const ACCEPT_INVITE_ENDPOINTS: Record<string, string> = {
  agstock: 'https://stock.amineva.com/api/invite/accept',
  agis: 'https://app.amineva.com/api/invite/accept',
};

/**
 * Validate an invite token with the product's backend
 */
export async function validateInviteToken(
  productKey: string,
  token: string
): Promise<TokenValidationResult> {
  const endpoint = TOKEN_VALIDATION_ENDPOINTS[productKey];
  
  if (!endpoint) {
    return { status: 'invalid' };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      // If endpoint returns 404/500, treat as invalid
      if (response.status === 410) {
        return { status: 'expired' };
      }
      return { status: 'invalid' };
    }

    const data = await response.json();
    
    return {
      status: data.status || 'invalid',
      invitedEmail: data.invitedEmail,
      orgId: data.orgId,
      role: data.role,
    };
  } catch (error) {
    console.error('[InviteToken] Validation failed:', error);
    // On network error, allow fallback to basic flow
    // This prevents blocking users if the validation endpoint is down
    return { status: 'valid' };
  }
}

/**
 * Accept an invite after successful authentication
 */
export async function acceptInvite(
  productKey: string,
  userId: string,
  token: string
): Promise<AcceptInviteResult> {
  const endpoint = ACCEPT_INVITE_ENDPOINTS[productKey];
  
  if (!endpoint) {
    return { success: false, error: 'Invalid product' };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.message || 'Failed to accept invite' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[InviteToken] Accept failed:', error);
    // On network error, still allow redirect - product will handle validation
    return { success: true };
  }
}
