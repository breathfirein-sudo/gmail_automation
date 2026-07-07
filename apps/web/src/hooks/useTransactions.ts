'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { PaginatedResponse, TransactionSearchParams } from '@payment/shared';

interface TransactionRow {
  id: string;
  utr: string;
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
}

export function useTransactions(params: TransactionSearchParams = {}) {
  const [data, setData] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.status) queryParams.set('status', params.status);
      if (params.bankName) queryParams.set('bankName', params.bankName);
      if (params.utr) queryParams.set('utr', params.utr);
      if (params.startDate) queryParams.set('startDate', params.startDate);
      if (params.endDate) queryParams.set('endDate', params.endDate);

      const result = await apiClient.get<PaginatedResponse<TransactionRow>>(
        `/transactions?${queryParams.toString()}`,
      );

      setData(result.data);
      setTotal(result.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [
    params.page,
    params.limit,
    params.status,
    params.bankName,
    params.utr,
    params.startDate,
    params.endDate,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { data, total, loading, error, refetch: fetchTransactions };
}
