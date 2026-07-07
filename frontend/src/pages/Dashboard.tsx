import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Mail, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import StatsCard from '../components/dashboard/StatsCard';
import type { DashboardStats } from '../types';

const STATUS_BADGE: Record<string, string> = {
  VERIFIED: 'badge-success',
  UNUSED: 'badge-info',
  MANUAL_REVIEW: 'badge-warning',
  DUPLICATE: 'badge-danger',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get<DashboardStats>('/admin/stats');
      setStats(statsRes.data);
      
      const txRes = await api.get('/transactions', { params: { limit: 5 } });
      setActivities(txRes.data.data);
    } catch {
      setStats({ total: 0, todayCount: 0, verified: 0, manualReview: 0, unused: 0, duplicate: 0, totalVerifiedAmount: 0 });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000); // Auto refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { dateStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#8b949e] text-sm mt-1">Real-time payment transaction overview</p>
        </div>
        <button id="refresh-stats" onClick={fetchDashboardData} className="btn-secondary text-sm gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard id="stat-today" title="Today" value={loading ? '…' : stats?.todayCount ?? 0} icon={<Mail size={18} />} color="blue" />
        <StatsCard id="stat-total" title="Total" value={loading ? '…' : (stats?.total ?? 0).toLocaleString()} icon={<TrendingUp size={18} />} color="purple" />
        <StatsCard id="stat-verified" title="Verified" value={loading ? '…' : (stats?.verified ?? 0).toLocaleString()} icon={<CheckCircle size={18} />} color="green" />
        <StatsCard id="stat-unused" title="Unused" value={loading ? '…' : (stats?.unused ?? 0).toLocaleString()} icon={<Clock size={18} />} color="yellow" />
        <StatsCard id="stat-manual" title="Manual Review" value={loading ? '…' : stats?.manualReview ?? 0} icon={<AlertTriangle size={18} />} color="orange" />
        <StatsCard
          id="stat-amount"
          title="Verified Amount"
          value={loading ? '…' : `₹${((stats?.totalVerifiedAmount ?? 0) / 100000).toFixed(1)}L`}
          icon={<TrendingUp size={18} />}
          color="teal"
        />
      </div>

      {/* Recent activity */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Today's Activity</h2>
        <div className="space-y-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-lg w-full mb-2" />
            ))
          ) : activities.length === 0 ? (
            <p className="text-sm text-[#6e7681] py-4 text-center">No transaction activity today</p>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-surface-500/20 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-600 flex items-center justify-center text-xs font-bold text-[#8b949e]">
                    {item.bankName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.bankName}</p>
                    <p className="text-xs text-[#6e7681] font-mono">{item.utr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">₹{Number(item.amount).toLocaleString()}</span>
                  <span className={`badge ${STATUS_BADGE[item.status] ?? 'badge-muted'} w-28 justify-center`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-[#6e7681] w-20 text-right">{formatTime(item.receivedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
