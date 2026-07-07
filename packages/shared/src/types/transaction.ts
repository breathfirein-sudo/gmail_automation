// Shared transaction types used by both backend and frontend

export type TransactionStatus = 'UNUSED' | 'VERIFIED' | 'MANUAL_REVIEW' | 'DUPLICATE';
export type TransactionType = 'CREDIT' | 'DEBIT';
export type ParseMethod = 'REGEX' | 'AI' | 'MANUAL';

export interface BankTransaction {
  id: string;
  gmailMessageId: string;
  gmailHistoryId: string;
  senderEmail: string;
  bankName: string;
  subject: string;
  receivedAt: Date;
  utr: string;
  amount: number;
  currency: string;
  transactionType: TransactionType;
  payerName: string | null;
  payerAccount: string | null;
  payerUpiId: string | null;
  beneficiaryAccount: string | null;
  parseMethod: ParseMethod;
  parseConfidence: number;
  rawEmailBody: string;
  status: TransactionStatus;
  sheetsSynced: boolean;
  sheetsSyncedAt: Date | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationRequest {
  customerName: string;
  amount: number;
  utr: string;
  screenshotUrl?: string;
}

export interface VerificationResult {
  success: boolean;
  status: TransactionStatus;
  transaction?: Partial<BankTransaction>;
  reason?: string;
}

export interface TransactionSearchParams {
  utr?: string;
  amount?: number;
  bankName?: string;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParsedTransaction {
  utr: string;
  amount: number;
  currency: string;
  transactionType: TransactionType;
  payerName: string | null;
  payerAccount: string | null;
  payerUpiId: string | null;
  beneficiaryAccount: string | null;
  confidence: number;
  method: ParseMethod;
}
