import { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';

const STATUS_STYLES: Record<string, string> = {
  VERIFIED: 'badge-success',
  UNUSED: 'badge-info',
  MANUAL_REVIEW: 'badge-warning',
  DUPLICATE: 'badge-danger',
};

export default function TransactionTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, total, totalPages, loading, refetch } = useTransactions({
    page,
    limit: 20,
    utr: search || undefined,
    status: statusFilter || undefined,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000); // Auto refresh every 10 seconds
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-surface-500/30 flex-wrap">
        <div className="flex items-center gap-2 bg-surface-700 border border-surface-500/60 rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="text-[#6e7681] flex-shrink-0" />
          <input
            id="transaction-search"
            type="text"
            placeholder="Search UTR..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-white placeholder-[#6e7681] outline-none flex-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#6e7681]" />
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-surface-700 border border-surface-500/60 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50"
          >
            <option value="">All Statuses</option>
            <option value="UNUSED">Unused</option>
            <option value="VERIFIED">Verified</option>
            <option value="MANUAL_REVIEW">Manual Review</option>
            <option value="DUPLICATE">Duplicate</option>
          </select>
        </div>

        <a
          id="export-csv"
          href="/api/transactions/export?format=csv"
          className="btn-secondary text-xs ml-auto"
        >
          <Download size={13} />
          Export CSV
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>UTR</th>
              <th>Payer Name</th>
              <th>Bank</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Employee ID</th>
              <th>Received At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-[#6e7681] py-12">No transactions found</td></tr>
            ) : (
              data.map((t) => (
                <tr key={t.id} id={`txn-row-${t.id}`}>
                  <td><span className="font-mono text-xs text-brand-400">{t.utr}</span></td>
                  <td><span className="text-white">{t.payerName || '-'}</span></td>
                  <td><span className="text-white">{t.bankName}</span></td>
                  <td><span className="font-semibold text-white">₹{Number(t.amount).toLocaleString()}</span></td>
                  <td>
                    <span className={t.transactionType === 'CREDIT' ? 'text-green-400' : 'text-red-400'}>
                      {t.transactionType}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_STYLES[t.status] ?? 'badge-muted'}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td><span className="text-[#8b949e] font-mono text-xs">{t.employeeId || '-'}</span></td>
                  <td>
                    <span className="text-xs text-[#6e7681]">
                      {new Date(t.receivedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
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
        <p className="text-sm text-[#6e7681]">{total} results</p>
        <div className="flex items-center gap-1">
          <button id="prev-page" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-2 disabled:opacity-40">
            <ChevronLeft size={14} />
          </button>
          <span className="px-3 py-1.5 text-sm text-white">{page} / {totalPages || 1}</span>
          <button id="next-page" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary py-1.5 px-2 disabled:opacity-40">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
