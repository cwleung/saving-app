import { useState } from 'react';
import { Plus, Trash2, Pencil, X, RepeatIcon, ArrowRightLeft, PiggyBank } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import type { RegularSpending, Frequency } from '../types';

const FREQUENCIES: { value: Frequency; label: string; shortLabel: string }[] = [
  { value: 'daily',     label: 'Daily',     shortLabel: '/day'  },
  { value: 'weekly',    label: 'Weekly',    shortLabel: '/wk'   },
  { value: 'biweekly',  label: 'Bi-weekly', shortLabel: '/2wk'  },
  { value: 'monthly',   label: 'Monthly',   shortLabel: '/mo'   },
  { value: 'quarterly', label: 'Quarterly', shortLabel: '/qtr'  },
  { value: 'yearly',    label: 'Yearly',    shortLabel: '/yr'   },
];

const FREQ_MULTIPLIER: Record<Frequency, number> = {
  daily: 365,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Housing & Rent', 'Transport', 'Entertainment', 'Healthcare',
  'Shopping', 'Utilities', 'Education', 'Insurance', 'Personal Care',
  'Subscriptions', 'Travel', 'Childcare', 'Debt Payment', 'Other',
];
const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment Returns', 'Rental Income', 'Business Income', 'Bonus', 'Other',
];

interface FormData {
  name: string;
  amount: string;
  category: string;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  transactionType: 'income' | 'expense';
  description: string;
  goalId: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  amount: '',
  category: '',
  frequency: 'monthly',
  startDate: '',   // truly optional — no default pre-fill
  endDate: '',
  transactionType: 'expense',
  description: '',
  goalId: '',
};

// Small helper — clearable date input with explicit ×  button
function DateField({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
        {label} <span className="normal-case font-normal text-gray-300">(optional)</span>
      </label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function RegularSpendingPage() {
  const { regularSpendings, goals, addRegularSpending, updateRegularSpending, deleteRegularSpending, addTransaction } = useAppStore();
  const { fmt } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<RegularSpending | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const categories = form.transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: RegularSpending) {
    setEditItem(item);
    setForm({
      name: item.name,
      amount: String(item.amount),
      category: item.category,
      frequency: item.frequency,
      startDate: item.startDate ?? '',
      endDate: item.endDate ?? '',
      transactionType: item.transactionType,
      description: item.description ?? '',
      goalId: item.goalId ?? '',
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const item: RegularSpending = {
      id: editItem?.id ?? crypto.randomUUID(),
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category || categories[0],
      frequency: form.frequency,
      startDate: form.startDate || new Date().toISOString().split('T')[0],
      endDate: form.endDate || undefined,
      transactionType: form.transactionType,
      description: form.description || undefined,
      goalId: form.goalId || undefined,
    };
    if (editItem) updateRegularSpending(item);
    else addRegularSpending(item);
    setShowForm(false);
  }

  const incomeItems  = regularSpendings.filter((r) => r.transactionType === 'income');
  const expenseItems = regularSpendings.filter((r) => r.transactionType === 'expense');

  const totalMonthlyIncome  = incomeItems .reduce((s, r) => s + (r.amount * FREQ_MULTIPLIER[r.frequency]) / 12, 0);
  const totalMonthlyExpense = expenseItems.reduce((s, r) => s + (r.amount * FREQ_MULTIPLIER[r.frequency]) / 12, 0);
  const netMonthly = totalMonthlyIncome - totalMonthlyExpense;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Regular</h1>
          <p className="text-sm text-gray-400 mt-0.5">Recurring income &amp; expenses</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Summary row */}
      {regularSpendings.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Income/mo</p>
            <p className="text-lg font-bold text-emerald-600 mt-1 truncate">{fmt(totalMonthlyIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Expense/mo</p>
            <p className="text-lg font-bold text-red-500 mt-1 truncate">{fmt(totalMonthlyExpense)}</p>
          </div>
          <div className={`rounded-2xl p-4 border shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${netMonthly >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Net/mo</p>
            <p className={`text-lg font-bold mt-1 truncate ${netMonthly >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(netMonthly)}</p>
          </div>
        </div>
      )}

      {regularSpendings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <RepeatIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">No recurring items</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">Add rent, subscriptions, salary — anything that repeats.</p>
          <button
            onClick={openAdd}
            className="mt-5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full cursor-pointer transition-colors"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {([
            { label: 'Income',   items: incomeItems,  colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
            { label: 'Expenses', items: expenseItems, colorClass: 'text-red-500',     bgClass: 'bg-red-100'     },
          ] as const).map(({ label, items, colorClass, bgClass }) =>
            items.length > 0 ? (
              <div key={label}>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{label}</p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-gray-50">
                  {items.map((item) => {
                    const monthlyAmt = (item.amount * FREQ_MULTIPLIER[item.frequency]) / 12;
                    const freqLabel = FREQUENCIES.find((f) => f.value === item.frequency)?.shortLabel ?? '';
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.goalId ? 'bg-violet-100' : bgClass}`}>
                          {item.goalId
                            ? <PiggyBank className="w-4 h-4 text-violet-500" />
                            : <RepeatIcon className={`w-4 h-4 ${colorClass}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                            {item.goalId && (
                              <span className="text-[10px] font-semibold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full shrink-0">
                                {goals.find((g) => g.id === item.goalId)?.name ?? 'Pot'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.category}
                            {item.endDate && ` · ends ${new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0 mr-1">
                          <p className={`font-bold text-sm ${colorClass}`}>
                            {fmt(item.amount)}<span className="font-normal text-gray-400 text-xs">{freqLabel}</span>
                          </p>
                          <p className="text-xs text-gray-400">{fmt(monthlyAmt)}/mo</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => addTransaction({
                              id: crypto.randomUUID(),
                              type: item.transactionType,
                              amount: item.amount,
                              category: item.category,
                              description: item.name,
                              date: new Date().toISOString(),
                              ...(item.goalId ? { goalId: item.goalId } : {}),
                            })}
                            title="Log as transaction today"
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRegularSpending(item.id)}
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
            ) : null
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[95dvh] overflow-y-auto">
            {/* Modal handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {editItem ? 'Edit Recurring' : 'New Recurring'}
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
                  placeholder="e.g. Netflix, Rent, Salary"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Amount + Frequency */}
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
                    Frequency
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))}
                    className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
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

              {/* Dates — both truly optional with clear button */}
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label="Start Date"
                  value={form.startDate}
                  onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
                  onClear={() => setForm((f) => ({ ...f, startDate: '' }))}
                />
                <DateField
                  label="End Date"
                  value={form.endDate}
                  onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
                  onClear={() => setForm((f) => ({ ...f, endDate: '' }))}
                />
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

              {/* Goal / Pot (expense only) */}
              {form.transactionType === 'expense' && goals.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Fund a Pot <span className="normal-case font-normal text-gray-300">(optional)</span>
                  </label>
                  <select
                    value={form.goalId}
                    onChange={(e) => setForm((f) => ({ ...f, goalId: e.target.value }))}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  >
                    <option value="">— None —</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold rounded-2xl py-3.5 text-[15px] transition-all cursor-pointer mt-2 shadow-sm"
              >
                {editItem ? 'Save Changes' : 'Add Recurring Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

