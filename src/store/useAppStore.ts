import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, SavingsGoal } from '../types';

interface AppState {
  transactions: Transaction[];
  goals: SavingsGoal[];
  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (goal: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      transactions: [],
      goals: [],
      addTransaction: (tx) =>
        set((s) => ({ transactions: [tx, ...s.transactions] })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, goal] })),
      updateGoal: (goal) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === goal.id ? goal : g)) })),
      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
    }),
    { name: 'saving-app-store' }
  )
);
