import type { Metadata } from 'next';
import StatsCard from '@/components/dashboard/StatsCard';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Mail,
  RefreshCw,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard — PayVerify',
  description: 'Payment verification dashboard — today\'s transaction overview',
};

// In a real app this would be a server component fetching from the API
const mockStats = {
  total: 1284,
  todayCount: 47,
  verified: 891,
  manualReview: 23,
  unused: 358,
  duplicate: 12,
  totalVerifiedAmount: 4820750.5,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time payment transaction overview
          </p>
        </div>
        <button id="refresh-stats" className="btn-secondary text-sm gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          id="stat-today"
          title="Today"
          value={mockStats.todayCount}
          icon={<Mail size={18} />}
          color="blue"
        />
        <StatsCard
          id="stat-total"
          title="Total"
          value={mockStats.total.toLocaleString()}
          icon={<TrendingUp size={18} />}
          color="purple"
        />
        <StatsCard
          id="stat-verified"
          title="Verified"
          value={mockStats.verified.toLocaleString()}
          icon={<CheckCircle size={18} />}
          color="green"
        />
        <StatsCard
          id="stat-unused"
          title="Unused"
          value={mockStats.unused.toLocaleString()}
          icon={<Clock size={18} />}
          color="yellow"
        />
        <StatsCard
          id="stat-manual"
          title="Manual Review"
          value={mockStats.manualReview}
          icon={<AlertTriangle size={18} />}
          color="orange"
        />
        <StatsCard
          id="stat-amount"
          title="Verified Amount"
          value={`₹${(mockStats.totalVerifiedAmount / 100000).toFixed(1)}L`}
          icon={<TrendingUp size={18} />}
          color="teal"
        />
      </div>

      {/* Recent activity section */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Today's Activity</h2>
        <div className="space-y-3">
          {[
            { bank: 'HDFC Bank', utr: 'HDFC423812938', amount: '₹15,000', status: 'VERIFIED', time: '2 min ago' },
            { bank: 'ICICI Bank', utr: 'ICIC892341234', amount: '₹8,500', status: 'UNUSED', time: '7 min ago' },
            { bank: 'SBI', utr: 'SBIB123456789', amount: '₹2,200', status: 'MANUAL_REVIEW', time: '15 min ago' },
            { bank: 'Axis Bank', utr: 'UTIB567890123', amount: '₹50,000', status: 'VERIFIED', time: '22 min ago' },
            { bank: 'Kotak', utr: 'KKBK345678901', amount: '₹3,750', status: 'DUPLICATE', time: '31 min ago' },
          ].map((item) => (
            <div key={item.utr} className="flex items-center justify-between py-2 border-b border-surface-500/20 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-600 flex items-center justify-center text-xs font-bold text-text-secondary">
                  {item.bank[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.bank}</p>
                  <p className="text-xs text-text-muted font-mono">{item.utr}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-white">{item.amount}</span>
                <StatusBadge status={item.status} />
                <span className="text-xs text-text-muted w-20 text-right">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    VERIFIED: 'badge-success',
    UNUSED: 'badge-info',
    MANUAL_REVIEW: 'badge-warning',
    DUPLICATE: 'badge-danger',
  };
  return (
    <span className={`badge ${map[status] ?? 'badge-muted'} w-28 justify-center`}>
      {status.replace('_', ' ')}
    </span>
  );
}
