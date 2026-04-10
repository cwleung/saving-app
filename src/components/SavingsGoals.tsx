import { useState } from 'react';
import { Trash2, Plus, Check, X, Target, TrendingUp, Calendar, ChevronDown, ChevronUp, ArrowUpCircle, ArrowDownCircle, Pencil } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import type { SavingsGoal } from '../types';

const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

interface GoalForm {
  name: string;
  targetAmount: string;
  currentAmount: string;
  startDate: string;
  deadline: string;
}

const EMPTY_FORM: GoalForm = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  startDate: '',
  deadline: '',
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function SavingsGoals() {
  const { goals, addGoal, updateGoal, deleteGoal, addTransaction, transactions } = useAppStore();
  const { fmt } = useCurrency();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [editForm, setEditForm] = useState<GoalForm>(EMPTY_FORM);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const colorIndex = goals.length % GOAL_COLORS.length;
    addGoal({
      id: crypto.randomUUID(),
      name: form.name,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0,
      color: GOAL_COLORS[colorIndex],
      startDate: form.startDate || undefined,
      deadline: form.deadline || undefined,
    });
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  function openEdit(goal: SavingsGoal) {
    setEditGoal(goal);
    setEditForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      startDate: goal.startDate ?? '',
      deadline: goal.deadline ?? '',
    });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editGoal) return;
    updateGoal({
      ...editGoal,
      name: editForm.name,
      targetAmount: parseFloat(editForm.targetAmount),
      currentAmount: parseFloat(editForm.currentAmount) || 0,
      startDate: editForm.startDate || undefined,
      deadline: editForm.deadline || undefined,
    });
    setEditGoal(null);
  }

  function handleDeposit(goal: SavingsGoal) {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    // Create an expense transaction tagged to this goal so it appears on dashboard expenses
    // The store will auto-update goal.currentAmount for any tagged transaction
    addTransaction({
      id: crypto.randomUUID(),
      type: 'expense',
      amount: amt,
      category: 'Savings Goal',
      description: `Deposit to ${goal.name}`,
      date: new Date().toISOString(),
      goalId: goal.id,
    });
    setDepositId(null);
    setDepositAmount('');
  }

  // goal.currentAmount is kept in sync by the store whenever a tagged transaction is added/deleted
  const totalSaved     = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget    = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct     = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const remaining      = goals.filter((g) => g.currentAmount < g.targetAmount).length;
  const totalRemaining = goals.reduce((s, g) => s + Math.max(0, g.targetAmount - g.currentAmount), 0);

  // Nearest deadline among incomplete goals
  const soonestGoal = goals
    .filter((g) => g.deadline && g.currentAmount < g.targetAmount)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];

  // Monthly needed — uses the goal's own planned period (startDate → deadline)
  const monthlyNeeded = goals
    .filter((g) => g.deadline && g.currentAmount < g.targetAmount)
    .reduce((sum, g) => {
      const nowS = new Date(); nowS.setHours(0, 0, 0, 0);
      const startD = g.startDate ? new Date(g.startDate + 'T00:00:00') : nowS;
      const effectiveStart = startD > nowS ? startD : nowS;
      const months = Math.max(1, (new Date(g.deadline! + 'T00:00:00').getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      return sum + (g.targetAmount - g.currentAmount) / months;
    }, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Goals</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your savings milestones</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Statistics — only shown when there are goals */}
      {goals.length > 0 && (
        <>
          {/* 3-stat grid (Completed removed per request) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total Saved</p>
              </div>
              <p className="text-xl font-bold text-gray-900 truncate">{fmt(totalSaved)}</p>
              <p className="text-xs text-gray-400 mt-0.5">of {fmt(totalTarget)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Still Needed</p>
              </div>
              <p className="text-xl font-bold text-gray-900 truncate">{fmt(totalRemaining)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{remaining} active</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {monthlyNeeded > 0 ? 'Mo. Needed' : 'No Deadlines'}
                </p>
              </div>
              {monthlyNeeded > 0 ? (
                <>
                  <p className="text-xl font-bold text-gray-900 truncate">{fmt(monthlyNeeded)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {soonestGoal ? `${soonestGoal.name} in ${daysUntil(soonestGoal.deadline!)}d` : 'to meet deadlines'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-gray-400">—</p>
                  <p className="text-xs text-gray-400 mt-0.5">set a deadline to track</p>
                </>
              )}
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-gray-500">Overall progress</p>
              <p className="text-xs font-bold text-emerald-600">{Math.round(overallPct)}%</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">New Goal</h3>
            <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="px-5 py-4 space-y-3">
            <input
              type="text"
              placeholder="Goal name (e.g. Emergency Fund)"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Target amount"
                min="1"
                required
                value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                className="bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
              />
              <input
                type="number"
                placeholder="Already saved"
                min="0"
                value={form.currentAmount}
                onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                className="bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Start Date <span className="normal-case font-normal text-gray-300">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  End Date <span className="normal-case font-normal text-gray-300">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold rounded-2xl py-3.5 text-[15px] transition-all cursor-pointer shadow-sm"
            >
              Save Goal
            </button>
          </form>
        </div>
      )}

      {goals.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">No goals yet</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">Set a target and track your progress toward it.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full cursor-pointer transition-colors"
          >
            Create your first goal
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const nowC = new Date(); nowC.setHours(0, 0, 0, 0);
            const goalStartD = goal.startDate ? new Date(goal.startDate + 'T00:00:00') : null;
            const goalEndD   = goal.deadline  ? new Date(goal.deadline  + 'T00:00:00') : null;
            const isNotStarted   = !!(goalStartD && goalStartD > nowC);
            const isOverduePast  = !!(goalEndD && goalEndD < nowC);
            const daysUntilStart = isNotStarted ? Math.ceil((goalStartD!.getTime() - nowC.getTime()) / 86_400_000) : null;
            const progress   = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const isComplete = goal.currentAmount >= goal.targetAmount;
            const leftover   = Math.max(0, goal.targetAmount - goal.currentAmount);
            const days       = goalEndD ? daysUntil(goal.deadline!) : null;
            // moNeeded uses goal's own planned period
            const planStart  = (goalStartD && goalStartD > nowC) ? goalStartD : nowC;
            const planMonths = goalEndD ? Math.max(1, (goalEndD.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : null;
            const moNeeded   = planMonths && !isComplete ? leftover / planMonths : null;

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="font-bold text-gray-900 truncate">{goal.name}</h3>
                    <div className="mt-1 space-y-0.5">
                      {/* Status badge */}
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Complete</span>
                      ) : isNotStarted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Not started · {daysUntilStart}d away</span>
                      ) : isOverduePast ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>
                      ) : days !== null && days <= 30 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{days === 0 ? 'Due today' : `${days}d left`}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Active</span>
                      )}
                      {/* Date range */}
                      {(goal.startDate || goal.deadline) && (
                        <p className="text-[11px] text-gray-400">
                          {goal.startDate
                            ? new Date(goal.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Now'}
                          {' → '}
                          {goal.deadline
                            ? new Date(goal.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'No end'}
                          {planMonths !== null && ` · ${Math.round(planMonths)}mo`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(goal)} className="text-gray-300 hover:text-blue-400 cursor-pointer">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-400 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">{fmt(goal.currentAmount)} saved</span>
                  <span className="font-bold" style={{ color: goal.color }}>{progress.toFixed(1)}%</span>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-2.5 mb-1 overflow-hidden">
                  <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: goal.color }} />
                  {/* Milestone ticks at 25 / 50 / 75 % */}
                  {[25, 50, 75].map((pct) => (
                    <div
                      key={pct}
                      className={`absolute top-0 w-px h-2.5 ${progress >= pct ? 'bg-white/50' : 'bg-gray-300'}`}
                      style={{ left: `${pct}%` }}
                    />
                  ))}
                </div>
                {/* Next milestone hint */}
                {!isComplete && (() => {
                  const next = [25, 50, 75, 100].find((m) => progress < m);
                  if (next === undefined) return null;
                  const needed = (next / 100) * goal.targetAmount - goal.currentAmount;
                  return (
                    <p className="text-[11px] text-gray-400 mb-2.5">
                      <span className="font-semibold text-gray-600">{fmt(needed)}</span> more to reach {next}%
                    </p>
                  );
                })()}

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Target</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">{fmt(goal.targetAmount)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Remaining</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">{isComplete ? '—' : fmt(leftover)}</p>
                  </div>
                  {moNeeded !== null && (
                    <div className="bg-amber-50 rounded-xl px-3 py-2 col-span-2">
                      <p className="text-[10px] text-amber-600 uppercase font-semibold tracking-wide">Needed / month</p>
                      <p className="text-sm font-bold text-amber-700 mt-0.5">{fmt(moNeeded)}</p>
                      {planMonths !== null && (
                        <p className="text-[10px] text-amber-500 mt-0.5">
                          over {Math.round(planMonths)}-month {isNotStarted ? 'plan period' : 'remaining'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Daily savings alert when deadline is close and goal is active */}
                {!isComplete && !isNotStarted && days !== null && days > 0 && days <= 30 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-1 flex items-center gap-2">
                    <span className="text-red-500 text-base">⚡</span>
                    <p className="text-xs text-red-700">
                      Save <span className="font-bold">{fmt(leftover / days)}/day</span> for the next {days} day{days !== 1 ? 's' : ''} to hit your goal on time
                    </p>
                  </div>
                )}

                {isComplete ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                    <Check className="w-4 h-4" /> Goal Achieved!
                  </div>
                ) : depositId === goal.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Amount to add…"
                      autoFocus
                      className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                    />
                    <button onClick={() => handleDeposit(goal)} className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm cursor-pointer hover:bg-emerald-600">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDepositId(null)} className="text-gray-400 hover:text-gray-600 px-2 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setDepositId(goal.id); setDepositAmount(''); }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" /> Add funds
                  </button>
                )}

                {/* Contribution history toggle */}
                {(() => {
                  const contributions = transactions
                    .filter((t) => t.goalId === goal.id)
                    .sort((a, b) => b.date.localeCompare(a.date));
                  if (contributions.length === 0) return null;
                  const isOpen = expandedGoalId === goal.id;
                  return (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => setExpandedGoalId(isOpen ? null : goal.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer w-full"
                      >
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
                        <span className="ml-auto font-semibold text-gray-500">
                          {fmt(contributions.reduce((s, t) => s + t.amount, 0))} total
                        </span>
                      </button>
                      {isOpen && (
                        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                          {contributions.map((t) => (
                            <div key={t.id} className="flex items-center gap-2 text-xs">
                              {t.type === 'expense' ? (
                                <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <ArrowUpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              )}
                              <span className="flex-1 text-gray-600 truncate">{t.description || t.category}</span>
                              <span className="text-gray-400 shrink-0">
                                {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="font-semibold text-emerald-600 shrink-0">+{fmt(t.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Goal Modal */}
      {editGoal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setEditGoal(null)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[95dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Edit Goal</h2>
              <button
                onClick={() => setEditGoal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-5 py-5 space-y-3">
              <input
                type="text"
                placeholder="Goal name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Target Amount</label>
                  <input
                    type="number"
                    placeholder="Target amount"
                    min="1"
                    required
                    value={editForm.targetAmount}
                    onChange={(e) => setEditForm((f) => ({ ...f, targetAmount: e.target.value }))}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Amount Saved</label>
                  <input
                    type="number"
                    placeholder="Currently saved"
                    min="0"
                    value={editForm.currentAmount}
                    onChange={(e) => setEditForm((f) => ({ ...f, currentAmount: e.target.value }))}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Start Date <span className="normal-case font-normal text-gray-300">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    End Date <span className="normal-case font-normal text-gray-300">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold rounded-2xl py-3.5 text-[15px] transition-all cursor-pointer shadow-sm"
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
