// Supported African countries for MITO payments
export const SUPPORTED_COUNTRIES = [
  { code: 'NGA', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KEN', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'GHA', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'TZA', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UGA', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'RWA', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
  { code: 'ZAF', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
] as const;

export const SERVICE_CODES = [
  { code: 'BILLPAYMENT', name: 'Bill Payment', description: 'Pay utility bills, school fees, etc.' },
  { code: 'MONEYTRANSFER', name: 'Money Transfer', description: 'Send money to bank or mobile wallet' },
  { code: 'MOBILETOPUP', name: 'Mobile Top-up', description: 'Airtime and data bundles' },
] as const;

export const COLLECTION_MODES = [
  { code: 'BANKACCOUNT', name: 'Bank Account', description: 'Direct bank transfer' },
  { code: 'MOBILEMONEY', name: 'Mobile Money', description: 'M-Pesa, MTN, Airtel, etc.' },
  { code: 'CASH', name: 'Cash', description: 'Cash collection points' },
] as const;

// Helper to get country by code
export function getCountryByCode(code: string) {
  return SUPPORTED_COUNTRIES.find(c => c.code === code);
}

// Helper to get currency by country
export function getCurrencyByCountry(countryCode: string) {
  const country = getCountryByCode(countryCode);
  return country?.currency || 'USD';
}
