export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment' | 'refund';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  goalId?: string;
  /** true when this transaction withdraws money back out of a goal (reduces goal balance) */
  goalWithdrawal?: boolean;
  potId?: string;
  /** Optional explicit pot flow direction to avoid inferring from transaction type */
  potDirection?: 'in' | 'out';
  recurringId?: string;
  upcomingId?: string;
}

export interface Pot {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  /** @deprecated — balance is derived from pot transactions, not stored here */
  currentAmount?: number;
  color: string;
  /** The pot this goal is backed by (every new goal must have one) */
  potId?: string;
  startDate?: string;
  deadline?: string;
}

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RegularSpending {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: Frequency;
  startDate: string;
  endDate?: string;
  transactionType: 'income' | 'expense';
  description?: string;
  lastProcessedDate?: string;
  goalId?: string;
  potId?: string;
}

export interface UpcomingItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string;
  transactionType: 'income' | 'expense';
  description?: string;
  isPaid: boolean;
}
