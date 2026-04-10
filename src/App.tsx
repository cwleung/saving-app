import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useAppStore } from './store/useAppStore';
import { LockScreen } from './components/LockScreen';
import { Header, type Tab } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { SavingsGoals } from './components/SavingsGoals';
import { PotsPage } from './components/Pots';
import { AddTransaction } from './components/AddTransaction';
import { RegularSpendingPage } from './components/RegularSpending';
import { UpcomingSpendingPage } from './components/UpcomingSpending';
import { VersionLogPage } from './components/VersionLog';

function App() {
  const { user, loading, authenticated, setup, login, logout } = useAuth();
  const setUid = useAppStore((s) => s.setUid);
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    setUid(user?.uid ?? null);
  }, [user, setUid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LockScreen
        mode={mode}
        onSwitchMode={() => setMode(mode === 'login' ? 'register' : 'login')}
        onRegister={setup}
        onLogin={login}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={logout} activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Transactions' && (
          <TransactionList onAddTransaction={() => setShowAddTransaction(true)} />
        )}
        {activeTab === 'Goals' && <SavingsGoals />}
        {activeTab === 'Pots' && <PotsPage />}
        {activeTab === 'Regular' && <RegularSpendingPage />}
        {activeTab === 'Upcoming' && <UpcomingSpendingPage />}
        {activeTab === 'Changelog' && <VersionLogPage />}
      </main>

      {/* Floating Action Button — visible on Dashboard and Transactions */}
      {(activeTab === 'Dashboard' || activeTab === 'Transactions') && (
        <button
          onClick={() => setShowAddTransaction(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-10 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-transform"
          aria-label="Add transaction"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {showAddTransaction && (
        <AddTransaction onClose={() => setShowAddTransaction(false)} />
      )}
    </div>
  );
}

export default App;
