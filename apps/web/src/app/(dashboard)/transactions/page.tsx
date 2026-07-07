import type { Metadata } from 'next';
import TransactionTable from '@/components/transactions/TransactionTable';

export const metadata: Metadata = {
  title: 'Transactions — PayVerify',
  description: 'Search and browse bank transaction records',
};

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-text-secondary text-sm mt-1">
          Search, filter, and manage bank transaction records
        </p>
      </div>
      <TransactionTable />
    </div>
  );
}
