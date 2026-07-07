import { getEnv } from '@payment/config/src/env';

const env = getEnv();

export interface BankPattern {
  bankName: string;
  senderEmails: string[];
  keywords: string[];
  utrPatterns: RegExp[];
  amountPatterns: RegExp[];
}

// Runtime bank configurations — overridden by database BankConfig at runtime.
// These serve as a fallback for cold start before DB is available.
export const BANK_PATTERNS: BankPattern[] = [
  {
    bankName: 'HDFC Bank',
    senderEmails: ['alerts@hdfcbank.net', 'noreply@hdfcbank.com'],
    keywords: ['credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
    utrPatterns: [
      /UTR\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9]{12,22})/i,
      /Ref\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9]{12,22})/i,
    ],
    amountPatterns: [/Rs\.?\s*([\d,]+(?:\.\d{2})?)/i, /INR\s*([\d,]+(?:\.\d{2})?)/i],
  },
  {
    bankName: 'ICICI Bank',
    senderEmails: ['icicibank@icicibank.com', 'alerts@icicibank.com'],
    keywords: ['credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
    utrPatterns: [
      /UTR\s*:?\s*([A-Z0-9]{12,22})/i,
      /Transaction\s*ID\s*:?\s*([A-Z0-9]{12,22})/i,
    ],
    amountPatterns: [/Rs\.?\s*([\d,]+(?:\.\d{2})?)/i],
  },
  {
    bankName: 'State Bank of India',
    senderEmails: ['alerts@sbi.co.in', 'noreply@sbi.co.in'],
    keywords: ['credited', 'debited', 'utr', 'neft', 'imps', 'upi', 'rtgs'],
    utrPatterns: [
      /UTR\s*No\.?\s*:?\s*([A-Z0-9]{12,22})/i,
      /Ref\.?\s*No\.?\s*:?\s*([A-Z0-9]{12,22})/i,
    ],
    amountPatterns: [
      /Rs\.?\s*([\d,]+(?:\.\d{2})?)/i,
      /Amount\s*:?\s*INR\s*([\d,]+(?:\.\d{2})?)/i,
    ],
  },
];

export function getBankPattern(senderEmail: string): BankPattern | null {
  const normalizedSender = senderEmail.toLowerCase().trim();
  return (
    BANK_PATTERNS.find((bank) =>
      bank.senderEmails.some((e) => e.toLowerCase() === normalizedSender),
    ) ?? null
  );
}
