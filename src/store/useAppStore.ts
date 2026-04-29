import { create } from 'zustand';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
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
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMonthsClamped(d: Date, months: number, anchorDay: number): Date {
  const next = new Date(d);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(anchorDay, lastDay));
  return next;
}

function getOccurrences(frequency: Frequency, from: Date, to: Date, anchorDay: number): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (current <= end && dates.length < 100) {
    dates.push(new Date(current));
    switch (frequency) {
      case 'daily':     current.setDate(current.getDate() + 1);         break;
      case 'weekly':    current.setDate(current.getDate() + 7);         break;
      case 'biweekly':  current.setDate(current.getDate() + 14);        break;
      case 'monthly': {
        const next = addMonthsClamped(current, 1, anchorDay);
        current.setTime(next.getTime());
        break;
      }
      case 'quarterly': {
        const next = addMonthsClamped(current, 3, anchorDay);
        current.setTime(next.getTime());
        break;
      }
      case 'yearly': {
        const next = addMonthsClamped(current, 12, anchorDay);
        current.setTime(next.getTime());
        break;
      }
    }
  }
  return dates;
}

/** IDs already processed in this browser session — prevents duplicate writes on re-snapshots */
const processedRecurringSession = new Set<string>();
// In-flight guard: prevents re-entrant calls when Firestore snapshots fire
// mid-write (writing a transaction triggers a snapshot → calls this again)
const processingInFlight = new Set<string>();

async function autoGenerateRecurring(uid: string, items: RegularSpending[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  for (const item of items) {
    if (processingInFlight.has(item.id)) continue;
    processingInFlight.add(item.id);

    try {
      const itemStart = new Date(item.startDate + 'T00:00:00');
      if (Number.isNaN(itemStart.getTime())) continue;
      itemStart.setHours(0, 0, 0, 0);

      const startFrom = new Date(
        Math.max(itemStart.getTime(), threeMonthsAgo.getTime())
      );
      startFrom.setHours(0, 0, 0, 0);

      if (startFrom > today) continue;

      const endAt = item.endDate
        ? new Date(Math.min(new Date(item.endDate + 'T00:00:00').getTime(), today.getTime()))
        : new Date(today);
      endAt.setHours(0, 0, 0, 0);

      if (endAt < startFrom) continue;

      const occurrences = getOccurrences(item.frequency, startFrom, endAt, itemStart.getDate());
      if (occurrences.length === 0) continue;

      for (const date of occurrences) {
        const dateStr = localDateKey(date);
        const txId = `rec_${item.id}_${dateStr}`;
        const existing = await getDoc(doc(db, `users/${uid}/transactions/${txId}`));
        if (existing.exists()) continue;
        const tx: Transaction = {
          id: txId,
          type: item.transactionType,
          amount: item.amount,
          category: item.category,
          description: item.description ? `${item.name} — ${item.description}` : item.name,
          // Store local-midnight date, consistent with manual/add flows.
          date: new Date(dateStr + 'T00:00:00').toISOString(),
          recurringId: item.id,
          ...(item.goalId ? { goalId: item.goalId } : {}),
          ...(item.potId  ? { potId:  item.potId  } : {}),
        };
        await setDoc(doc(db, `users/${uid}/transactions/${txId}`), clean(tx));
      }
      // ✅ Do NOT write lastProcessedDate back — that Firestore write triggered
      // another snapshot → another autoGenerateRecurring → the duplicate bug.
      // The deterministic ID rec_<itemId>_<YYYY-MM-DD> is sufficient idempotency.
    } finally {
      processingInFlight.delete(item.id);
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
  currency: localStorage.getItem('currency') ?? 'GBP',

  setCurrency: (code) => {
    localStorage.setItem('currency', code);
    set({ currency: code });
  },

  setUid: (uid) => {
    // Clear session state so new login gets fresh generation
    processedRecurringSession.clear();

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
        void autoGenerateRecurring(uid, items);
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
  },

  updateTransaction: (tx) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/transactions/${tx.id}`), clean(tx));
  },

  deleteTransaction: (id) => {
    const uid = get().uid;
    if (!uid) return;
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
    // Clear from session Set so edited item gets re-processed on next snapshot
    processedRecurringSession.delete(item.id);
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
