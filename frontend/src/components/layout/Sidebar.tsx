import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, ShieldCheck, AlertTriangle, Settings, Activity,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function Sidebar() {
  const { user } = useAuth();
  const [manualReviewCount, setManualReviewCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/admin/manual-review');
        setManualReviewCount(res.data.total);
      } catch {
        setManualReviewCount(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/verification', label: 'Verify Payment', icon: ShieldCheck },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { 
      to: '/manual-review', 
      label: 'Manual Review', 
      icon: AlertTriangle, 
      badge: manualReviewCount !== null && manualReviewCount > 0 ? String(manualReviewCount) : undefined 
    },
  ];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-surface-800 border-r border-surface-500/30">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-surface-500/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 ring-1 ring-brand-500/40 flex items-center justify-center">
            <Activity size={16} className="text-brand-400" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">PayVerify</p>
            <p className="text-[10px] text-[#6e7681]">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-[#6e7681] font-semibold">Navigation</p>
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            id={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
            {badge && (
              <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-1 ring-yellow-500/30">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-surface-500/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 ring-1 ring-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400">
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.email ?? 'Admin'}</p>
            <p className="text-[10px] text-[#6e7681] truncate">{user?.role ?? 'ADMIN'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
