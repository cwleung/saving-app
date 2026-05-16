import type { Transaction } from '../types';

type PotFlowDirection = 'in' | 'out';

const POT_IN_EXPENSE_CATEGORIES = new Set(['Pot Deposit', 'Savings Goal', 'Balance Adjustment']);
const POT_OUT_INCOME_CATEGORIES = new Set(['Pot Withdrawal', 'Goal Withdrawal', 'Balance Adjustment']);

type PotFlowTx = Pick<
  Transaction,
  'type' | 'potId' | 'potDirection' | 'goalId' | 'goalWithdrawal' | 'category'
>;

/**
 * Resolves how a pot-linked transaction should move pot balance.
 *
 * Priority:
 * 1) explicit `potDirection` for new data
 * 2) legacy fallbacks by type/category/goal markers for existing data
 */
export function getPotFlowDirection(tx: PotFlowTx): PotFlowDirection | null {
  if (!tx.potId) return null;
  if (tx.potDirection === 'in' || tx.potDirection === 'out') return tx.potDirection;

  if (tx.type === 'transfer') return 'in';

  if (tx.type === 'income') {
    if (tx.goalWithdrawal || tx.goalId || POT_OUT_INCOME_CATEGORIES.has(tx.category)) return 'out';
    return 'in';
  }

  if (tx.type === 'expense') {
    if (tx.goalId || POT_IN_EXPENSE_CATEGORIES.has(tx.category)) return 'in';
    return 'out';
  }

  return null;
}

export function isPotExpenseOutflow(tx: PotFlowTx): boolean {
  return tx.type === 'expense' && getPotFlowDirection(tx) === 'out';
}

export function isSavingsDraw(tx: PotFlowTx): boolean {
  return tx.type === 'income' && (Boolean(tx.goalWithdrawal) || getPotFlowDirection(tx) === 'out');
}
