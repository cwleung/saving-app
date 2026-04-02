import { create } from 'zustand';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Transaction, SavingsGoal } from '../types';

interface AppState {
  uid: string | null;
  transactions: Transaction[];
  goals: SavingsGoal[];
  loading: boolean;
  setUid: (uid: string | null) => void;
  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (goal: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
}

let unsubTransactions: (() => void) | null = null;
let unsubGoals: (() => void) | null = null;

export const useAppStore = create<AppState>()((set, get) => ({
  uid: null,
  transactions: [],
  goals: [],
  loading: false,

  setUid: (uid) => {
    unsubTransactions?.();
    unsubGoals?.();

    if (!uid) {
      set({ uid: null, transactions: [], goals: [], loading: false });
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
  },

  addTransaction: (tx) => {
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
}));
