import { prisma } from '../lib/prisma';
import { GmailMessage } from './gmail.service';
import { logger } from '../config/logger';

const TRANSACTION_KEYWORDS = [
  'credited', 'debited', 'transaction', 'upi', 'imps', 'neft', 'rtgs',
  'utr', 'reference number', 'ref no', 'txn', 'transfer', 'payment', 'received', 'sent',
];

export interface FilterResult {
  eligible: boolean;
  reason?: string;
  bankName?: string;
}

export class EmailFilterService {
  private whitelistedSenders: Map<string, string> = new Map(); // email -> bankName
  private lastRefreshed = 0;
  private readonly REFRESH_INTERVAL_MS = 5 * 60 * 1000;

  async refreshWhitelist(): Promise<void> {
    const banks = await prisma.bankConfig.findMany({
      where: { isEnabled: true },
      select: { bankName: true, senderEmails: true },
    });

    this.whitelistedSenders.clear();
    for (const bank of banks) {
      for (const email of bank.senderEmails) {
        this.whitelistedSenders.set(email.toLowerCase(), bank.bankName);
      }
    }

    this.lastRefreshed = Date.now();
    logger.info(`Whitelist refreshed: ${this.whitelistedSenders.size} approved senders`);
  }

  private async ensureFresh(): Promise<void> {
    if (Date.now() - this.lastRefreshed > this.REFRESH_INTERVAL_MS) {
      await this.refreshWhitelist();
    }
  }

  async filter(message: GmailMessage): Promise<FilterResult> {
    await this.ensureFresh();

    // 1. Sender whitelist check
    const bankName = this.whitelistedSenders.get(message.senderEmail.toLowerCase());
    if (!bankName) {
      logger.debug(`Rejected non-whitelisted sender: ${message.senderEmail}`);
      return { eligible: false, reason: `Sender not whitelisted: ${message.senderEmail}` };
    }

    // 2. Transaction keyword check
    const text = `${message.subject} ${message.body}`.toLowerCase();
    const hasKeyword = TRANSACTION_KEYWORDS.some((kw) => text.includes(kw));

    if (!hasKeyword) {
      logger.debug(`Rejected no-keyword email from ${message.senderEmail}`);
      return { eligible: false, reason: 'No transaction keywords found' };
    }

    return { eligible: true, bankName };
  }
}
