export type GatewayStep =
  | 'product_selection'
  | 'country_selection'
  | 'auth'
  | 'routing';

export type ForcedDestination =
  | 'AGSTOCK_EMPLOYEE'
  | 'AGSUITE_DASHBOARD'
  | null;

export interface GatewayState {
  step: GatewayStep;

  // Product & locale
  selectedProductKey: string | null;
  selectedCountryCode: string | null;
  selectedCurrencyCode: string | null;

  // Invite context
  inviteToken: string | null;

  // Hard routing lock
  forcedDestination: ForcedDestination;
}

const STORAGE_KEY = 'amineva_gateway_state';

/* ---------------- LOAD ---------------- */

export function loadGatewayState(): GatewayState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }

  return getEmptyState();
}

/* ---------------- SAVE ---------------- */

export function saveGatewayState(
  state: Partial<GatewayState>
): void {
  const current = loadGatewayState();
  const updated = { ...current, ...state };

  // 🔒 INVITE ALWAYS WINS
  if (updated.inviteToken) {
    updated.forcedDestination = 'AGSTOCK_EMPLOYEE';
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/* ---------------- CLEAR ---------------- */

export function clearGatewayState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/* ---------------- HELPERS ---------------- */

export function setInviteToken(token: string) {
  saveGatewayState({
    inviteToken: token,
    forcedDestination: 'AGSTOCK_EMPLOYEE',
    step: 'routing',
  });
}

export function clearInviteToken() {
  const current = loadGatewayState();
  saveGatewayState({
    ...current,
    inviteToken: null,
    forcedDestination: null,
  });
}

export function getForcedDestination(): ForcedDestination {
  const state = loadGatewayState();
  return state.forcedDestination;
}

function getEmptyState(): GatewayState {
  return {
    step: 'product_selection',
    selectedProductKey: null,
    selectedCountryCode: null,
    selectedCurrencyCode: null,
    inviteToken: null,
    forcedDestination: null,
  };
}
