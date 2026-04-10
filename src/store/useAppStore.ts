import { create } from 'zustand';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Firestore rejects undefined field values — strip them before writing
function clean<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}
import type { Transaction, SavingsGoal, RegularSpending, UpcomingItem, Frequency, Pot } from '../types';

// ─── Recurring-transaction auto-generation ───────────────────────────────────
function getOccurrences(frequency: Frequency, from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (current < end && dates.length < 100) {
    dates.push(new Date(current));
    switch (frequency) {
      case 'daily':     current.setDate(current.getDate() + 1);         break;
      case 'weekly':    current.setDate(current.getDate() + 7);         break;
      case 'biweekly':  current.setDate(current.getDate() + 14);        break;
      case 'monthly':   current.setMonth(current.getMonth() + 1);       break;
      case 'quarterly': current.setMonth(current.getMonth() + 3);       break;
      case 'yearly':    current.setFullYear(current.getFullYear() + 1); break;
    }
  }
  return dates;
}

/** IDs already processed in this browser session — prevents duplicate writes on re-snapshots */
const processedRecurringSession = new Set<string>();

async function autoGenerateRecurring(uid: string, items: RegularSpending[], goals: SavingsGoal[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Track how much to add to each goal's currentAmount from newly generated transactions
  const goalDeltas: Record<string, number> = {};

  for (const item of items) {
    if (processedRecurringSession.has(item.id)) continue;
    processedRecurringSession.add(item.id);

    const lastProcessed = item.lastProcessedDate
      ? new Date(item.lastProcessedDate + 'T00:00:00')
      : null;

    // Start from day after last-processed, or from max(startDate, 3-months-ago)
    const startFrom = lastProcessed
      ? new Date(lastProcessed.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Math.max(new Date(item.startDate + 'T00:00:00').getTime(), threeMonthsAgo.getTime()));
    startFrom.setHours(0, 0, 0, 0);

    if (startFrom >= today) continue;

    const endAt = item.endDate
      ? new Date(Math.min(new Date(item.endDate + 'T00:00:00').getTime(), today.getTime()))
      : new Date(today);
    endAt.setHours(0, 0, 0, 0);

    const occurrences = getOccurrences(item.frequency, startFrom, endAt);
    if (occurrences.length === 0) continue;

    for (const date of occurrences) {
      const dateStr = date.toISOString().split('T')[0];
      const txId = `rec_${item.id}_${dateStr}`;
      const tx: Transaction = {
        id: txId,
        type: item.transactionType,
        amount: item.amount,
        category: item.category,
        description: item.description ? `${item.name} — ${item.description}` : item.name,
        date: date.toISOString(),
        recurringId: item.id,
        ...(item.goalId ? { goalId: item.goalId } : {}),
        ...(item.potId  ? { potId:  item.potId  } : {}),
      };
      await setDoc(doc(db, `users/${uid}/transactions/${txId}`), clean(tx));
      if (item.goalId) {
        goalDeltas[item.goalId] = (goalDeltas[item.goalId] ?? 0) + item.amount;
      }
    }

    const todayStr = today.toISOString().split('T')[0];
    await setDoc(
      doc(db, `users/${uid}/regularSpendings/${item.id}`),
      clean({ ...item, lastProcessedDate: todayStr }),
    );
  }

  // Apply accumulated goal deltas
  for (const [goalId, delta] of Object.entries(goalDeltas)) {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      const updated = { ...goal, currentAmount: goal.currentAmount + delta };
      await setDoc(doc(db, `users/${uid}/goals/${goalId}`), clean(updated));
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

interface AppState {
  uid: string | null;
  transactions: Transaction[];
  goals: SavingsGoal[];
  pots: Pot[];
  regularSpendings: RegularSpending[];
  upcomingItems: UpcomingItem[];
  loading: boolean;
  currency: string;
  setCurrency: (code: string) => void;
  setUid: (uid: string | null) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (goal: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
  addPot: (pot: Pot) => void;
  updatePot: (pot: Pot) => void;
  deletePot: (id: string) => void;
  addRegularSpending: (item: RegularSpending) => void;
  updateRegularSpending: (item: RegularSpending) => void;
  deleteRegularSpending: (id: string) => void;
  addUpcomingItem: (item: UpcomingItem) => void;
  updateUpcomingItem: (item: UpcomingItem) => void;
  deleteUpcomingItem: (id: string) => void;
}

let unsubTransactions: (() => void) | null = null;
let unsubGoals: (() => void) | null = null;
let unsubPots: (() => void) | null = null;
let unsubRegular: (() => void) | null = null;
let unsubUpcoming: (() => void) | null = null;

export const useAppStore = create<AppState>()((set, get) => ({
  uid: null,
  transactions: [],
  goals: [],
  pots: [],
  regularSpendings: [],
  upcomingItems: [],
  loading: false,
  currency: localStorage.getItem('currency') ?? 'USD',

  setCurrency: (code) => {
    localStorage.setItem('currency', code);
    set({ currency: code });
  },

  setUid: (uid) => {
    unsubTransactions?.();
    unsubGoals?.();
    unsubPots?.();
    unsubRegular?.();
    unsubUpcoming?.();

    if (!uid) {
      set({ uid: null, transactions: [], goals: [], pots: [], regularSpendings: [], upcomingItems: [], loading: false });
      return;
    }

    set({ uid, loading: true });

    unsubTransactions = onSnapshot(
      collection(db, `users/${uid}/transactions`),
      (snap) => {
        const transactions = snap.docs
          .map((d) => d.data() as Transaction)
          .sort((a, b) => b.date.localeCompare(a.date));
        set({ transactions, loading: false });
      }
    );

    unsubGoals = onSnapshot(
      collection(db, `users/${uid}/goals`),
      (snap) => {
        set({ goals: snap.docs.map((d) => d.data() as SavingsGoal) });
      }
    );

    unsubPots = onSnapshot(
      collection(db, `users/${uid}/pots`),
      (snap) => {
        set({ pots: snap.docs.map((d) => d.data() as Pot) });
      }
    );

    unsubRegular = onSnapshot(
      collection(db, `users/${uid}/regularSpendings`),
      (snap) => {
        const items = snap.docs.map((d) => d.data() as RegularSpending);
        set({ regularSpendings: items });
        void autoGenerateRecurring(uid, items, get().goals);
      }
    );

    unsubUpcoming = onSnapshot(
      collection(db, `users/${uid}/upcomingItems`),
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as UpcomingItem)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        set({ upcomingItems: items });
      }
    );
  },

  addTransaction: (tx) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/transactions/${tx.id}`), clean(tx));
    // goalWithdrawal = true means money leaves the goal (subtract); otherwise adds to goal
    if (tx.goalId) {
      const goal = get().goals.find((g) => g.id === tx.goalId);
      if (goal) {
        const delta = tx.goalWithdrawal ? -tx.amount : tx.amount;
        const updated = { ...goal, currentAmount: Math.max(0, goal.currentAmount + delta) };
        void setDoc(doc(db, `users/${uid}/goals/${tx.goalId}`), clean(updated));
      }
    }
  },

  updateTransaction: (tx) => {
    const uid = get().uid;
    if (!uid) return;

    // Adjust goal currentAmounts when goalId or amount changes
    const oldTx = get().transactions.find((t) => t.id === tx.id);
    const goalDeltas: Record<string, number> = {};
    // Reverse the old transaction's effect
    if (oldTx?.goalId) {
      goalDeltas[oldTx.goalId] = (goalDeltas[oldTx.goalId] ?? 0) + (oldTx.goalWithdrawal ? oldTx.amount : -oldTx.amount);
    }
    // Apply the new transaction's effect
    if (tx.goalId) {
      goalDeltas[tx.goalId] = (goalDeltas[tx.goalId] ?? 0) + (tx.goalWithdrawal ? -tx.amount : tx.amount);
    }
    for (const [goalId, delta] of Object.entries(goalDeltas)) {
      if (delta === 0) continue;
      const goal = get().goals.find((g) => g.id === goalId);
      if (goal) {
        const updated = { ...goal, currentAmount: Math.max(0, goal.currentAmount + delta) };
        void setDoc(doc(db, `users/${uid}/goals/${goalId}`), clean(updated));
      }
    }

    void setDoc(doc(db, `users/${uid}/transactions/${tx.id}`), clean(tx));
  },

  deleteTransaction: (id) => {
    const uid = get().uid;
    if (!uid) return;
    // Reverse goal effect when deleting
    const tx = get().transactions.find((t) => t.id === id);
    if (tx?.goalId) {
      const goal = get().goals.find((g) => g.id === tx.goalId);
      if (goal) {
        // Reversal: if it was a withdrawal (subtracted), add back; if a deposit (added), subtract back
        const delta = tx.goalWithdrawal ? tx.amount : -tx.amount;
        const updated = { ...goal, currentAmount: Math.max(0, goal.currentAmount + delta) };
        void setDoc(doc(db, `users/${uid}/goals/${tx.goalId}`), clean(updated));
      }
    }
    void deleteDoc(doc(db, `users/${uid}/transactions/${id}`));
  },

  addGoal: (goal) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/goals/${goal.id}`), clean(goal));
  },

  updateGoal: (goal) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/goals/${goal.id}`), clean(goal));
  },

  deleteGoal: (id) => {
    const uid = get().uid;
    if (!uid) return;
    void deleteDoc(doc(db, `users/${uid}/goals/${id}`));
  },

  addPot: (pot) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/pots/${pot.id}`), clean(pot));
  },

  updatePot: (pot) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/pots/${pot.id}`), clean(pot));
  },

  deletePot: (id) => {
    const uid = get().uid;
    if (!uid) return;
    void deleteDoc(doc(db, `users/${uid}/pots/${id}`));
  },

  addRegularSpending: (item) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/regularSpendings/${item.id}`), clean(item));
  },

  updateRegularSpending: (item) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/regularSpendings/${item.id}`), clean(item));
  },

  deleteRegularSpending: (id) => {
    const uid = get().uid;
    if (!uid) return;
    // Delete all auto-generated transactions for this recurring item
    get().transactions
      .filter((t) => t.recurringId === id)
      .forEach((t) => void deleteDoc(doc(db, `users/${uid}/transactions/${t.id}`)));
    processedRecurringSession.delete(id);
    void deleteDoc(doc(db, `users/${uid}/regularSpendings/${id}`));
  },

  addUpcomingItem: (item) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/upcomingItems/${item.id}`), clean(item));
  },

  updateUpcomingItem: (item) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/upcomingItems/${item.id}`), clean(item));
  },

  deleteUpcomingItem: (id) => {
    const uid = get().uid;
    if (!uid) return;
    void deleteDoc(doc(db, `users/${uid}/upcomingItems/${id}`));
  },

}));
