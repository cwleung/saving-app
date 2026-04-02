import { useState } from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface TransactionListProps {
  onAddTransaction: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export function TransactionList({ onAddTransaction }: TransactionListProps) {
  const { transactions, deleteTransaction } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');

  const filtered = transactions
    .filter((t) => filter === 'all' || t.type === filter)
    .filter(
      (t) =>
        !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by description or category…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
        />
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={onAddTransaction}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          + Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No transactions found</p>
          <p className="text-sm mt-1">Add your first transaction to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center gap-4 p-4 ${
                i < filtered.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div
                className={`rounded-full p-2 shrink-0 ${
                  tx.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                }`}
              >
                {tx.type === 'income' ? (
                  <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">
                  {tx.description || tx.category}
                </p>
                <p className="text-xs text-gray-400">
                  {tx.category} · {new Date(tx.date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`font-semibold text-sm shrink-0 ${
                  tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {fmt(tx.amount)}
              </span>
              <button
                onClick={() => deleteTransaction(tx.id)}
                className="text-gray-300 hover:text-red-400 ml-1 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
