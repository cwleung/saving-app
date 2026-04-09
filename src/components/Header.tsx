import { LogOut, TrendingUp, LayoutDashboard, List, Target, RepeatIcon, Clock, ScrollText } from 'lucide-react';

export type Tab = 'Dashboard' | 'Transactions' | 'Goals' | 'Regular' | 'Upcoming' | 'Changelog';

interface HeaderProps {
  onLogout: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'Transactions', label: 'Transactions', icon: <List className="w-4 h-4" /> },
  { id: 'Goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
  { id: 'Regular', label: 'Regular', icon: <RepeatIcon className="w-4 h-4" /> },
  { id: 'Upcoming', label: 'Upcoming', icon: <Clock className="w-4 h-4" /> },
  { id: 'Changelog', label: 'Changelog', icon: <ScrollText className="w-4 h-4" /> },
];

// Bottom nav shows these 5 tabs (most important)
const BOTTOM_TABS: Tab[] = ['Dashboard', 'Transactions', 'Goals', 'Regular', 'Upcoming'];

export function Header({ onLogout, activeTab, onTabChange }: HeaderProps) {
  return (
    <>
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-gray-800">Savings Tracker</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {/* Changelog on mobile (shown in top bar since not in bottom nav) */}
              <button
                onClick={() => onTabChange('Changelog')}
                className={`md:hidden flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'Changelog'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <ScrollText className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Lock</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-200 safe-area-pb">
        <div className="flex">
          {BOTTOM_TABS.map((tabId) => {
            const tab = TABS.find((t) => t.id === tabId)!;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.icon}
                <span className="text-[10px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
