import VerificationForm from '../components/verification/VerificationForm';

export default function VerificationPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Verify Payment</h1>
        <p className="text-[#8b949e] text-sm mt-1">Enter customer UTR and amount to verify a payment</p>
      </div>
      <VerificationForm />
    </div>
  );
}
