export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment' | 'refund';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
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
