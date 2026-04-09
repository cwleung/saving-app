import { create } from 'zustand';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Transaction, SavingsGoal, RegularSpending, UpcomingItem } from '../types';

interface AppState {
  uid: string | null;
  transactions: Transaction[];
  goals: SavingsGoal[];
  regularSpendings: RegularSpending[];
  upcomingItems: UpcomingItem[];
  loading: boolean;
  setUid: (uid: string | null) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (goal: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
  addRegularSpending: (item: RegularSpending) => void;
  updateRegularSpending: (item: RegularSpending) => void;
  deleteRegularSpending: (id: string) => void;
  addUpcomingItem: (item: UpcomingItem) => void;
  updateUpcomingItem: (item: UpcomingItem) => void;
  deleteUpcomingItem: (id: string) => void;
}

let unsubTransactions: (() => void) | null = null;
let unsubGoals: (() => void) | null = null;
let unsubRegular: (() => void) | null = null;
let unsubUpcoming: (() => void) | null = null;

export const useAppStore = create<AppState>()((set, get) => ({
  uid: null,
  transactions: [],
  goals: [],
  regularSpendings: [],
  upcomingItems: [],
  loading: false,

  setUid: (uid) => {
    unsubTransactions?.();
    unsubGoals?.();
    unsubRegular?.();
    unsubUpcoming?.();

    if (!uid) {
      set({ uid: null, transactions: [], goals: [], regularSpendings: [], upcomingItems: [], loading: false });
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

    unsubRegular = onSnapshot(
      collection(db, `users/${uid}/regularSpendings`),
      (snap) => {
        set({ regularSpendings: snap.docs.map((d) => d.data() as RegularSpending) });
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
    void setDoc(doc(db, `users/${uid}/transactions/${tx.id}`), tx);
  },

  updateTransaction: (tx) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/transactions/${tx.id}`), tx);
  },

  deleteTransaction: (id) => {
    const uid = get().uid;
    if (!uid) return;
    void deleteDoc(doc(db, `users/${uid}/transactions/${id}`));
  },

  addGoal: (goal) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/goals/${goal.id}`), goal);
  },

  updateGoal: (goal) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/goals/${goal.id}`), goal);
  },

  deleteGoal: (id) => {
    const uid = get().uid;
    if (!uid) return;
    void deleteDoc(doc(db, `users/${uid}/goals/${id}`));
  },

  addRegularSpending: (item) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/regularSpendings/${item.id}`), item);
  },

  updateRegularSpending: (item) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/regularSpendings/${item.id}`), item);
  },

  deleteRegularSpending: (id) => {
    const uid = get().uid;
    if (!uid) return;
    void deleteDoc(doc(db, `users/${uid}/regularSpendings/${id}`));
  },

  addUpcomingItem: (item) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/upcomingItems/${item.id}`), item);
  },

  updateUpcomingItem: (item) => {
    const uid = get().uid;
    if (!uid) return;
    void setDoc(doc(db, `users/${uid}/upcomingItems/${item.id}`), item);
  },

  deleteUpcomingItem: (id) => {
    const uid = get().uid;
    if (!uid) return;
    void deleteDoc(doc(db, `users/${uid}/upcomingItems/${id}`));
  },
}));
