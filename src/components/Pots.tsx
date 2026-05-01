import { useState } from 'react';
import {
  Plus, Trash2, X, ArrowUpCircle, ArrowDownCircle,
  Pencil, ChevronDown, ChevronUp, PiggyBank, RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import type { Pot, Frequency } from '../types';
import { calcPotBalance } from '../lib/potBalance';
import { PageContainer } from './ui/PageContainer';
import { PageHeader } from './ui/PageHeader';
import { ActionButton } from './ui/ActionButton';
import { StatCard } from './ui/StatCard';

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
  initialAmount: string;
}
const EMPTY_FORM: PotForm = { name: '', description: '', initialAmount: '' };

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

  // expense = deposit INTO pot (+), income = withdrawal FROM pot (−), transfer = initial balance (+, neutral in P&L)
  const potBalance = (potId: string) => calcPotBalance(potId, transactions);

  const totalBalance = pots.reduce((s, p) => s + potBalance(p.id), 0);
  const totalMonthlyIn = pots.reduce((s, p) =>
    s + regularSpendings
      .filter((r) => r.potId === p.id && r.transactionType === 'income')
      .reduce((ss, r) => ss + r.amount * (MONTHLY_FACTOR[r.frequency] ?? 1), 0), 0);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const potId = crypto.randomUUID();
    addPot({
      id: potId,
      name: form.name,
      color: POT_COLORS[pots.length % POT_COLORS.length],
      description: form.description || undefined,
    });
    const initial = parseFloat(form.initialAmount);
    if (initial > 0) {
      addTransaction({
        id: crypto.randomUUID(),
        type: 'transfer',
        amount: initial,
        category: 'Pot Balance',
        description: `Starting balance — ${form.name}`,
        date: new Date().toISOString(),
        potId,
      });
    }
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  function openEdit(pot: Pot) {
    setEditPot(pot);
    const bal = potBalance(pot.id);
    setEditForm({ name: pot.name, description: pot.description ?? '', initialAmount: String(bal === 0 ? '' : bal) });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPot) return;
    updatePot({ ...editPot, name: editForm.name, description: editForm.description || undefined });
    // Balance adjustment: if the user changed the balance field, create a correction transaction
    const newBal = parseFloat(editForm.initialAmount);
    if (!isNaN(newBal) && newBal >= 0) {
      const currentBal = potBalance(editPot.id);
      const diff = newBal - currentBal;
      if (Math.abs(diff) > 0.001) {
        addTransaction({
          id: crypto.randomUUID(),
          type: diff > 0 ? 'transfer' : 'income',
          amount: Math.abs(diff),
          category: 'Balance Adjustment',
          description: `Balance adjustment — ${editForm.name}`,
          date: new Date().toISOString(),
          potId: editPot.id,
        });
      }
    }
    setEditPot(null);
  }

  function handleAction(pot: Pot, balance: number) {
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) return;
    if (actionMode === 'withdraw' && amt > balance) return;
    // deposit = expense (costs your main balance), withdraw = income (returns to main balance)
    addTransaction({
      id: crypto.randomUUID(),
      type: actionMode === 'deposit' ? 'expense' : 'income',
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
    <PageContainer>
      <PageHeader
        title="Pots"
        subtitle="Ring-fence money for any purpose"
        action={
          <ActionButton
            tone="indigo"
            onClick={() => setShowAdd(!showAdd)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Pot
          </ActionButton>
        }
      />

      {/* Stats */}
      {pots.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total in Pots"
            value={fmt(totalBalance)}
            sub={`${pots.length} pot${pots.length !== 1 ? 's' : ''}`}
            valueClassName="text-xl font-bold text-gray-900"
            icon={<PiggyBank className="w-3.5 h-3.5 text-indigo-500" />}
          />
          <StatCard
            label="Monthly In"
            value={totalMonthlyIn > 0 ? fmt(totalMonthlyIn) : '—'}
            sub="from recurring"
            valueClassName="text-xl font-bold text-gray-900"
            icon={<RefreshCw className="w-3.5 h-3.5 text-emerald-500" />}
          />
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
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Starting balance <span className="normal-case font-normal text-gray-300">(optional — how much is already in here?)</span>
              </label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.initialAmount}
                onChange={(e) => setForm((f) => ({ ...f, initialAmount: e.target.value }))}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
              />
            </div>
            <p className="text-xs text-indigo-600 bg-indigo-50 rounded-xl px-4 py-3 leading-relaxed">
              💡 Go to <strong>Regular</strong> → add an income item → link it to this pot for automatic monthly deposits.
            </p>
            <ActionButton
              type="submit"
              tone="indigo"
              size="full"
            >
              Create Pot
            </ActionButton>
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
          <ActionButton
            onClick={() => setShowAdd(true)}
            tone="indigo"
            size="md"
            className="mt-5"
          >
            Create your first pot
          </ActionButton>
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

                  {/* Deposit / Withdraw — compact inline */}
                  {isActioning ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActionMode('deposit')}
                            className={`px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer leading-none ${
                              actionMode === 'deposit' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'
                            }`}
                          >+</button>
                          <button
                            type="button"
                            onClick={() => setActionMode('withdraw')}
                            className={`px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer border-l border-gray-200 leading-none ${
                              actionMode === 'withdraw' ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'
                            }`}
                          >−</button>
                        </div>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={actionAmount}
                          onChange={(e) => setActionAmount(e.target.value)}
                          placeholder="0.00"
                          autoFocus
                          className={`flex-1 min-w-0 bg-gray-50 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:bg-white transition-colors ${
                            overBalance ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-400'
                          }`}
                        />
                        <button
                          onClick={() => handleAction(pot, balance)}
                          disabled={!actionAmount || amt <= 0 || overBalance}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0 ${
                            actionMode === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                          }`}
                        >✓</button>
                        <button
                          onClick={() => { setActionPotId(null); setActionAmount(''); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer shrink-0 transition-colors"
                        ><X className="w-3.5 h-3.5" /></button>
                      </div>
                      {overBalance && (
                        <p className="text-[11px] text-red-500 pl-1">Exceeds balance ({fmt(balance)})</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setActionPotId(pot.id); setActionMode('deposit'); setActionAmount(''); }}
                      className="text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform text-gray-400 hover:text-gray-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Deposit / Withdraw
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
                              {/* transfer = initial balance (neutral/blue), expense = deposit, income = withdrawal */}
                              {t.type === 'transfer' ? (
                                <ArrowUpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              ) : t.type === 'expense' ? (
                                <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <ArrowDownCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              )}
                              <span className="flex-1 text-gray-600 truncate">{t.description || t.category}</span>
                              <span className="text-gray-400 shrink-0">
                                {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className={`font-semibold shrink-0 ${
                                t.type === 'expense' ? 'text-emerald-600' : t.type === 'transfer' ? 'text-blue-500' : 'text-red-500'
                              }`}>
                                {t.type === 'income' ? '−' : '+'}{fmt(t.amount)}
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
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Current balance <span className="normal-case font-normal text-gray-300">(edit to adjust)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={editForm.initialAmount}
                  onChange={(e) => setEditForm((f) => ({ ...f, initialAmount: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">A correction transaction will be recorded if this differs from the current balance.</p>
              </div>
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
    </PageContainer>
  );
}
