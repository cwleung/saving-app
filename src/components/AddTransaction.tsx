import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import type { Transaction, TransactionType } from '../types';

const CATEGORIES: Record<TransactionType, string[]> = {
  income: ['Salary', 'Freelance', 'Investment Returns', 'Rental Income', 'Business Income', 'Bonus', 'Gift', 'Tax Refund', 'Other'],
  expense: ['Food & Dining', 'Housing & Rent', 'Transport', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Education', 'Insurance', 'Personal Care', 'Subscriptions', 'Travel', 'Childcare', 'Debt Payment', 'Other'],
  transfer: ['Bank Transfer', 'Savings Transfer', 'Investment Transfer', 'Other'],
  investment: ['Stocks', 'Crypto', 'Real Estate', 'ETF/Index Fund', 'Retirement (401k/IRA)', 'Bonds', 'Other'],
  refund: ['Product Return', 'Tax Refund', 'Insurance Claim', 'Service Refund', 'Other'],
};

const TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  investment: 'Investment',
  refund: 'Refund',
};

const TYPE_COLORS: Record<TransactionType, string> = {
  income: 'bg-emerald-600 text-white',
  expense: 'bg-red-500 text-white',
  transfer: 'bg-blue-500 text-white',
  investment: 'bg-purple-600 text-white',
  refund: 'bg-amber-500 text-white',
};

interface AddTransactionProps {
  onClose: () => void;
  initialData?: Transaction;
}

export function AddTransaction({ onClose, initialData }: AddTransactionProps) {
  const { addTransaction, updateTransaction, goals } = useAppStore();
  const { currency } = useCurrency();
  const isEdit = !!initialData;

  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense');
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [date, setDate] = useState(
    initialData
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [goalId, setGoalId] = useState(initialData?.goalId ?? '');

  const categories = CATEGORIES[type];
  const showGoalSelector = (type === 'income' || type === 'expense' || type === 'refund') && goals.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tx: Transaction = {
      id: initialData?.id ?? crypto.randomUUID(),
      type,
      amount: parseFloat(amount),
      category: category || categories[0],
      description,
      date: new Date(date).toISOString(),
      goalId: goalId || undefined,
    };
    if (isEdit) {
      updateTransaction(tx);
    } else {
      addTransaction(tx);
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-800 text-lg">
            {isEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-5 gap-1 rounded-xl overflow-hidden border border-gray-200">
            {(Object.keys(TYPE_LABELS) as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory('');
                  setGoalId('');
                }}
                className={`py-2 text-xs font-medium transition-colors cursor-pointer ${
                  type === t ? TYPE_COLORS[t] : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Amount ({currency})</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {showGoalSelector && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {type === 'expense' ? 'Deposit into goal' : 'Contribute to goal'}{' '}
                <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 transition-colors cursor-pointer"
          >
            {isEdit ? 'Save Changes' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
