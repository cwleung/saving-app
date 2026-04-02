import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

interface DashboardProps {
  onAddTransaction: () => void;
}

export function Dashboard({ onAddTransaction }: DashboardProps) {
  const { transactions, goals } = useAppStore();

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const netSavings = totalIncome - totalExpenses;

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      months[key] = { income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (key in months) {
        if (t.type === 'income') months[key].income += t.amount;
        else months[key].expense += t.amount;
      }
    });
    return Object.entries(months).map(([name, v]) => ({ name, ...v }));
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + t.amount;
      });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const totalGoalProgress = useMemo(() => {
    if (!goals.length) return 0;
    const total = goals.reduce((s, g) => s + g.targetAmount, 0);
    const current = goals.reduce(
      (s, g) => s + Math.min(g.currentAmount, g.targetAmount),
      0
    );
    return total ? Math.round((current / total) * 100) : 0;
  }, [goals]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Income"
          value={fmt(totalIncome)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />
        <SummaryCard
          title="Total Expenses"
          value={fmt(totalExpenses)}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          color="red"
        />
        <SummaryCard
          title="Net Savings"
          value={fmt(netSavings)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          color={netSavings >= 0 ? 'blue' : 'orange'}
        />
        <SummaryCard
          title="Goals Progress"
          value={`${totalGoalProgress}%`}
          icon={<Target className="w-5 h-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Quick Add */}
      <div>
        <button
          onClick={onAddTransaction}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm cursor-pointer"
        >
          + Add Transaction
        </button>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Area Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">
            Income vs Expenses (6 months)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(v) : v)} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                fill="url(#incomeGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                fill="url(#expenseGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
              Income
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-500 inline-block" />
              Expenses
            </span>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">
            Expenses by Category
          </h3>
          {expenseByCategory.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(v) : v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {expenseByCategory.map((e, i) => (
                  <span
                    key={e.name}
                    className="flex items-center gap-1 text-xs text-gray-600"
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {e.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No expense data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  const bg: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100',
    red: 'bg-red-50 border-red-100',
    blue: 'bg-blue-50 border-blue-100',
    orange: 'bg-orange-50 border-orange-100',
    purple: 'bg-purple-50 border-purple-100',
  };
  return (
    <div className={`rounded-2xl p-4 border ${bg[color] ?? bg.blue}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-gray-500">{title}</p>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
