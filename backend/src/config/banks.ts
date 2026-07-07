// Bank whitelist configuration — fallback before DB is available

export interface BankPattern {
  bankName: string;
  senderEmails: string[];
  keywords: string[];
  utrPatterns: RegExp[];
  amountPatterns: RegExp[];
}

export const BANK_PATTERNS: BankPattern[] = [
  {
    bankName: 'HDFC Bank',
    senderEmails: ['alerts@hdfcbank.net', 'noreply@hdfcbank.com', 'transaction.alerts@hdfcbank.com'],
    keywords: ['credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
    utrPatterns: [
      /UTR\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9]{12,22})/i,
      /Ref\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9]{12,22})/i,
    ],
    amountPatterns: [/Rs\.?\s*([\d,]+(?:\.\d{2})?)/i, /INR\s*([\d,]+(?:\.\d{2})?)/i],
  },
  {
    bankName: 'ICICI Bank',
    senderEmails: ['icicibank@icicibank.com', 'alerts@icicibank.com', 'noreply@icicibank.com'],
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
    amountPatterns: [/Rs\.?\s*([\d,]+(?:\.\d{2})?)/i, /Amount\s*:?\s*INR\s*([\d,]+(?:\.\d{2})?)/i],
  },
  {
    bankName: 'Axis Bank',
    senderEmails: ['alerts@axisbank.com', 'noreply@axisbank.com'],
    keywords: ['credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
    utrPatterns: [/UTR\s*:?\s*([A-Z0-9]{12,22})/i, /Ref\s*:?\s*([A-Z0-9]{12,22})/i],
    amountPatterns: [/Rs\.?\s*([\d,]+(?:\.\d{2})?)/i],
  },
  {
    bankName: 'Kotak Mahindra Bank',
    senderEmails: ['alerts@kotak.com', 'noreply@kotak.com'],
    keywords: ['credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
    utrPatterns: [/UTR\s*:?\s*([A-Z0-9]{12,22})/i],
    amountPatterns: [/Rs\.?\s*([\d,]+(?:\.\d{2})?)/i],
  },
];

export function getBankPattern(senderEmail: string): BankPattern | null {
  const lower = senderEmail.toLowerCase().trim();
  return BANK_PATTERNS.find((b) => b.senderEmails.some((e) => e.toLowerCase() === lower)) ?? null;
}
