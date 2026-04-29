import { useState } from 'react';
import { Plus, Trash2, Pencil, X, CheckCircle2, Clock, AlertCircle, CalendarOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories';
import type { UpcomingItem } from '../types';


function daysFromNow(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getGroup(item: UpcomingItem): string {
  if (!item.dueDate) return 'Unscheduled';
  const days = daysFromNow(item.dueDate);
  if (days < 0)   return 'Overdue';
  if (days === 0)  return 'Today';
  if (days <= 7)   return 'This Week';
  if (days <= 30)  return 'This Month';
  if (days <= 90)  return 'Next 3 Months';
  return 'Later';
}

const GROUP_ORDER = ['Overdue', 'Today', 'This Week', 'This Month', 'Next 3 Months', 'Later', 'Unscheduled'];

interface FormData {
  name: string;
  amount: string;
  category: string;
  dueDate: string;        // empty string = no date set
  transactionType: 'income' | 'expense';
  description: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  amount: '',
  category: '',
  dueDate: '',            // truly optional — no default pre-fill
  transactionType: 'expense',
  description: '',
};

// Clearable date input
function DateField({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 rounded-xl px-3 py-3 text-[15px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label="Clear date"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function UpcomingSpendingPage() {
  const { upcomingItems, addUpcomingItem, updateUpcomingItem, deleteUpcomingItem, addTransaction } = useAppStore();
  const { fmt } = useCurrency();
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
      dueDate: item.dueDate ?? '',
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
      dueDate: form.dueDate || '',
      transactionType: form.transactionType,
      description: form.description || undefined,
      isPaid: editItem?.isPaid ?? false,
    };
    if (editItem) updateUpcomingItem(item);
    else addUpcomingItem(item);
    setShowForm(false);
  }

  const pending = upcomingItems.filter((i) => !i.isPaid);
  const paid    = upcomingItems.filter((i) =>  i.isPaid);

  const totalPending  = pending.filter((i) => i.transactionType === 'expense').reduce((s, i) => s + i.amount, 0);
  const totalIncoming = pending.filter((i) => i.transactionType === 'income' ).reduce((s, i) => s + i.amount, 0);
  const netUpcoming   = totalIncoming - totalPending;

  const groups: Record<string, UpcomingItem[]> = {};
  pending.forEach((item) => {
    const g = getGroup(item);
    (groups[g] ??= []).push(item);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Upcoming</h1>
          <p className="text-sm text-gray-400 mt-0.5">Scheduled payments &amp; income</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Summary row */}
      {upcomingItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Due Out</p>
            <p className="text-lg font-bold text-red-500 mt-1 truncate">{fmt(totalPending)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Coming In</p>
            <p className="text-lg font-bold text-emerald-600 mt-1 truncate">{fmt(totalIncoming)}</p>
          </div>
          <div className={`rounded-2xl p-4 border shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${netUpcoming >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Net</p>
            <p className={`text-lg font-bold mt-1 truncate ${netUpcoming >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(netUpcoming)}</p>
          </div>
        </div>
      )}

      {upcomingItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">Nothing upcoming</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">Track bills, rent, paydays — anything on the horizon.</p>
          <button
            onClick={openAdd}
            className="mt-5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full cursor-pointer transition-colors"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <>
          {/* Timeline groups */}
          <div className="space-y-5">
            {GROUP_ORDER.filter((g) => groups[g]?.length).map((groupName) => (
              <div key={groupName}>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  {groupName === 'Overdue'     && <AlertCircle  className="w-3.5 h-3.5 text-red-500" />}
                  {groupName === 'Today'       && <Clock        className="w-3.5 h-3.5 text-amber-500" />}
                  {groupName === 'Unscheduled' && <CalendarOff  className="w-3.5 h-3.5 text-gray-400" />}
                  {!['Overdue', 'Today', 'Unscheduled'].includes(groupName) && <Clock className="w-3.5 h-3.5 text-gray-400" />}
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${
                    groupName === 'Overdue' ? 'text-red-500' :
                    groupName === 'Today'   ? 'text-amber-600' : 'text-gray-400'
                  }`}>
                    {groupName}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-gray-50">
                  {groups[groupName].map((item) => {
                    const days = item.dueDate ? daysFromNow(item.dueDate) : null;
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                        {/* Check button */}
                        <button
                          onClick={() => {
                            updateUpcomingItem({ ...item, isPaid: true });
                            addTransaction({
                              id: crypto.randomUUID(),
                              type: item.transactionType,
                              amount: item.amount,
                              category: item.category,
                              description: item.name + (item.description ? ` — ${item.description}` : ''),
                              date: new Date().toISOString(),
                              upcomingId: item.id,
                            });
                          }}
                          className="shrink-0 w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                          title="Mark as done"
                        >
                          <div className="w-2.5 h-2.5 rounded-full" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.category}
                            {item.dueDate
                              ? ` · ${new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${
                                  days === 0 ? ' · Today' : days !== null && days > 0 ? ` · ${days}d away` : days !== null ? ` · ${Math.abs(days)}d ago` : ''
                                }`
                              : ' · No date set'}
                          </p>
                        </div>

                        <span className={`font-bold text-sm shrink-0 ${
                          item.transactionType === 'income' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {item.transactionType === 'income' ? '+' : '−'}{fmt(item.amount)}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteUpcomingItem(item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Paid items */}
          {paid.length > 0 && (
            <div>
              <button
                onClick={() => setShowPaid(!showPaid)}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1.5 px-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {showPaid ? 'Hide' : 'Show'} {paid.length} completed item{paid.length !== 1 ? 's' : ''}
              </button>
              {showPaid && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-gray-50 mt-2 opacity-50">
                  {paid.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                      <button
                        onClick={() => updateUpcomingItem({ ...item, isPaid: false })}
                        className="shrink-0 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-500 text-sm truncate line-through">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.category}{item.dueDate ? ` · ${new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-gray-400">{fmt(item.amount)}</span>
                      <button
                        onClick={() => deleteUpcomingItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[95dvh] overflow-y-auto">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {editItem ? 'Edit Item' : 'New Upcoming Item'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {/* Type segmented control */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, transactionType: t, category: '' }))}
                    className={`flex-1 py-2 text-sm font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                      form.transactionType === t
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rent, Paycheck, Electric Bill"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Amount + Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Amount
                  </label>
                  <input
                    type="number" min="0.01" step="0.01" required
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-gray-50 rounded-xl px-3 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Due Date <span className="normal-case font-normal text-gray-300">(optional)</span>
                  </label>
                  <DateField
                    value={form.dueDate}
                    onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))}
                    onClear={() => setForm((f) => ({ ...f, dueDate: '' }))}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                >
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Notes <span className="normal-case font-normal text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Add a note…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold rounded-2xl py-3.5 text-[15px] transition-all cursor-pointer mt-2 shadow-sm"
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
