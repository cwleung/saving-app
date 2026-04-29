import { useState, useMemo } from 'react';
import { Trash2, Pencil, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, TrendingUp, RotateCcw, ArrowUpDown, ChevronDown, CheckSquare, Square, Tag, X, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import { AddTransaction } from './AddTransaction';
import type { Transaction, TransactionType } from '../types';

interface TransactionListProps {
  onAddTransaction: () => void;
}

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

const ALL_CATEGORIES = [
  'Food & Dining', 'Housing & Rent', 'Transport', 'Entertainment', 'Healthcare',
  'Shopping', 'Utilities', 'Education', 'Insurance', 'Personal Care',
  'Subscriptions', 'Travel', 'Childcare', 'Debt Payment',
  'Salary', 'Freelance', 'Investment Returns', 'Rental Income', 'Business Income', 'Bonus',
  'Other',
];

const ALL_FILTER_TYPES = ['all', 'income', 'expense', 'transfer', 'investment', 'refund'] as const;
type FilterType = typeof ALL_FILTER_TYPES[number];
type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'category-asc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc',    label: 'Date: Newest first' },
  { value: 'date-asc',     label: 'Date: Oldest first' },
  { value: 'amount-desc',  label: 'Amount: High to low' },
  { value: 'amount-asc',   label: 'Amount: Low to high' },
  { value: 'category-asc', label: 'Category: A–Z' },
  { value: 'name-asc',     label: 'Name: A–Z' },
  { value: 'name-desc',    label: 'Name: Z–A' },
];

