import { useState } from 'react';
import { Trash2, Plus, Check, X, Target, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';
import type { SavingsGoal } from '../types';

const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

interface GoalForm {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
}

const EMPTY_FORM: GoalForm = {
  name: '',
  targetAmount: '',
  currentAmount: '',
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
  const { goals, addGoal, updateGoal, deleteGoal } = useAppStore();
  const { fmt } = useCurrency();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const colorIndex = goals.length % GOAL_COLORS.length;
    addGoal({
      id: crypto.randomUUID(),
      name: form.name,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0,
      color: GOAL_COLORS[colorIndex],
      deadline: form.deadline || undefined,
    });
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  function handleDeposit(goal: SavingsGoal) {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    updateGoal({ ...goal, currentAmount: goal.currentAmount + amt });
    setDepositId(null);
    setDepositAmount('');
  }

  // Statistics
  const totalSaved   = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget  = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct   = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const completed    = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const remaining    = goals.length - completed;
  const totalRemaining = goals.reduce((s, g) => s + Math.max(0, g.targetAmount - g.currentAmount), 0);

  // Nearest deadline among incomplete goals
  const soonestGoal = goals
    .filter((g) => g.deadline && g.currentAmount < g.targetAmount)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];

  // Monthly needed to hit all deadlines
  const monthlyNeeded = goals
    .filter((g) => g.deadline && g.currentAmount < g.targetAmount)
    .reduce((sum, g) => {
      const months = Math.max(1, daysUntil(g.deadline!) / 30);
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
          {/* 4-stat grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total Saved</p>
              </div>
              <p className="text-xl font-bold text-gray-900 truncate">{fmt(totalSaved)}</p>
              <p className="text-xs text-gray-400 mt-0.5">of {fmt(totalTarget)} target</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Still Needed</p>
              </div>
              <p className="text-xl font-bold text-gray-900 truncate">{fmt(totalRemaining)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{remaining} active goal{remaining !== 1 ? 's' : ''}</p>
            </div>
            <div className={`rounded-2xl p-4 border shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${completed > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className={`w-3.5 h-3.5 ${completed > 0 ? 'text-emerald-600' : 'text-gray-300'}`} />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Completed</p>
              </div>
              <p className={`text-xl font-bold ${completed > 0 ? 'text-emerald-700' : 'text-gray-900'}`}>{completed} / {goals.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">goals reached</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {monthlyNeeded > 0 ? 'Monthly Needed' : 'No Deadlines'}
                </p>
              </div>
              {monthlyNeeded > 0 ? (
                <>
                  <p className="text-xl font-bold text-gray-900 truncate">{fmt(monthlyNeeded)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {soonestGoal ? `Next: ${soonestGoal.name} in ${daysUntil(soonestGoal.deadline!)}d` : 'to meet deadlines'}
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
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Deadline <span className="normal-case font-normal text-gray-300">(optional)</span>
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
              />
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
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const isComplete = goal.currentAmount >= goal.targetAmount;
            const leftover = Math.max(0, goal.targetAmount - goal.currentAmount);
            const days = goal.deadline ? daysUntil(goal.deadline) : null;
            const moNeeded = goal.deadline && !isComplete && days !== null && days > 0
              ? leftover / Math.max(1, days / 30)
              : null;

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="font-bold text-gray-900 truncate">{goal.name}</h3>
                    {goal.deadline && (
                      <p className={`text-xs mt-0.5 ${days !== null && days < 30 ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
                        {isComplete ? `Completed` : days !== null && days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`}
                        {' · '}{new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-400 cursor-pointer shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                    </div>
                  )}
                </div>

                {/* Daily savings alert when deadline is close */}
                {!isComplete && days !== null && days > 0 && days <= 30 && (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
