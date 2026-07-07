import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Manual Review — PayVerify',
  description: 'Review and resolve transactions requiring manual attention',
};

export default function ManualReviewPage() {
  const items = [
    { id: '1', utr: 'HDFC423812938', bank: 'HDFC Bank', amount: 15000, confidence: 0.45, note: 'Amount mismatch', receivedAt: '2026-07-03T04:22:00Z' },
    { id: '2', utr: 'ICIC892341234', bank: 'ICICI Bank', amount: 8500, confidence: 0.6, note: 'UTR not found', receivedAt: '2026-07-03T03:15:00Z' },
    { id: '3', utr: 'SBIB123456789', bank: 'SBI', amount: 2200, confidence: 0.3, note: 'AI parse only', receivedAt: '2026-07-03T02:10:00Z' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manual Review Queue</h1>
          <p className="text-text-secondary text-sm mt-1">
            {items.length} transactions require manual attention
          </p>
        </div>
        <span className="badge badge-warning">{items.length} pending</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card-hover">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/15 ring-1 ring-yellow-500/30 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{item.bank}</p>
                  <p className="text-xs font-mono text-text-muted">{item.utr}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">₹{item.amount.toLocaleString()}</p>
                <p className="text-xs text-text-muted">
                  Confidence: {(item.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-surface-500/20 flex items-center justify-between">
              <p className="text-sm text-yellow-400/80">{item.note}</p>
              <div className="flex gap-2">
                <button id={`approve-${item.id}`} className="btn-primary text-xs py-1.5 px-3">
                  Approve
                </button>
                <button id={`reject-${item.id}`} className="btn-danger text-xs py-1.5 px-3">
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
