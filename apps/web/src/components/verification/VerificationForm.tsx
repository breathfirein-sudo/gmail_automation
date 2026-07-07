'use client';

import { useState, FormEvent } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { VerificationResult } from '@payment/shared';

export default function VerificationForm() {
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [utrError, setUtrError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    // Validate UTR is mandatory and correct length
    const trimmedUtr = utr.trim();
    if (!trimmedUtr) {
      setUtrError('UTR / Reference Number is required.');
      return;
    }
    if (trimmedUtr.length < 12) {
      setUtrError('UTR must be at least 12 alphanumeric characters.');
      return;
    }
    setUtrError('');
    setLoading(true);

    try {
      const data = await apiClient.post<VerificationResult>('/verify', {
        customerName,
        amount: parseFloat(amount),
        utr: utr.toUpperCase().trim(),
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setUtrError('');
    setCustomerName('');
    setAmount('');
    setUtr('');
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 ring-1 ring-brand-500/30 flex items-center justify-center">
            <ShieldCheck size={18} className="text-brand-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Payment Verification</h2>
            <p className="text-xs text-text-secondary">Verify by UTR reference number</p>
          </div>
        </div>

        <form id="verification-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customer-name" className="block text-sm font-medium text-text-secondary mb-1.5">
              Customer Name
            </label>
            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="utr-input" className="block text-sm font-medium text-text-secondary mb-1.5">
              UTR / Reference Number <span className="text-red-400">*</span>
            </label>
            <input
              id="utr-input"
              type="text"
              value={utr}
              onChange={(e) => { setUtr(e.target.value.toUpperCase()); if (utrError) setUtrError(''); }}
              className={`input-field font-mono uppercase ${utrError ? 'border-red-500 ring-1 ring-red-500/50' : ''}`}
              placeholder="HDFC423812938"
              required
              minLength={12}
              maxLength={22}
            />
            {utrError ? (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {utrError}
              </p>
            ) : (
              <p className="text-xs text-text-muted mt-1">12–22 alphanumeric characters</p>
            )}
          </div>

          <div>
            <label htmlFor="amount-input" className="block text-sm font-medium text-text-secondary mb-1.5">
              Amount (₹)
            </label>
            <input
              id="amount-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="15000.00"
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              id="verify-submit"
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={15} />
                  Verify Payment
                </>
              )}
            </button>
            {result && (
              <button type="button" onClick={handleReset} className="btn-secondary">
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          id="verification-result"
          className={`card flex items-start gap-4 ${
            result.success
              ? 'border-green-500/30 bg-green-500/5'
              : result.status === 'MANUAL_REVIEW'
              ? 'border-yellow-500/30 bg-yellow-500/5'
              : 'border-red-500/30 bg-red-500/5'
          }`}
        >
          {result.success ? (
            <CheckCircle size={24} className="text-green-400 flex-shrink-0 mt-0.5" />
          ) : result.status === 'MANUAL_REVIEW' ? (
            <AlertTriangle size={24} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1">
            <p className={`font-semibold text-base mb-1 ${result.success ? 'text-green-400' : result.status === 'MANUAL_REVIEW' ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.success ? '✅ Payment Verified' : result.status === 'MANUAL_REVIEW' ? '⚠️ Sent to Manual Review' : '❌ Verification Failed'}
            </p>
            {result.reason && (
              <p className="text-sm text-text-secondary">{result.reason}</p>
            )}
            {result.transaction && (
              <div className="mt-3 space-y-1 text-sm">
                {result.transaction.utr && (
                  <p><span className="text-text-muted">UTR:</span> <span className="font-mono text-brand-400">{result.transaction.utr}</span></p>
                )}
                {result.transaction.amount && (
                  <p><span className="text-text-muted">Amount:</span> <span className="text-white font-semibold">₹{Number(result.transaction.amount).toLocaleString()}</span></p>
                )}
                {result.transaction.bankName && (
                  <p><span className="text-text-muted">Bank:</span> <span className="text-white">{result.transaction.bankName}</span></p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
