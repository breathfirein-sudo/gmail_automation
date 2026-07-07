import { useState } from 'react';
import TransactionTable from '../components/transactions/TransactionTable';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function TransactionsPage() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('transactions_unlocked') === 'true';
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Psk@711995') {
      sessionStorage.setItem('transactions_unlocked', 'true');
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center pt-16">
        <div className="relative w-full max-w-sm card p-6 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500/10 ring-1 ring-brand-500/30 mb-4">
            <Lock className="text-brand-400" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Secure Transactions Access</h2>
          <p className="text-sm text-[#8b949e] mb-6">Enter password to view sensitive transaction logs.</p>
          
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-left animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="input-field pr-10 text-center"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e7681] hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Unlock Transactions
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-[#8b949e] text-sm mt-1">Search, filter, and manage bank transaction records</p>
      </div>
      <TransactionTable />
    </div>
  );
}
