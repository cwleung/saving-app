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
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart2, Calendar, RepeatIcon, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCurrency } from '../hooks/useCurrency';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

type TimeSpan = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

// ── Bucket key helpers ────────────────────────────────────────────────
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekStartIso(d: Date): string {
  const copy = new Date(d);
  const dow = copy.getDay();
  copy.setDate(copy.getDate() - (dow === 0 ? 6 : dow - 1));
  return isoDate(copy);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dayLabel(isoStr: string): string {
  const [y, m, day] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function monthLabel(keyStr: string): string {
  const [y, m] = keyStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
}

export function Dashboard() {
  const { transactions, goals, regularSpendings, upcomingItems } = useAppStore();
  const { fmt, fmtShort } = useCurrency();
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

  // ── Chart data – daily / weekly / monthly ────────────────────────────
  const { chartData, chartTitle } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const orderedKeys: string[] = [];
    const labels: string[] = [];
    const seen = new Set<string>();

    if (chartSpan === '1W' || chartSpan === '1M') {
      const days = chartSpan === '1W' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = isoDate(d);
        orderedKeys.push(k);
        labels.push(dayLabel(k));
      }
    } else if (chartSpan === '3M') {
      for (let i = 12; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const k = weekStartIso(d);
        if (!seen.has(k)) {
          seen.add(k);
          orderedKeys.push(k);
          labels.push(dayLabel(k));
        }
      }
    } else {
      const months: Record<TimeSpan, number> = { '1W': 1, '1M': 1, '3M': 3, '6M': 6, '1Y': 12, ALL: 60 };
      const count = months[chartSpan];
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = monthKey(d);
        orderedKeys.push(k);
        labels.push(monthLabel(k));
      }
    }

    const buckets: Record<string, { income: number; expense: number }> = {};
    orderedKeys.forEach((k) => (buckets[k] = { income: 0, expense: 0 }));

    transactions.forEach((t) => {
      const d = new Date(t.date);
      let k: string;
      if (chartSpan === '1W' || chartSpan === '1M') k = isoDate(d);
      else if (chartSpan === '3M') k = weekStartIso(d);
      else k = monthKey(d);
      if (k in buckets) {
        if (t.type === 'income' || t.type === 'refund') buckets[k].income += t.amount;
        else if (t.type === 'expense') buckets[k].expense += t.amount;
      }
    });

    const spans: Record<TimeSpan, string> = {
      '1W': 'Daily – Last 7 Days',
      '1M': 'Daily – Last 30 Days',
      '3M': 'Weekly – Last 3 Months',
      '6M': 'Monthly – Last 6 Months',
      '1Y': 'Monthly – Last Year',
      ALL: 'Monthly – All Time',
    };

    return {
      chartData: orderedKeys.map((k, i) => ({ name: labels[i], ...buckets[k] })),
      chartTitle: spans[chartSpan],
    };
  }, [transactions, chartSpan]);

  // ── Pie chart data by time span ──────────────────────────────────────
  const expenseByCategory = useMemo(() => {
    const now = new Date();
    const spanToDays: Record<TimeSpan, number> = { '1W': 7, '1M': 30, '3M': 91, '6M': 183, '1Y': 365, ALL: 99999 };
    const cutoff = new Date(now.getTime() - spanToDays[pieSpan] * 86_400_000);

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
    const now = new Date();
    const last3Keys = [0, 1, 2].map((i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return monthKey(d);
    });

    let monthIncome = 0;
    let monthExpense = 0;
    const txMonths = new Set<string>();

    transactions.forEach((t) => {
      const k = monthKey(new Date(t.date));
      txMonths.add(k);
      if (last3Keys.includes(k)) {
        if (t.type === 'income' || t.type === 'refund') monthIncome += t.amount;
        else if (t.type === 'expense') monthExpense += t.amount;
      }
    });

    const activeMonths = Math.min(3, Math.max(txMonths.size, 1));
    const avgMonthlyIncome = monthIncome / activeMonths;
    const avgMonthlyExpense = monthExpense / activeMonths;
    const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpense;
    const annualSavings = avgMonthlySavings * 12;
    const savingsRate = avgMonthlyIncome > 0 ? (avgMonthlySavings / avgMonthlyIncome) * 100 : 0;

    // Spending trend
    const lastMonthK = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthK = monthKey(new Date(now.getFullYear(), now.getMonth() - 2, 1));
    let lastExp = 0, prevExp = 0;
    transactions.forEach((t) => {
      if (t.type !== 'expense') return;
      const k = monthKey(new Date(t.date));
      if (k === lastMonthK) lastExp += t.amount;
      if (k === prevMonthK) prevExp += t.amount;
    });
    const spendingTrend = prevExp > 0 ? ((lastExp - prevExp) / prevExp) * 100 : 0;

    // Goal projections
    const goalProjections = goals.map((g) => {
      const remaining = g.targetAmount - g.currentAmount;
      const monthsNeeded = avgMonthlySavings > 0 ? Math.ceil(remaining / avgMonthlySavings) : Infinity;
      return { name: g.name, monthsNeeded };
    });

    // Regular spending projections
    const FREQ_MONTHLY: Record<string, number> = {
      daily: 365 / 12, weekly: 52 / 12, biweekly: 26 / 12,
      monthly: 1, quarterly: 1 / 3, yearly: 1 / 12,
    };
    let recurringMonthlyExpense = 0;
    let recurringMonthlyIncome = 0;
    regularSpendings.forEach((r) => {
      const monthly = r.amount * (FREQ_MONTHLY[r.frequency] ?? 1);
      if (r.transactionType === 'expense') recurringMonthlyExpense += monthly;
      else recurringMonthlyIncome += monthly;
    });

    // Upcoming items in next 30 days
    const in30 = new Date(now.getTime() + 30 * 86_400_000);
    let upcomingExpense30 = 0;
    let upcomingIncome30 = 0;
    upcomingItems
      .filter((u) => !u.isPaid && new Date(u.dueDate) <= in30)
      .forEach((u) => {
        if (u.transactionType === 'expense') upcomingExpense30 += u.amount;
        else upcomingIncome30 += u.amount;
      });

    return {
      avgMonthlyIncome,
      avgMonthlyExpense,
      avgMonthlySavings,
      annualSavings,
      savingsRate,
      spendingTrend,
      goalProjections,
      recurringMonthlyExpense,
      recurringMonthlyIncome,
      upcomingExpense30,
      upcomingIncome30,
    };
  }, [transactions, goals, regularSpendings, upcomingItems]);

  const SPANS: TimeSpan[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

  // XAxis tick density: reduce labels when many data points
  const xAxisInterval = chartSpan === '1M' ? 4 : chartSpan === '3M' ? 1 : undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-28 sm:pb-10">
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

      {/* Projections */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Projections & Insights</h3>
        </div>

        {/* Combined This Month projection */}
        {(projections.recurringMonthlyExpense > 0 || projections.upcomingExpense30 > 0 || projections.avgMonthlyExpense > 0) && (() => {
          const projIncome  = projections.avgMonthlyIncome  + projections.recurringMonthlyIncome  + projections.upcomingIncome30;
          const projExpense = projections.avgMonthlyExpense + projections.recurringMonthlyExpense + projections.upcomingExpense30;
          const projNet     = projIncome - projExpense;
          return (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Projected This Month</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <ProjectionCard label="Projected Income"  value={fmt(projIncome)}  sub="avg + recurring + upcoming" color="emerald" />
                <ProjectionCard label="Projected Expenses" value={fmt(projExpense)} sub="avg + recurring + upcoming" color="red" />
                <ProjectionCard label="Projected Net" value={fmt(projNet)} sub="this month estimate" color={projNet >= 0 ? 'blue' : 'orange'} />
              </div>
            </>
          );
        })()}

        {/* Transaction-based projections */}
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Based on last 3 months</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <ProjectionCard label="Avg Monthly Income"   value={fmt(projections.avgMonthlyIncome)}   sub="transactions" color="emerald" />
          <ProjectionCard label="Avg Monthly Expense"  value={fmt(projections.avgMonthlyExpense)}  sub="transactions" color="red" />
          <ProjectionCard label="Projected Annual Savings" value={fmt(projections.annualSavings)} sub="at current rate" color={projections.annualSavings >= 0 ? 'blue' : 'orange'} />
          <ProjectionCard label="Savings Rate" value={`${projections.savingsRate.toFixed(1)}%`} sub="of monthly income" color={projections.savingsRate >= 20 ? 'emerald' : projections.savingsRate >= 10 ? 'amber' : 'red'} />
        </div>

        {/* Recurring spending projections */}
        {(projections.recurringMonthlyExpense > 0 || projections.recurringMonthlyIncome > 0) && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium flex items-center gap-1">
              <RepeatIcon className="w-3 h-3" /> Recurring (monthly equivalent)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {projections.recurringMonthlyIncome > 0 && (
                <ProjectionCard label="Recurring Income" value={fmt(projections.recurringMonthlyIncome)} sub="per month" color="emerald" />
              )}
              {projections.recurringMonthlyExpense > 0 && (
                <ProjectionCard label="Recurring Expenses" value={fmt(projections.recurringMonthlyExpense)} sub="per month" color="red" />
              )}
            </div>
          </>
        )}

        {/* Upcoming items */}
        {(projections.upcomingExpense30 > 0 || projections.upcomingIncome30 > 0) && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Next 30 Days (scheduled)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {projections.upcomingExpense30 > 0 && (
                <ProjectionCard label="Upcoming Expenses" value={fmt(projections.upcomingExpense30)} sub="due ≤ 30 days" color="red" />
              )}
              {projections.upcomingIncome30 > 0 && (
                <ProjectionCard label="Upcoming Income" value={fmt(projections.upcomingIncome30)} sub="due ≤ 30 days" color="emerald" />
              )}
            </div>
          </>
        )}

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
              <Calendar className="w-3 h-3" /> Time to reach goals
            </p>
            {projections.goalProjections.map((g) => (
              <div key={g.name} className="flex justify-between items-center text-xs text-gray-600">
                <span className="truncate max-w-[60%]">{g.name}</span>
                <span className="font-medium text-gray-800">
                  {g.monthsNeeded === Infinity ? 'N/A'
                    : g.monthsNeeded <= 0 ? '✓ Reached'
                    : g.monthsNeeded < 12 ? `~${g.monthsNeeded}mo`
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
          <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-700 text-sm">Income vs Expenses</h3>
            <div className="flex gap-1 flex-wrap">
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
          <p className="text-xs text-gray-400 mb-3">{chartTitle}</p>
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
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={xAxisInterval} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => fmtShort(v)} width={48} />
              <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(v) : v)} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Income</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Expenses</span>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-700 text-sm">Expenses by Category</h3>
            <div className="flex gap-1 flex-wrap">
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
                  <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
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
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No expense data for this period</div>
          )}
        </div>
      </div>

      {/* Bar Chart — mirrors the area chart time span */}
      {chartData.some((d) => d.income > 0 || d.expense > 0) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Savings Breakdown — {chartTitle}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={xAxisInterval} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => fmtShort(v)} width={48} />
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


