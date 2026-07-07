import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Topbar() {
  const { logout } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface-800 border-b border-surface-500/30 flex-shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-surface-700 border border-surface-500/60 rounded-lg px-3 py-2 w-72 group focus-within:border-brand-500/50 transition-colors">
        <Search size={14} className="text-[#6e7681] group-focus-within:text-brand-400 transition-colors" />
        <input
          id="global-search"
          type="text"
          placeholder="Search UTR, amount, bank..."
          className="bg-transparent text-sm text-white placeholder-[#6e7681] outline-none flex-1"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Poller status */}
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-slow" />
          Poller active
        </div>

        {/* Notifications */}
        <button id="notifications-btn" className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-600 transition-colors text-[#8b949e] hover:text-white">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-1 ring-surface-800" />
        </button>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={logout}
          className="flex items-center gap-2 text-sm text-[#8b949e] hover:text-white px-3 py-2 rounded-lg hover:bg-surface-600 transition-colors"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}
