import { useMemo, useState } from 'react';
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
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart2, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

const fmtShort = (n: number) => {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};

type TimeSpan = '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface DashboardProps {
  onAddTransaction: () => void;
}

export function Dashboard({ onAddTransaction }: DashboardProps) {
  const { transactions, goals } = useAppStore();
  const [chartSpan, setChartSpan] = useState<TimeSpan>('6M');
  const [pieSpan, setPieSpan] = useState<TimeSpan>('ALL');

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === 'income' || t.type === 'refund').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const netSavings = totalIncome - totalExpenses;

  const totalGoalProgress = useMemo(() => {
    if (!goals.length) return 0;
    const total = goals.reduce((s, g) => s + g.targetAmount, 0);
    const current = goals.reduce((s, g) => s + Math.min(g.currentAmount, g.targetAmount), 0);
    return total ? Math.round((current / total) * 100) : 0;
  }, [goals]);

  // ── Chart data by time span ──────────────────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date();
    const spanToMonths: Record<TimeSpan, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, ALL: 60 };
    const months = spanToMonths[chartSpan];

    const buckets: Record<string, { income: number; expense: number }> = {};
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      buckets[key] = { income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (key in buckets) {
        if (t.type === 'income' || t.type === 'refund') buckets[key].income += t.amount;
        else if (t.type === 'expense') buckets[key].expense += t.amount;
      }
    });
    return Object.entries(buckets).map(([name, v]) => ({ name, ...v }));
  }, [transactions, chartSpan]);

  // ── Pie chart data by time span ──────────────────────────────────────
  const expenseByCategory = useMemo(() => {
    const now = new Date();
    const spanToMonths: Record<TimeSpan, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, ALL: 999 };
    const months = spanToMonths[pieSpan];
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const cats: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && new Date(t.date) >= cutoff)
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + t.amount;
      });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, pieSpan]);

  // ── Projections ──────────────────────────────────────────────────────
  const projections = useMemo(() => {
    const last3Months = (() => {
      const now = new Date();
      const result = [0, 1, 2].map((i) => {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = month.toLocaleString('default', { month: 'short', year: '2-digit' });
        return key;
      });
      return result;
    })();

    let monthIncome = 0;
    let monthExpense = 0;
    let txMonths = new Set<string>();

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      txMonths.add(key);
      if (last3Months.includes(key)) {
        if (t.type === 'income' || t.type === 'refund') monthIncome += t.amount;
        else if (t.type === 'expense') monthExpense += t.amount;
      }
    });

    const activeMonths = Math.min(last3Months.length, Math.max(txMonths.size, 1));
    const avgMonthlyIncome = monthIncome / activeMonths;
    const avgMonthlyExpense = monthExpense / activeMonths;
    const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpense;
    const annualSavings = avgMonthlySavings * 12;
    const savingsRate = avgMonthlyIncome > 0 ? (avgMonthlySavings / avgMonthlyIncome) * 100 : 0;

    // Spending trend: compare last month vs previous month
    const now = new Date();
    const lastMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toLocaleString('default', { month: 'short', year: '2-digit' });
    const prevMonthKey = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      .toLocaleString('default', { month: 'short', year: '2-digit' });

    let lastMonthExp = 0;
    let prevMonthExp = 0;
    transactions.forEach((t) => {
      const key = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (t.type === 'expense') {
        if (key === lastMonthKey) lastMonthExp += t.amount;
        if (key === prevMonthKey) prevMonthExp += t.amount;
      }
    });
    const spendingTrend = prevMonthExp > 0 ? ((lastMonthExp - prevMonthExp) / prevMonthExp) * 100 : 0;

    // Time to reach goals
    const goalProjections = goals.map((g) => {
      const remaining = g.targetAmount - g.currentAmount;
      const monthsNeeded = avgMonthlySavings > 0 ? Math.ceil(remaining / avgMonthlySavings) : Infinity;
      return { name: g.name, monthsNeeded, remaining };
    });

    return {
      avgMonthlyIncome,
      avgMonthlyExpense,
      avgMonthlySavings,
      annualSavings,
      savingsRate,
      spendingTrend,
      goalProjections,
    };
  }, [transactions, goals]);

  const SPANS: TimeSpan[] = ['1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
      <button
        onClick={onAddTransaction}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm cursor-pointer"
      >
        + Add Transaction
      </button>

      {/* Projections */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Statistical Projections</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <ProjectionCard
            label="Avg Monthly Income"
            value={fmt(projections.avgMonthlyIncome)}
            sub="(last 3 months)"
            color="emerald"
          />
          <ProjectionCard
            label="Avg Monthly Expense"
            value={fmt(projections.avgMonthlyExpense)}
            sub="(last 3 months)"
            color="red"
          />
          <ProjectionCard
            label="Projected Annual Savings"
            value={fmt(projections.annualSavings)}
            sub="at current rate"
            color={projections.annualSavings >= 0 ? 'blue' : 'orange'}
          />
          <ProjectionCard
            label="Savings Rate"
            value={`${projections.savingsRate.toFixed(1)}%`}
            sub="of monthly income"
            color={projections.savingsRate >= 20 ? 'emerald' : projections.savingsRate >= 10 ? 'amber' : 'red'}
          />
        </div>
        {projections.spendingTrend !== 0 && (
          <div className={`text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 ${
            projections.spendingTrend > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {projections.spendingTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Spending {projections.spendingTrend > 0 ? 'up' : 'down'} {Math.abs(projections.spendingTrend).toFixed(1)}% vs last month
          </div>
        )}
        {projections.goalProjections.length > 0 && projections.avgMonthlySavings > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Time to reach goals (at current savings rate)
            </p>
            {projections.goalProjections.map((g) => (
              <div key={g.name} className="flex justify-between items-center text-xs text-gray-600">
                <span className="truncate max-w-[60%]">{g.name}</span>
                <span className="font-medium text-gray-800">
                  {g.monthsNeeded === Infinity
                    ? 'N/A'
                    : g.monthsNeeded <= 0
                    ? '✓ Reached'
                    : g.monthsNeeded < 12
                    ? `~${g.monthsNeeded}mo`
                    : `~${(g.monthsNeeded / 12).toFixed(1)}yr`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Area Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-700 text-sm">Income vs Expenses</h3>
            <div className="flex gap-1">
              {SPANS.map((s) => (
                <button
                  key={s}
                  onClick={() => setChartSpan(s)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    chartSpan === s ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
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
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} width={45} />
              <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(v) : v)} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Income
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-500 inline-block" /> Expenses
            </span>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-700 text-sm">Expenses by Category</h3>
            <div className="flex gap-1">
              {SPANS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPieSpan(s)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                    pieSpan === s ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {expenseByCategory.length ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(v) : v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {expenseByCategory.slice(0, 6).map((e, i) => (
                  <span key={e.name} className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
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

      {/* Monthly Bar Chart */}
      {chartData.some((d) => d.income > 0 || d.expense > 0) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Monthly Savings Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} width={45} />
              <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(v) : v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
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
      <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
    </div>
  );
}

interface ProjectionCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
}

function ProjectionCard({ label, value, sub, color }: ProjectionCardProps) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-700',
    red: 'text-red-500',
    blue: 'text-blue-700',
    orange: 'text-orange-500',
    amber: 'text-amber-600',
  };
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold text-sm ${colors[color] ?? colors.blue}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}


