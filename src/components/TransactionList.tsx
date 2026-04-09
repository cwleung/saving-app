import { useState } from 'react';
import { Trash2, Pencil, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, TrendingUp, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AddTransaction } from './AddTransaction';
import type { Transaction, TransactionType } from '../types';

interface TransactionListProps {
  onAddTransaction: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const TYPE_ICON: Record<TransactionType, React.ReactNode> = {
  income: <ArrowUpCircle className="w-5 h-5 text-emerald-600" />,
  expense: <ArrowDownCircle className="w-5 h-5 text-red-500" />,
  transfer: <ArrowLeftRight className="w-5 h-5 text-blue-500" />,
  investment: <TrendingUp className="w-5 h-5 text-purple-600" />,
  refund: <RotateCcw className="w-5 h-5 text-amber-500" />,
};

const TYPE_BG: Record<TransactionType, string> = {
  income: 'bg-emerald-100',
  expense: 'bg-red-100',
  transfer: 'bg-blue-100',
  investment: 'bg-purple-100',
  refund: 'bg-amber-100',
};

const TYPE_AMOUNT_COLOR: Record<TransactionType, string> = {
  income: 'text-emerald-600',
  expense: 'text-red-500',
  transfer: 'text-blue-600',
  investment: 'text-purple-600',
  refund: 'text-amber-600',
};

const AMOUNT_PREFIX: Record<TransactionType, string> = {
  income: '+',
  expense: '-',
  transfer: '→',
  investment: '↗',
  refund: '+',
};

const ALL_FILTER_TYPES = ['all', 'income', 'expense', 'transfer', 'investment', 'refund'] as const;
type FilterType = typeof ALL_FILTER_TYPES[number];

export function TransactionList({ onAddTransaction }: TransactionListProps) {
  const { transactions, deleteTransaction } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const filtered = transactions
    .filter((t) => filter === 'all' || t.type === filter)
    .filter(
      (t) =>
        !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4 pb-24 sm:pb-6">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
          />
          <button
            onClick={onAddTransaction}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            + Add
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {ALL_FILTER_TYPES.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer rounded-lg whitespace-nowrap ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
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
              className={`flex items-center gap-3 p-4 ${
                i < filtered.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className={`rounded-full p-2 shrink-0 ${TYPE_BG[tx.type]}`}>
                {TYPE_ICON[tx.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">
                  {tx.description || tx.category}
                </p>
                <p className="text-xs text-gray-400">
                  {tx.category} · {new Date(tx.date).toLocaleDateString()}
                </p>
              </div>
              <span className={`font-semibold text-sm shrink-0 ${TYPE_AMOUNT_COLOR[tx.type]}`}>
                {AMOUNT_PREFIX[tx.type]}
                {fmt(tx.amount)}
              </span>
              <button
                onClick={() => setEditTx(tx)}
                className="text-gray-300 hover:text-blue-400 ml-1 shrink-0 cursor-pointer"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteTransaction(tx.id)}
                className="text-gray-300 hover:text-red-400 shrink-0 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editTx && (
        <AddTransaction
          initialData={editTx}
          onClose={() => setEditTx(null)}
        />
      )}
    </div>
  );
}
