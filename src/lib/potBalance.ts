import type { Transaction } from '../types';

/**
 * Computes the balance of a pot from its transactions.
 * New transactions can set `potDirection` explicitly:
 * - in  => money into pot (+)
 * - out => money out of pot (−)
 *
 * Legacy fallback (for existing data):
 * - expense | transfer => into pot (+)
 * - income             => out of pot (−)
 */
export function calcPotBalance(potId: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.potId === potId)
    .reduce((sum, t) => {
      if (t.potDirection === 'in') return sum + t.amount;
      if (t.potDirection === 'out') return sum - t.amount;
      if (t.type === 'expense' || t.type === 'transfer') return sum + t.amount;
      if (t.type === 'income') return sum - t.amount;
      return sum;
    }, 0);
}
