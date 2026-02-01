export type GatewayStep =
  | 'product_selection'
  | 'country_selection'
  | 'auth'
  | 'routing';

export interface GatewayState {
  step: GatewayStep;
  selectedProductKey: string | null;
  selectedCountryCode: string | null;
  selectedCurrencyCode: string | null;
}

const STORAGE_KEY = 'amineva_gateway_state';

export function loadGatewayState(): GatewayState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {
    step: 'product_selection',
    selectedProductKey: null,
    selectedCountryCode: null,
    selectedCurrencyCode: null,
  };
}

export function saveGatewayState(state: Partial<GatewayState>): void {
  const current = loadGatewayState();
  const updated = { ...current, ...state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearGatewayState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
