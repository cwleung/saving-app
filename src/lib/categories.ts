import type { TransactionType } from '../types';

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance / Side Project',
  'Bonus',
  'Investment Income',
  'Rental Income',
  'Reimbursement',
  'Gift / Windfall',
  'Other',
] as const;

export const EXPENSE_CATEGORIES = [
  'Eat Out',
  'Groceries',
  'Transport',
  'Rent / Housing',
  'Utilities',
  'Insurance',
  'Subscriptions',
  'Shopping',
  'Entertainment',
  'Travel',
  'Education',
  'Healthcare',
  'Personal Care',
  'Debt Repayment',
  'Other',
] as const;

export const TRANSFER_CATEGORIES = [
  'Own Account Transfer',
  'Savings Move',
  'Investment Funding',
  'Other',
] as const;

export const INVESTMENT_CATEGORIES = [
  'Stocks',
  'ETF / Index Fund',
  'Crypto',
  'Bonds',
  'Real Estate',
  'Pension / Retirement',
  'Other',
] as const;

export const REFUND_CATEGORIES = [
  'Purchase Refund',
  'Service Refund',
  'Insurance Claim',
  'Tax Refund',
  'Other',
] as const;

export const CATEGORIES_BY_TRANSACTION_TYPE: Record<TransactionType, readonly string[]> = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
  transfer: TRANSFER_CATEGORIES,
  investment: INVESTMENT_CATEGORIES,
  refund: REFUND_CATEGORIES,
};

export const BULK_EDIT_CATEGORIES = [
  ...EXPENSE_CATEGORIES.filter((c) => c !== 'Other'),
  ...INCOME_CATEGORIES.filter((c) => c !== 'Other'),
  'Other',
] as const;

