import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '../lib/api';

interface ManualItem {
  id: string;
  utr: string;
  bankName: string;
  amount: number;
  parseConfidence: number;
  verificationNote: string | null;
  receivedAt: string;
}

export default function ManualReviewPage() {
  const [items, setItems] = useState<ManualItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: ManualItem[] }>('/admin/manual-review');
      setItems(res.data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const resolve = async (id: string, status: 'VERIFIED' | 'DUPLICATE' | 'UNUSED') => {
    try {
      await api.patch(`/admin/manual-review/${id}`, { status });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert('Failed to resolve: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manual Review Queue</h1>
          <p className="text-[#8b949e] text-sm mt-1">
            {loading ? 'Loading…' : `${items.length} transactions require attention`}
          </p>
        </div>
        {!loading && <span className="badge badge-warning">{items.length} pending</span>}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[#8b949e]">No items in manual review queue 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/15 ring-1 ring-yellow-500/30 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{item.bankName}</p>
                    <p className="text-xs font-mono text-[#6e7681]">{item.utr}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">₹{item.amount.toLocaleString()}</p>
                  <p className="text-xs text-[#6e7681]">
                    Confidence: {(item.parseConfidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-surface-500/20 flex items-center justify-between">
                <p className="text-sm text-yellow-400/80">{item.verificationNote ?? 'Requires review'}</p>
                <div className="flex gap-2">
                  <button
                    id={`approve-${item.id}`}
                    onClick={() => resolve(item.id, 'VERIFIED')}
                    className="btn-success text-xs py-1.5 px-3"
                  >
                    Approve
                  </button>
                  <button
                    id={`reject-${item.id}`}
                    onClick={() => resolve(item.id, 'DUPLICATE')}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
