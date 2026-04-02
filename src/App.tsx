import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LockScreen } from './components/LockScreen';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { SavingsGoals } from './components/SavingsGoals';
import { AddTransaction } from './components/AddTransaction';

type Tab = 'Dashboard' | 'Transactions' | 'Goals';

function App() {
  const { authenticated, hasPassword, setup, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  if (!authenticated) {
    return <LockScreen hasPassword={hasPassword} onSetup={setup} onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={logout} activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {activeTab === 'Dashboard' && (
          <Dashboard onAddTransaction={() => setShowAddTransaction(true)} />
        )}
        {activeTab === 'Transactions' && (
          <TransactionList onAddTransaction={() => setShowAddTransaction(true)} />
        )}
        {activeTab === 'Goals' && <SavingsGoals />}
      </main>
      {showAddTransaction && (
        <AddTransaction onClose={() => setShowAddTransaction(false)} />
      )}
    </div>
  );
}

export default App;
