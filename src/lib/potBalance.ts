import type { Transaction } from '../types';
import { getPotSignedAmount } from './transactionFlow';

/**
 * Computes the balance of a pot from its transactions.
 * Uses shared flow resolution so dashboard totals and pot balances
 * interpret legacy/new pot-linked transactions the same way.
 */
export function calcPotBalance(potId: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.potId === potId)
    .reduce((sum, t) => sum + getPotSignedAmount(t), 0);
}
