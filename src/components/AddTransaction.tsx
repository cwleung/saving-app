import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { TransactionType } from '../types';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = [
  'Food',
  'Housing',
  'Transport',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Utilities',
  'Education',
  'Other',
];

interface AddTransactionProps {
  onClose: () => void;
}

export function AddTransaction({ onClose }: AddTransactionProps) {
  const addTransaction = useAppStore((s) => s.addTransaction);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addTransaction({
      id: crypto.randomUUID(),
      type,
      amount: parseFloat(amount),
      category: category || categories[0],
      description,
      date: new Date(date).toISOString(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="font-semibold text-gray-800 text-lg">Add Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory('');
                }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize cursor-pointer ${
                  type === t
                    ? t === 'income'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Amount ($)</label>
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

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 transition-colors cursor-pointer"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
