import type { Transaction } from '../types';

/**
 * Computes the balance of a pot from its transactions.
 * expense | transfer = money into the pot (+)
 * income             = money out of the pot (−)
 */
export function calcPotBalance(potId: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.potId === potId)
    .reduce((sum, t) => {
      if (t.type === 'expense' || t.type === 'transfer') return sum + t.amount;
      if (t.type === 'income') return sum - t.amount;
      return sum;
    }, 0);
}
