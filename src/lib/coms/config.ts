/** Environment-driven ComsSystem configuration */

export const COMS_CONFIG = {
  apiBase: import.meta.env.VITE_COMS_API_BASE || 'https://coms.amineva.com/a1',
  mockMode: (import.meta.env.VITE_COMS_MOCK_MODE ?? 'true') === 'true',
  timeoutMs: Number(import.meta.env.VITE_COMS_TIMEOUT_MS) || 12000,
} as const;
