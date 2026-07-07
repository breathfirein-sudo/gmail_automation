import type { Metadata } from 'next';
import VerificationForm from '@/components/verification/VerificationForm';

export const metadata: Metadata = {
  title: 'Verify Payment — PayVerify',
  description: 'Verify customer payment by UTR and amount',
};

export default function VerificationPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Verify Payment</h1>
        <p className="text-text-secondary text-sm mt-1">
          Enter customer UTR and amount to verify a payment
        </p>
      </div>
      <VerificationForm />
    </div>
  );
}
