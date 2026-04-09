export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  /** Decimal digits to display */
  decimals: number;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',          decimals: 0 },
  { code: 'EUR', symbol: '€',   name: 'Euro',               decimals: 0 },
  { code: 'GBP', symbol: '£',   name: 'British Pound',      decimals: 0 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar',   decimals: 0 },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',       decimals: 0 },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',       decimals: 0 },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',   decimals: 0 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar',    decimals: 0 },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',  decimals: 0 },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc',        decimals: 0 },
  { code: 'KRW', symbol: '₩',   name: 'Korean Won',         decimals: 0 },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',       decimals: 0 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 0 },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar',      decimals: 0 },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit',  decimals: 0 },
];

export function formatCurrency(amount: number, code: string): string {
  const opt = CURRENCIES.find((c) => c.code === code);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: opt?.decimals ?? 0,
    maximumFractionDigits: opt?.decimals ?? 0,
  }).format(amount);
}

export function formatCurrencyShort(amount: number, code: string): string {
  const opt = CURRENCIES.find((c) => c.code === code);
  const sym = opt?.symbol ?? code;
  if (Math.abs(amount) >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${sym}${(amount / 1_000).toFixed(1)}k`;
  return `${sym}${amount.toFixed(0)}`;
}
