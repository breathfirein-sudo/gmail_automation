'use client';

import { useState } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';

type Status = 'UNUSED' | 'VERIFIED' | 'MANUAL_REVIEW' | 'DUPLICATE';

interface Transaction {
  id: string;
  utr: string;
  amount: number;
  currency: string;
  transactionType: string;
  bankName: string;
  status: Status;
  parseMethod: string;
  parseConfidence: number;
  receivedAt: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', utr: 'HDFC423812938', amount: 15000, currency: 'INR', transactionType: 'CREDIT', bankName: 'HDFC Bank', status: 'VERIFIED', parseMethod: 'REGEX', parseConfidence: 0.92, receivedAt: '2026-07-03T04:22:00Z' },
  { id: '2', utr: 'ICIC892341234', amount: 8500, currency: 'INR', transactionType: 'CREDIT', bankName: 'ICICI Bank', status: 'UNUSED', parseMethod: 'AI', parseConfidence: 0.78, receivedAt: '2026-07-03T03:15:00Z' },
  { id: '3', utr: 'SBIB123456789', amount: 2200, currency: 'INR', transactionType: 'CREDIT', bankName: 'SBI', status: 'MANUAL_REVIEW', parseMethod: 'AI', parseConfidence: 0.45, receivedAt: '2026-07-03T02:10:00Z' },
  { id: '4', utr: 'UTIB567890123', amount: 50000, currency: 'INR', transactionType: 'CREDIT', bankName: 'Axis Bank', status: 'VERIFIED', parseMethod: 'REGEX', parseConfidence: 0.95, receivedAt: '2026-07-02T23:55:00Z' },
  { id: '5', utr: 'KKBK345678901', amount: 3750, currency: 'INR', transactionType: 'DEBIT', bankName: 'Kotak', status: 'DUPLICATE', parseMethod: 'REGEX', parseConfidence: 0.89, receivedAt: '2026-07-02T22:30:00Z' },
];

const statusStyles: Record<Status, string> = {
  VERIFIED: 'badge-success',
  UNUSED: 'badge-info',
  MANUAL_REVIEW: 'badge-warning',
  DUPLICATE: 'badge-danger',
};

export default function TransactionTable() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = mockTransactions.filter((t) => {
    const matchSearch =
      !search ||
      t.utr.toLowerCase().includes(search.toLowerCase()) ||
      t.bankName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-surface-500/30">
        <div className="flex items-center gap-2 bg-surface-700 border border-surface-500/60 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search size={14} className="text-text-muted" />
          <input
            id="transaction-search"
            type="text"
            placeholder="Search UTR or bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-text-muted outline-none flex-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-700 border border-surface-500/60 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50"
          >
            <option value="">All Statuses</option>
            <option value="UNUSED">Unused</option>
            <option value="VERIFIED">Verified</option>
            <option value="MANUAL_REVIEW">Manual Review</option>
            <option value="DUPLICATE">Duplicate</option>
          </select>
        </div>

        <button id="export-csv" className="btn-secondary text-xs ml-auto">
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>UTR</th>
              <th>Bank</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Parse</th>
              <th>Confidence</th>
              <th>Received At</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-text-muted py-12">
                  No transactions found
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} id={`txn-row-${t.id}`}>
                  <td>
                    <span className="font-mono text-xs text-brand-400">{t.utr}</span>
                  </td>
                  <td>
                    <span className="text-white">{t.bankName}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-white">
                      ₹{t.amount.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={t.transactionType === 'CREDIT' ? 'text-green-400' : 'text-red-400'}>
                      {t.transactionType}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusStyles[t.status]}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-muted">{t.parseMethod}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${t.parseConfidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">
                        {(t.parseConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-text-muted">
                      {new Date(t.receivedAt).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-surface-500/30">
        <p className="text-sm text-text-muted">{filtered.length} results</p>
        <div className="flex items-center gap-1">
          <button id="prev-page" className="btn-secondary py-1.5 px-2">
            <ChevronLeft size={14} />
          </button>
          <span className="px-3 py-1.5 text-sm text-white">1 / 1</span>
          <button id="next-page" className="btn-secondary py-1.5 px-2">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
