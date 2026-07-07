// Shared constants used by both backend and frontend

export const TRANSACTION_KEYWORDS = [
  'credited',
  'debited',
  'transaction',
  'upi',
  'imps',
  'neft',
  'rtgs',
  'utr',
  'reference number',
  'ref no',
  'txn',
  'transfer',
  'payment',
  'received',
  'sent',
] as const;

export const TRANSACTION_STATUSES = {
  UNUSED: 'UNUSED',
  VERIFIED: 'VERIFIED',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  DUPLICATE: 'DUPLICATE',
} as const;

export const TRANSACTION_TYPES = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER',
} as const;

export const PARSE_METHODS = {
  REGEX: 'REGEX',
  AI: 'AI',
  MANUAL: 'MANUAL',
} as const;

/** Confidence below this threshold triggers OpenAI fallback */
export const AI_CONFIDENCE_THRESHOLD = 0.7;

/** Gmail polling interval in milliseconds */
export const GMAIL_POLL_INTERVAL_MS = 30_000;

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const CURRENCIES = {
  INR: 'INR',
} as const;
