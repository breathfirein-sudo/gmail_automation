import { useState, FormEvent, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import type { VerificationResult } from '../../types';

export default function VerificationForm() {
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [utrError, setUtrError] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const isSubmitting = useRef(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    
    setError('');
    setResult(null);

    // Validate UTR is mandatory and correct length
    const trimmedUtr = utr.trim();
    if (!trimmedUtr) {
      setUtrError('UTR / Reference Number is required.');
      isSubmitting.current = false;
      return;
    }
    if (trimmedUtr.length < 12) {
      setUtrError('UTR must be at least 12 alphanumeric characters.');
      isSubmitting.current = false;
      return;
    }
    setUtrError('');
    setLoading(true);
    try {
      const res = await api.post<VerificationResult>('/verify', {
        utr: utr.toUpperCase().trim(),
        employeeId: employeeId.trim() || undefined,
      });
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleReset = () => { setResult(null); setError(''); setUtrError(''); setUtr(''); setEmployeeId(''); isSubmitting.current = false; };

  const resultColor = (result?.success || result?.status === 'DUPLICATE') ? 'border-green-500/30 bg-green-500/5'
    : result?.status === 'MANUAL_REVIEW' ? 'border-yellow-500/30 bg-yellow-500/5'
    : 'border-red-500/30 bg-red-500/5';

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 ring-1 ring-brand-500/30 flex items-center justify-center">
            <ShieldCheck size={18} className="text-brand-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Payment Verification</h2>
            <p className="text-xs text-[#8b949e]">Verify by UTR reference number</p>
          </div>
        </div>

        <form id="verification-form" onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label htmlFor="utr-input" className="block text-sm font-medium text-[#8b949e] mb-1.5">
              UTR / Reference Number <span className="text-red-400">*</span>
            </label>
            <input
              id="utr-input" type="text"
              value={utr}
              onChange={(e) => { setUtr(e.target.value.toUpperCase()); if (utrError) setUtrError(''); }}
              className={`input-field font-mono tracking-widest ${utrError ? 'border-red-500 ring-1 ring-red-500/50' : ''}`}
              placeholder="HDFC423812938" required minLength={12} maxLength={22}
            />
            {utrError ? (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {utrError}
              </p>
            ) : (
              <p className="text-xs text-[#6e7681] mt-1">12–22 alphanumeric characters</p>
            )}
          </div>

          <div>
            <label htmlFor="employee-id-input" className="block text-sm font-medium text-[#8b949e] mb-1.5">Employee ID</label>
            <input id="employee-id-input" type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="input-field" placeholder="EMP123" />
          </div>

          <div className="flex gap-3 pt-2">
            <button id="verify-submit" type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
              ) : (
                <><ShieldCheck size={15} />Verify Payment</>
              )}
            </button>
            {(result || error) && (
              <button type="button" onClick={handleReset} className="btn-secondary">Reset</button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div id="verification-result" className={`card flex items-start gap-4 ${resultColor}`}>
          {result.success || result.status === 'DUPLICATE' ? (
            <CheckCircle size={24} className="text-green-400 flex-shrink-0 mt-0.5" />
          ) : result.status === 'MANUAL_REVIEW' ? (
            <AlertTriangle size={24} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-semibold text-base mb-1 ${result.success || result.status === 'DUPLICATE' ? 'text-green-400' : result.status === 'MANUAL_REVIEW' ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.success ? '✅ Payment Verified' : result.status === 'DUPLICATE' ? 'ℹ️ Already Verified' : result.status === 'MANUAL_REVIEW' ? '⚠️ Sent to Manual Review' : '❌ Verification Failed'}
            </p>
            {result.reason && <p className="text-sm text-[#8b949e]">{result.reason}</p>}
            {result.transaction && (
              <div className="mt-3 space-y-1 text-sm">
                {result.transaction.payerName && <p><span className="text-[#6e7681]">Payer Name:</span> <span className="text-white font-semibold">{result.transaction.payerName}</span></p>}
                {result.transaction.utr && <p><span className="text-[#6e7681]">UTR:</span> <span className="font-mono text-brand-400">{result.transaction.utr}</span></p>}
                {result.transaction.amount && <p><span className="text-[#6e7681]">Amount:</span> <span className="text-white font-semibold">₹{Number(result.transaction.amount).toLocaleString()}</span></p>}
                {result.transaction.bankName && <p><span className="text-[#6e7681]">Bank:</span> <span className="text-white">{result.transaction.bankName}</span></p>}
                {result.transaction.employeeId && <p><span className="text-[#6e7681]">Employee ID:</span> <span className="text-white font-mono font-semibold">{result.transaction.employeeId}</span></p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
