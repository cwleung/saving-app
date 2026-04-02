import { useState } from 'react';
import { Trash2, Plus, Check, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { SavingsGoal } from '../types';

const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

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

export function SavingsGoals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useAppStore();
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-700">Savings Goals</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3"
        >
          <h3 className="font-medium text-gray-700">Add New Goal</h3>
          <input
            type="text"
            placeholder="Goal name (e.g. Emergency Fund)"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Target amount ($)"
              min="1"
              required
              value={form.targetAmount}
              onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              type="number"
              placeholder="Already saved ($)"
              min="0"
              value={form.currentAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentAmount: e.target.value }))
              }
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-xl text-sm cursor-pointer"
            >
              Save Goal
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No goals yet</p>
          <p className="text-sm mt-1">
            Create a savings goal to start tracking your progress
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = Math.min(
              (goal.currentAmount / goal.targetAmount) * 100,
              100
            );
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{goal.name}</h3>
                    {goal.deadline && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Due {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-gray-300 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{fmt(goal.currentAmount)} saved</span>
                  <span className="font-medium" style={{ color: goal.color }}>
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{ width: `${progress}%`, background: goal.color }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                  <span>Target: {fmt(goal.targetAmount)}</span>
                  <span>
                    Remaining:{' '}
                    {fmt(Math.max(0, goal.targetAmount - goal.currentAmount))}
                  </span>
                </div>

                {isComplete ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
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
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      onClick={() => handleDeposit(goal)}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDepositId(null)}
                      className="text-gray-400 hover:text-gray-600 px-2 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setDepositId(goal.id);
                      setDepositAmount('');
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
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
