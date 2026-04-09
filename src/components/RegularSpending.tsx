import { useState } from 'react';
import { Plus, Trash2, Pencil, X, RepeatIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import type { RegularSpending, Frequency } from '../types';

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const FREQ_MULTIPLIER: Record<Frequency, number> = {  daily: 365,
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
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment Returns', 'Rental Income', 'Business Income', 'Bonus', 'Other'];

interface FormData {
  name: string;
  amount: string;
  category: string;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  transactionType: 'income' | 'expense';
  description: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  amount: '',
  category: '',
  frequency: 'monthly',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  transactionType: 'expense',
  description: '',
};

export function RegularSpendingPage() {
  const { regularSpendings, addRegularSpending, updateRegularSpending, deleteRegularSpending } = useAppStore();
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
      startDate: item.startDate,
      endDate: item.endDate ?? '',
      transactionType: item.transactionType,
      description: item.description ?? '',
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
    };
    if (editItem) {
      updateRegularSpending(item);
    } else {
      addRegularSpending(item);
    }
    setShowForm(false);
  }

  // Group by type
  const incomeItems = regularSpendings.filter((r) => r.transactionType === 'income');
  const expenseItems = regularSpendings.filter((r) => r.transactionType === 'expense');

  const totalMonthlyIncome = incomeItems.reduce((s, r) => s + (r.amount * FREQ_MULTIPLIER[r.frequency]) / 12, 0);
  const totalMonthlyExpense = expenseItems.reduce((s, r) => s + (r.amount * FREQ_MULTIPLIER[r.frequency]) / 12, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 pb-24 sm:pb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-gray-800">Regular Spending</h2>
          <p className="text-xs text-gray-400 mt-0.5">Recurring income and expenses</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Recurring
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Monthly Recurring Income</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{fmt(totalMonthlyIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Monthly Recurring Expenses</p>
          <p className="text-xl font-bold text-red-600 mt-1">{fmt(totalMonthlyExpense)}</p>
        </div>
      </div>

      {regularSpendings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <RepeatIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No recurring items yet</p>
          <p className="text-sm mt-1">Add rent, subscriptions, salary, etc.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[{ label: 'Recurring Income', items: incomeItems, color: 'emerald' }, { label: 'Recurring Expenses', items: expenseItems, color: 'red' }].map(({ label, items, color }) =>
            items.length > 0 ? (
              <div key={label}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</h3>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {items.map((item, i) => {
                    const annualAmt = item.amount * FREQ_MULTIPLIER[item.frequency];
                    const monthlyAmt = annualAmt / 12;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-4 ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className={`rounded-full p-2 shrink-0 ${color === 'emerald' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          <RepeatIcon className={`w-4 h-4 ${color === 'emerald' ? 'text-emerald-600' : 'text-red-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {item.category} · {FREQUENCIES.find((f) => f.value === item.frequency)?.label}
                            {item.endDate && ` · ends ${new Date(item.endDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-semibold text-sm ${color === 'emerald' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {fmt(item.amount)}
                          </p>
                          <p className="text-xs text-gray-400">{fmt(monthlyAmt)}/mo</p>
                        </div>
                        <button onClick={() => openEdit(item)} className="text-gray-300 hover:text-blue-400 cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteRegularSpending(item.id)} className="text-gray-300 hover:text-red-400 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-800">{editItem ? 'Edit Recurring Item' : 'Add Recurring Item'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Type */}
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
                placeholder="Name (e.g. Netflix, Rent)"
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
                  <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date (opt.)</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date (opt.)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
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
                {editItem ? 'Save Changes' : 'Add Recurring Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
