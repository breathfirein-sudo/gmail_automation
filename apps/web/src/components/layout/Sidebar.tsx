'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  AlertTriangle,
  Settings,
  Activity,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/verification', label: 'Verify Payment', icon: ShieldCheck },
  { href: '/manual-review', label: 'Manual Review', icon: AlertTriangle },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

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
            <p className="text-[10px] text-text-muted">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-text-muted font-semibold">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.href.replace('/', '')}`}
              className={clsx('nav-link', isActive && 'active')}
            >
              <Icon size={16} />
              {item.label}
              {item.label === 'Manual Review' && (
                <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-1 ring-yellow-500/30">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-500/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 ring-1 ring-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <p className="text-[10px] text-text-muted truncate">admin@payment.local</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
