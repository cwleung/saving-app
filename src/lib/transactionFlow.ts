import type { RegularSpending, Transaction } from '../types';

type PotFlowDirection = 'in' | 'out';

const POT_IN_EXPENSE_CATEGORIES = new Set(['Pot Deposit', 'Savings Goal', 'Balance Adjustment']);
const POT_OUT_INCOME_CATEGORIES = new Set(['Pot Withdrawal', 'Goal Withdrawal', 'Balance Adjustment']);

type PotFlowTx = Pick<
  Transaction,
  'type' | 'potId' | 'potDirection' | 'goalId' | 'goalWithdrawal' | 'category' | 'description' | 'recurringId' | 'amount'
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

  const description = tx.description?.toLowerCase() ?? '';
  const isDepositLike = /\bdeposit\b/.test(description) || tx.category === 'Pot Deposit';

  if (tx.potDirection === 'in' || tx.potDirection === 'out') {
    // Legacy recurring pot top-ups were sometimes saved as expense+out.
    if (tx.potDirection === 'out' && tx.type === 'expense' && tx.recurringId && isDepositLike) return 'in';
    return tx.potDirection;
  }

  if (tx.type === 'transfer') return 'in';

  if (tx.type === 'income') {
    if (tx.goalWithdrawal || POT_OUT_INCOME_CATEGORIES.has(tx.category)) return 'out';
    return 'in';
  }

  if (tx.type === 'expense') {
    if (tx.goalId || POT_IN_EXPENSE_CATEGORIES.has(tx.category)) return 'in';
    // Legacy support: some recurring pot top-ups were saved as `expense` + potId.
    if (tx.recurringId && isDepositLike) return 'in';
    return 'out';
  }

  return null;
}

export function getPotSignedAmount(tx: PotFlowTx): number {
  const direction = getPotFlowDirection(tx);
  if (direction === 'in') return tx.amount;
  if (direction === 'out') return -tx.amount;
  return 0;
}

type PotRecurringTx = Pick<RegularSpending, 'transactionType' | 'potId' | 'category' | 'name' | 'description'>;

export function getRecurringPotFlowDirection(item: PotRecurringTx): PotFlowDirection | null {
  if (!item.potId) return null;
  if (item.transactionType === 'income') return 'in';

  const text = `${item.name} ${item.description ?? ''} ${item.category}`.toLowerCase();
  const isLegacyDepositLike = /\bdeposit\b/.test(text) || item.category === 'Pot Deposit';
  return isLegacyDepositLike ? 'in' : 'out';
}

export function isPotExpenseOutflow(tx: PotFlowTx): boolean {
  return tx.type === 'expense' && getPotFlowDirection(tx) === 'out';
}

export function isSavingsDraw(tx: PotFlowTx): boolean {
  return tx.type === 'income' && (Boolean(tx.goalWithdrawal) || getPotFlowDirection(tx) === 'out');
}

/**
 * Budget expense:
 * - regular expenses except pot-funded spending
 * - pot deposits recorded as income+pot(in) in legacy/alt flows
 */
export function isDashboardExpense(tx: PotFlowTx): boolean {
  if (tx.type === 'expense') return !isPotExpenseOutflow(tx);
  return tx.type === 'income' && getPotFlowDirection(tx) === 'in';
}

/**
 * Budget income excludes internal savings transfers.
 */
export function isDashboardIncome(tx: PotFlowTx): boolean {
  if (tx.type === 'refund') return true;
  if (tx.type !== 'income') return false;
  return !isSavingsDraw(tx) && getPotFlowDirection(tx) !== 'in';
}
