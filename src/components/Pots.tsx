import { useState } from 'react';
import {
  Plus, Trash2, X, ArrowUpCircle, ArrowDownCircle,
  Pencil, ChevronDown, ChevronUp, PiggyBank, RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import type { Pot, Frequency } from '../types';

const POT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#14b8a6'];

const MONTHLY_FACTOR: Record<Frequency, number> = {
  daily: 30.44,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

interface PotForm {
  name: string;
  description: string;
}
const EMPTY_FORM: PotForm = { name: '', description: '' };

export function PotsPage() {
  const { pots, addPot, updatePot, deletePot, addTransaction, transactions, regularSpendings } =
    useAppStore();
  const { fmt } = useCurrency();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<PotForm>(EMPTY_FORM);
  const [editPot, setEditPot] = useState<Pot | null>(null);
  const [editForm, setEditForm] = useState<PotForm>(EMPTY_FORM);
  const [actionPotId, setActionPotId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [actionAmount, setActionAmount] = useState('');
  const [expandedPotId, setExpandedPotId] = useState<string | null>(null);

  function potBalance(potId: string) {
    return transactions
      .filter((t) => t.potId === potId)
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);
  }

  const totalBalance = pots.reduce((s, p) => s + potBalance(p.id), 0);
  const totalMonthlyIn = pots.reduce((s, p) =>
    s + regularSpendings
      .filter((r) => r.potId === p.id && r.transactionType === 'income')
      .reduce((ss, r) => ss + r.amount * (MONTHLY_FACTOR[r.frequency] ?? 1), 0), 0);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    addPot({
      id: crypto.randomUUID(),
      name: form.name,
      color: POT_COLORS[pots.length % POT_COLORS.length],
      description: form.description || undefined,
    });
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  function openEdit(pot: Pot) {
    setEditPot(pot);
    setEditForm({ name: pot.name, description: pot.description ?? '' });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPot) return;
    updatePot({ ...editPot, name: editForm.name, description: editForm.description || undefined });
    setEditPot(null);
  }

  function handleAction(pot: Pot, balance: number) {
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) return;
    if (actionMode === 'withdraw' && amt > balance) return;
    addTransaction({
      id: crypto.randomUUID(),
      type: actionMode === 'deposit' ? 'income' : 'expense',
      amount: amt,
      category: actionMode === 'deposit' ? 'Pot Deposit' : 'Pot Withdrawal',
      description: `${actionMode === 'deposit' ? 'Deposit to' : 'Withdrawal from'} ${pot.name}`,
      date: new Date().toISOString(),
      potId: pot.id,
    });
    setActionPotId(null);
    setActionAmount('');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pots</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ring-fence money for any purpose</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Pot
        </button>
      </div>

      {/* Stats */}
      {pots.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-1.5 mb-1">
              <PiggyBank className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total in Pots</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{fmt(totalBalance)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{pots.length} pot{pots.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-1.5 mb-1">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Monthly In</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{totalMonthlyIn > 0 ? fmt(totalMonthlyIn) : '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">from recurring</p>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">New Pot</h3>
            <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="px-5 py-4 space-y-3">
            <input
              type="text"
              placeholder="Pot name (e.g. Travel, Car, Emergency)"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
            />
            <p className="text-xs text-indigo-600 bg-indigo-50 rounded-xl px-4 py-3 leading-relaxed">
              💡 Go to <strong>Regular</strong> → add an income item → link it to this pot for automatic monthly deposits.
            </p>
            <button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-bold rounded-2xl py-3.5 text-[15px] transition-all cursor-pointer shadow-sm"
            >
              Create Pot
            </button>
          </form>
        </div>
      )}

      {/* Empty state */}
      {pots.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <PiggyBank className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="font-semibold text-gray-700">No pots yet</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            Create a pot for travel, emergencies, or anything — then set up a recurring deposit
            to build it up automatically each month.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full cursor-pointer transition-colors"
          >
            Create your first pot
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pots.map((pot) => {
            const balance = potBalance(pot.id);
            const potTxs = transactions
              .filter((t) => t.potId === pot.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            const linked = regularSpendings.filter((r) => r.potId === pot.id);
            const monthlyIn  = linked.filter((r) => r.transactionType === 'income' ).reduce((s, r) => s + r.amount * (MONTHLY_FACTOR[r.frequency] ?? 1), 0);
            const monthlyOut = linked.filter((r) => r.transactionType === 'expense').reduce((s, r) => s + r.amount * (MONTHLY_FACTOR[r.frequency] ?? 1), 0);
            const isExpanded = expandedPotId === pot.id;
            const isActioning = actionPotId === pot.id;
            const amt = parseFloat(actionAmount);
            const overBalance = actionMode === 'withdraw' && !!actionAmount && amt > balance;

            return (
              <div key={pot.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="h-1.5 w-full" style={{ background: pot.color }} />
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: pot.color + '20' }}>
                        <PiggyBank className="w-5 h-5" style={{ color: pot.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{pot.name}</h3>
                        {pot.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{pot.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => openEdit(pot)} className="text-gray-300 hover:text-blue-400 cursor-pointer transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletePot(pot.id)} className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Balance</p>
                    <p className="text-3xl font-bold mt-0.5" style={{ color: pot.color }}>{fmt(balance)}</p>
                  </div>

                  {/* Recurring summary */}
                  {(monthlyIn > 0 || monthlyOut > 0) && (
                    <div className="flex gap-2 mb-4">
                      {monthlyIn > 0 && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 rounded-xl px-3 py-1.5">
                          <RefreshCw className="w-3 h-3 text-emerald-500" />
                          <p className="text-xs font-semibold text-emerald-700">+{fmt(monthlyIn)}/mo</p>
                        </div>
                      )}
                      {monthlyOut > 0 && (
                        <div className="flex items-center gap-1.5 bg-red-50 rounded-xl px-3 py-1.5">
                          <RefreshCw className="w-3 h-3 text-red-400" />
                          <p className="text-xs font-semibold text-red-600">-{fmt(monthlyOut)}/mo</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deposit / Withdraw — compact single-row */}
                  {isActioning ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {/* +/− toggle */}
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActionMode('deposit')}
                            className={`w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer ${actionMode === 'deposit' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                          >+</button>
                          <button
                            type="button"
                            onClick={() => setActionMode('withdraw')}
                            className={`w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer border-l border-gray-200 ${actionMode === 'withdraw' ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                          >−</button>
                        </div>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={actionAmount}
                          onChange={(e) => setActionAmount(e.target.value)}
                          placeholder="Amount…"
                          autoFocus
                          className={`flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors ${actionMode === 'deposit' ? 'focus:ring-emerald-400' : 'focus:ring-red-400'}`}
                        />
                        <button
                          onClick={() => handleAction(pot, balance)}
                          disabled={!actionAmount || amt <= 0 || overBalance}
                          className="w-8 h-8 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl cursor-pointer shrink-0 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setActionPotId(null); setActionAmount(''); }}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {overBalance && (
                        <p className="text-xs text-red-500 pl-1">Amount exceeds pot balance ({fmt(balance)})</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setActionPotId(pot.id); setActionMode('deposit'); setActionAmount(''); }}
                      className="text-sm font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                      style={{ color: pot.color }}
                    >
                      <Plus className="w-4 h-4" /> Add / Withdraw
                    </button>
                  )}

                  {/* Transaction history */}
                  {potTxs.length > 0 && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => setExpandedPotId(isExpanded ? null : pot.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer w-full"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {potTxs.length} transaction{potTxs.length !== 1 ? 's' : ''}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                          {potTxs.map((t) => (
                            <div key={t.id} className="flex items-center gap-2 text-xs">
                              {t.type === 'income' ? (
                                <ArrowUpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              ) : (
                                <ArrowDownCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              )}
                              <span className="flex-1 text-gray-600 truncate">{t.description || t.category}</span>
                              <span className="text-gray-400 shrink-0">
                                {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className={`font-semibold shrink-0 ${t.type === 'income' ? 'text-indigo-600' : 'text-red-500'}`}>
                                {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editPot && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setEditPot(null)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Edit Pot</h2>
              <button onClick={() => setEditPot(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-5 py-5 space-y-3">
              <input
                type="text"
                placeholder="Pot name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-bold rounded-2xl py-3.5 text-[15px] transition-all cursor-pointer shadow-sm"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
