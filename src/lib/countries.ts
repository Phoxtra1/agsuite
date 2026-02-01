// Country to currency mapping for AGStock
export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'GH', name: 'Ghana', currency: 'GHS', currencySymbol: '₵' },
  { code: 'KE', name: 'Kenya', currency: 'KES', currencySymbol: 'KSh' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', currencySymbol: 'FRw' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', currencySymbol: 'TSh' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', currencySymbol: 'USh' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', currencySymbol: 'ZK' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', currencySymbol: '$' },
];

export function getCurrencyFromCountry(countryCode: string): { currency: string; symbol: string } | null {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  if (!country) return null;
  return { currency: country.currency, symbol: country.currencySymbol };
}
