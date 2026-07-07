import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface TransactionRow {
  id: string;
  utr: string;
  payerName: string | null;
  amount: number;
  currency: string;
  transactionType: string;
  bankName: string;
  status: string;
  parseMethod: string;
  parseConfidence: number;
  receivedAt: string;
  verifiedAt: string | null;
  sheetsSynced: boolean;
  employeeId?: string | null;
}

interface PaginatedResponse {
  data: TransactionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Params {
  page?: number;
  limit?: number;
  status?: string;
  bankName?: string;
  utr?: string;
  startDate?: string;
  endDate?: string;
}

export function useTransactions(params: Params = {}) {
  const [data, setData] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse>('/transactions', { params });
      setData(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  return { data, total, totalPages, loading, error, refetch: fetchTransactions };
}
