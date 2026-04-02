import { LogOut, TrendingUp } from 'lucide-react';

type Tab = 'Dashboard' | 'Transactions' | 'Goals';

interface HeaderProps {
  onLogout: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: Tab[] = ['Dashboard', 'Transactions', 'Goals'];

export function Header({ onLogout, activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-gray-800 text-lg">Savings Tracker</span>
          </div>

          <nav className="hidden sm:flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex gap-1 pb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
