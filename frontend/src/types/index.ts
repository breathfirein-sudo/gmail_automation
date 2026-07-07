// Shared types for frontend

export type TransactionStatus = 'UNUSED' | 'VERIFIED' | 'MANUAL_REVIEW' | 'DUPLICATE';
export type TransactionType = 'CREDIT' | 'DEBIT';
export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface BankTransaction {
  id: string;
  utr: string;
  amount: number;
  currency: string;
  transactionType: TransactionType;
  bankName: string;
  senderEmail: string;
  subject: string;
  receivedAt: string;
  status: TransactionStatus;
  parseMethod: string;
  parseConfidence: number;
  payerName: string | null;
  payerUpiId: string | null;
  employeeId: string | null;
  verifiedAt: string | null;
  sheetsSynced: boolean;
}

export interface VerificationResult {
  success: boolean;
  status: string;
  transaction?: {
    utr: string;
    amount: number;
    bankName: string;
    transactionType: string;
    verifiedAt: string | null;
    payerName?: string | null;
    employeeId?: string | null;
  };
  reason?: string;
}

export interface DashboardStats {
  total: number;
  todayCount: number;
  verified: number;
  manualReview: number;
  unused: number;
  duplicate: number;
  totalVerifiedAmount: number;
}