export function TransactionList({ onAddTransaction }: TransactionListProps) {
  const { transactions, updateTransaction } = useAppStore();
  const { fmt } = useCurrency();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  // Bulk edit state
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const filtered = useMemo(() => {
    let list = transactions
      .filter((t) => filter === 'all' || t.type === filter)
      .filter(
        (t) =>
          !search ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      );

    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo)   list = list.filter((t) => t.date <= dateTo + 'T23:59:59');

    switch (sortKey) {
      case 'date-desc':    list = [...list].sort((a, b) => b.date.localeCompare(a.date)); break;
      case 'date-asc':     list = [...list].sort((a, b) => a.date.localeCompare(b.date)); break;
      case 'amount-desc':  list = [...list].sort((a, b) => b.amount - a.amount); break;
      case 'amount-asc':   list = [...list].sort((a, b) => a.amount - b.amount); break;
      case 'category-asc': list = [...list].sort((a, b) => a.category.localeCompare(b.category)); break;
      case 'name-asc':     list = [...list].sort((a, b) => (a.description || a.category).localeCompare(b.description || b.category)); break;
      case 'name-desc':    list = [...list].sort((a, b) => (b.description || b.category).localeCompare(a.description || a.category)); break;
    }
    return list;
  }, [transactions, filter, search, sortKey, dateFrom, dateTo]);

  const hasActiveFilters = filter !== 'all' || dateFrom || dateTo || search;
  const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));
  const someSelected = selected.size > 0;

  function toggleBulkMode() {
    setBulkMode((v) => !v);
    setSelected(new Set());
    setBulkCategory('');
    setShowBulkConfirm(false);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  }

  function applyBulkCategory() {
    if (!bulkCategory || selected.size === 0) return;
    transactions
      .filter((t) => selected.has(t.id))
      .forEach((t) => updateTransaction({ ...t, category: bulkCategory }));
    setSelected(new Set());
    setBulkCategory('');
    setShowBulkConfirm(false);
    setBulkMode(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4 pb-24 sm:pb-6">
      <div className="flex flex-col gap-3">
        {/* Search + Add + Filter toggle */}
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>
          {/* Bulk edit toggle */}
          <button
            onClick={toggleBulkMode}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
              bulkMode
                ? 'bg-violet-50 border-violet-300 text-violet-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
            title="Bulk edit categories"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">{bulkMode ? 'Cancel' : 'Bulk'}</span>
          </button>
          <button
            onClick={onAddTransaction}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            + Add
          </button>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide shrink-0 w-16">Sort</label>
              <div className="relative flex-1">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer pr-8"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide shrink-0 w-16">Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-gray-400 text-xs shrink-0">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilter('all'); setDateFrom(''); setDateTo(''); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Type filter chips */}
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

      {/* Bulk edit toolbar */}
      {bulkMode && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-semibold text-violet-700 cursor-pointer hover:text-violet-900 transition-colors"
              >
                {allSelected
                  ? <CheckSquare className="w-4 h-4" />
                  : <Square className="w-4 h-4" />}
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              {someSelected && (
                <span className="text-xs text-violet-500 font-medium">
                  {selected.size} selected
                </span>
              )}
            </div>
            <button onClick={toggleBulkMode} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {someSelected && (
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <select
                  value={bulkCategory}
                  onChange={(e) => { setBulkCategory(e.target.value); setShowBulkConfirm(false); }}
                  className="w-full appearance-none bg-white border border-violet-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer pr-8"
                >
                  <option value="">— Pick new category —</option>
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {bulkCategory && !showBulkConfirm && (
                <button
                  onClick={() => setShowBulkConfirm(true)}
                  className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Tag className="w-3.5 h-3.5" />
                  Apply
                </button>
              )}

              {showBulkConfirm && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-violet-700 font-medium whitespace-nowrap">
                    Set {selected.size} to "{bulkCategory}"?
                  </span>
                  <button
                    onClick={applyBulkCategory}
                    className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Yes
                  </button>
                  <button
                    onClick={() => setShowBulkConfirm(false)}
                    className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> No
                  </button>
                </div>
              )}
            </div>
          )}

          {!someSelected && (
            <p className="text-xs text-violet-400">Select transactions below to reassign their category.</p>
          )}
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-gray-400">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {hasActiveFilters ? ' matching filters' : ''}
      </p>

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
              onClick={() => bulkMode && toggleSelect(tx.id)}
              className={`flex items-center gap-3 p-4 transition-colors ${
                i < filtered.length - 1 ? 'border-b border-gray-100' : ''
              } ${bulkMode ? 'cursor-pointer' : ''} ${
                bulkMode && selected.has(tx.id) ? 'bg-violet-50' : bulkMode ? 'hover:bg-gray-50' : ''
              }`}
            >
              {/* Checkbox (bulk mode only) */}
              {bulkMode && (
                <div className="shrink-0 text-violet-500">
                  {selected.has(tx.id)
                    ? <CheckSquare className="w-4 h-4" />
                    : <Square className="w-4 h-4 text-gray-300" />}
                </div>
              )}

              <div className={`rounded-full p-2 shrink-0 ${TYPE_BG[tx.type]}`}>
                {TYPE_ICON[tx.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">
                  {tx.description || tx.category}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 flex-wrap">
                  {tx.category} · {new Date(tx.date).toLocaleDateString()}
                  {tx.recurringId && (
                    <span className="bg-blue-100 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">Recurring</span>
                  )}
                  {tx.upcomingId && (
                    <span className="bg-amber-100 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">Scheduled</span>
                  )}
                  {tx.goalId && (
                    <span className="bg-purple-100 text-purple-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">Goal</span>
                  )}
                </p>
              </div>
              <span className={`font-semibold text-sm shrink-0 ${TYPE_AMOUNT_COLOR[tx.type]}`}>
                {AMOUNT_PREFIX[tx.type]}
                {fmt(tx.amount)}
              </span>

              {/* Edit/delete hidden in bulk mode */}
              {!bulkMode && (
                <>
                  <button
                    onClick={() => setEditTx(tx)}
                    className="text-gray-300 hover:text-blue-400 ml-1 shrink-0 cursor-pointer"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const { deleteTransaction } = useAppStore.getState();
                      deleteTransaction(tx.id);
                    }}
                    className="text-gray-300 hover:text-red-400 shrink-0 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
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