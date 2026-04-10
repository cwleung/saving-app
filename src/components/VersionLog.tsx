import { Tag, CheckCircle2 } from 'lucide-react';

interface VersionEntry {
  version: string;
  date: string;
  isLatest?: boolean;
  changes: { category: string; text: string }[];
}

const VERSION_LOG: VersionEntry[] = [
  {
    version: '1.4.0',
    date: 'April 10, 2026',

    changes: [
      { category: 'Feature', text: 'Pots: every Goal must now be backed by a Pot — pick an existing one or auto-create on goal creation' },
      { category: 'Feature', text: 'Pots: set a starting balance when creating a pot (for existing money)' },
      { category: 'Fix', text: 'Pot balance now correctly increases when you deposit (deposit = expense in P&L, just like putting money in a real savings pot)' },
      { category: 'UX', text: 'Deposit / Withdraw redesigned: clear tabbed ↑ Deposit / ↓ Withdraw selector with a full-width amount field and Confirm button (both Goals and Pots)' },
      { category: 'UX', text: 'Goal cards show a coloured pot badge so you always know which pot backs each goal' },
      { category: 'UX', text: 'Top-left logo now navigates back to Dashboard from any tab' },
      { category: 'UX', text: 'Lock button renamed to "Lock out" for clarity' },
      { category: 'UX', text: 'Footer shows git commit hash, branch, and deploy timestamp' },
    ],
  },
  {
    version: '1.3.0',
    date: 'April 9, 2026',
    changes: [
      { category: 'Fix', text: 'Regular Spending: start date is now optional (defaults to today)' },
      { category: 'Feature', text: 'Charts support daily (1W, 1M) and weekly (3M) granularity — just like stock charts' },
      { category: 'Feature', text: 'Dashboard projections now include monthly recurring expenses/income from Regular tab' },
      { category: 'Feature', text: 'Dashboard shows upcoming expenses/income due in the next 30 days' },
      { category: 'Feature', text: 'Foreign currency support: USD, EUR, GBP, HKD, CNY, JPY, SGD, CAD, AUD, CHF, KRW, INR and more' },
      { category: 'UX', text: 'Currency picker added to the header — persisted in localStorage' },
      { category: 'UX', text: 'Add Transaction button replaced with a floating action button (FAB) on Dashboard & Transactions tabs' },
      { category: 'UX', text: 'Projection section reorganised with clear sub-headings for transactions, recurring, and upcoming' },
    ],
  },
  {
    version: '1.2.0',
    date: 'April 9, 2026',
    changes: [
      { category: 'Feature', text: 'Added Version Log tab to track app history' },
      { category: 'Feature', text: 'Transactions are now editable (tap the pencil icon)' },
      { category: 'Feature', text: 'Added new transaction types: Transfer, Investment, Refund' },
      { category: 'Feature', text: 'Expanded income & expense categories with 15+ options per type' },
      { category: 'Feature', text: 'Statistical Projections: avg monthly income/expenses, projected annual savings, savings rate, spending trend, time-to-goal estimates' },
      { category: 'Feature', text: 'Expense chart now has time span selector (1M, 3M, 6M, 1Y, ALL) — like a stock chart' },
      { category: 'Feature', text: 'Income vs Expenses chart also supports time span selection' },
      { category: 'Feature', text: 'New Monthly Savings Breakdown bar chart' },
      { category: 'Feature', text: 'Regular Spending: manage recurring income/expenses with frequency (daily to yearly)' },
      { category: 'Feature', text: 'Upcoming: timeline view for scheduled payments & expected income with overdue/today/week grouping' },
      { category: 'Feature', text: 'Upcoming items can be marked as paid/unpaid' },
      { category: 'UX', text: 'Mobile-first redesign: bottom sheet modals, bottom nav bar on mobile' },
      { category: 'UX', text: 'Transaction type filter uses scrollable chips instead of fixed buttons' },
      { category: 'UX', text: 'Add Transaction modal slides up from bottom on mobile' },
    ],
  },
  {
    version: '1.1.0',
    date: 'March 2026',
    changes: [
      { category: 'Feature', text: 'Savings Goals with progress tracking and deposit functionality' },
      { category: 'Feature', text: 'Transaction search by description or category' },
      { category: 'Feature', text: 'Filter transactions by income / expense' },
      { category: 'UX', text: 'Area chart for 6-month income vs expenses overview' },
      { category: 'UX', text: 'Pie chart for expenses by category' },
    ],
  },
  {
    version: '1.0.0',
    date: 'February 2026',
    changes: [
      { category: 'Feature', text: 'Initial release of Savings Tracker' },
      { category: 'Feature', text: 'Income and expense transaction tracking' },
      { category: 'Feature', text: 'Firebase Authentication (email/password)' },
      { category: 'Feature', text: 'Real-time sync via Firebase Firestore' },
      { category: 'Feature', text: 'Dashboard with summary cards' },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Feature: 'bg-blue-100 text-blue-700',
  UX: 'bg-purple-100 text-purple-700',
  Fix: 'bg-amber-100 text-amber-700',
  Security: 'bg-red-100 text-red-600',
  Performance: 'bg-emerald-100 text-emerald-700',
};

export function VersionLogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-6">
      <div>
        <h2 className="font-semibold text-gray-800">Version Log</h2>
        <p className="text-xs text-gray-400 mt-0.5">History of all releases and changes</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-8">
          {VERSION_LOG.map((entry) => (
            <div key={entry.version} className="relative pl-10">
              {/* Dot */}
              <div className={`absolute left-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${
                entry.isLatest ? 'bg-emerald-500 border-emerald-300' : 'bg-white border-gray-300'
              }`} />

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-gray-800 text-lg">v{entry.version}</span>
                    {entry.isLatest && (
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{entry.date}</span>
                </div>

                <ul className="space-y-2">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${CATEGORY_COLORS[change.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {change.category}
                        </span>
                        <span className="text-gray-700">{change.text}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
