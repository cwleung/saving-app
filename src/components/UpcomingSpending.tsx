import { useState } from 'react';
import { Plus, Trash2, Pencil, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { UpcomingItem } from '../types';

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Housing & Rent', 'Transport', 'Entertainment', 'Healthcare',
  'Shopping', 'Utilities', 'Education', 'Insurance', 'Personal Care',
  'Subscriptions', 'Travel', 'Childcare', 'Debt Payment', 'Other',
];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment Returns', 'Rental Income', 'Bonus', 'Tax Refund', 'Other'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

function daysFromNow(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface FormData {
  name: string;
  amount: string;
  category: string;
  dueDate: string;
  transactionType: 'income' | 'expense';
  description: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  amount: '',
  category: '',
  dueDate: new Date().toISOString().split('T')[0],
  transactionType: 'expense',
  description: '',
};

export function UpcomingSpendingPage() {
  const { upcomingItems, addUpcomingItem, updateUpcomingItem, deleteUpcomingItem } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<UpcomingItem | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [showPaid, setShowPaid] = useState(false);

  const categories = form.transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: UpcomingItem) {
    setEditItem(item);
    setForm({
      name: item.name,
      amount: String(item.amount),
      category: item.category,
      dueDate: item.dueDate,
      transactionType: item.transactionType,
      description: item.description ?? '',
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const item: UpcomingItem = {
      id: editItem?.id ?? crypto.randomUUID(),
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category || categories[0],
      dueDate: form.dueDate,
      transactionType: form.transactionType,
      description: form.description || undefined,
      isPaid: editItem?.isPaid ?? false,
    };
    if (editItem) {
      updateUpcomingItem(item);
    } else {
      addUpcomingItem(item);
    }
    setShowForm(false);
  }

  const pending = upcomingItems.filter((i) => !i.isPaid);
  const paid = upcomingItems.filter((i) => i.isPaid);

  const totalPending = pending
    .filter((i) => i.transactionType === 'expense')
    .reduce((s, i) => s + i.amount, 0);
  const totalIncoming = pending
    .filter((i) => i.transactionType === 'income')
    .reduce((s, i) => s + i.amount, 0);

  // Group pending by time bucket
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  function getGroup(item: UpcomingItem): string {
    const days = daysFromNow(item.dueDate);
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days <= 7) return 'This Week';
    if (days <= 30) return 'This Month';
    if (days <= 90) return 'Next 3 Months';
    return 'Later';
  }

  const GROUP_ORDER = ['Overdue', 'Today', 'This Week', 'This Month', 'Next 3 Months', 'Later'];

  const groups: Record<string, UpcomingItem[]> = {};
  pending.forEach((item) => {
    const g = getGroup(item);
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 pb-24 sm:pb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-gray-800">Upcoming</h2>
          <p className="text-xs text-gray-400 mt-0.5">Track scheduled payments & income</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Upcoming Expenses</p>
          <p className="text-xl font-bold text-red-600 mt-1">{fmt(totalPending)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Upcoming Income</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{fmt(totalIncoming)}</p>
        </div>
      </div>

      {upcomingItems.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No upcoming items</p>
          <p className="text-sm mt-1">Add bills, subscriptions, or expected income</p>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="space-y-5">
            {GROUP_ORDER.filter((g) => groups[g]?.length).map((groupName) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-2">
                  {groupName === 'Overdue' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {groupName === 'Today' && <Clock className="w-4 h-4 text-amber-500" />}
                  {!['Overdue', 'Today'].includes(groupName) && <Clock className="w-4 h-4 text-gray-400" />}
                  <h3 className={`text-xs font-semibold uppercase tracking-wide ${
                    groupName === 'Overdue' ? 'text-red-500' :
                    groupName === 'Today' ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {groupName}
                  </h3>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {groups[groupName].map((item, i, arr) => {
                    const days = daysFromNow(item.dueDate);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-4 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <button
                          onClick={() => updateUpcomingItem({ ...item, isPaid: !item.isPaid })}
                          className={`shrink-0 rounded-full p-1.5 cursor-pointer transition-colors ${
                            item.isPaid ? 'bg-emerald-100' : 'bg-gray-100 hover:bg-emerald-50'
                          }`}
                          title={item.isPaid ? 'Mark unpaid' : 'Mark paid'}
                        >
                          <CheckCircle2 className={`w-5 h-5 ${item.isPaid ? 'text-emerald-600' : 'text-gray-300'}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {item.category} · {new Date(item.dueDate).toLocaleDateString()}
                            {days === 0 ? ' · Today' : days > 0 ? ` · in ${days}d` : ` · ${Math.abs(days)}d ago`}
                          </p>
                        </div>
                        <span className={`font-semibold text-sm shrink-0 ${
                          item.transactionType === 'income' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {item.transactionType === 'income' ? '+' : '-'}{fmt(item.amount)}
                        </span>
                        <button onClick={() => openEdit(item)} className="text-gray-300 hover:text-blue-400 cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteUpcomingItem(item.id)} className="text-gray-300 hover:text-red-400 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Paid Items Toggle */}
          {paid.length > 0 && (
            <div>
              <button
                onClick={() => setShowPaid(!showPaid)}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {showPaid ? 'Hide' : 'Show'} {paid.length} paid item{paid.length !== 1 ? 's' : ''}
              </button>
              {showPaid && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-2 opacity-60">
                  {paid.map((item, i) => (
                    <div key={item.id} className={`flex items-center gap-3 p-4 ${i < paid.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <button
                        onClick={() => updateUpcomingItem({ ...item, isPaid: false })}
                        className="shrink-0 rounded-full p-1.5 cursor-pointer bg-emerald-100"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-500 text-sm truncate line-through">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.category} · {new Date(item.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className="font-semibold text-sm text-gray-400">{fmt(item.amount)}</span>
                      <button onClick={() => deleteUpcomingItem(item.id)} className="text-gray-300 hover:text-red-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">{editItem ? 'Edit Item' : 'Add Upcoming Item'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, transactionType: t, category: '' }))}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize cursor-pointer ${
                      form.transactionType === t
                        ? t === 'income' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Name (e.g. Rent, Paycheck)"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
                  <input
                    type="number" min="0.01" step="0.01" required
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                  <input
                    type="date" required
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <input
                type="text"
                placeholder="Notes (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 transition-colors cursor-pointer"
              >
                {editItem ? 'Save Changes' : 'Add Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
