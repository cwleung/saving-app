import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatCurrencyShort } from '../lib/currency';

export function useCurrency() {
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const fmt = (n: number) => formatCurrency(n, currency);
  const fmtShort = (n: number) => formatCurrencyShort(n, currency);
  return { currency, setCurrency, fmt, fmtShort };
}
