import { prisma } from '@payment/database/src/client';
import { TRANSACTION_KEYWORDS } from '@payment/shared';
import { GmailMessage } from './gmail.service';
import { logger } from '../config/logger';

export interface FilterResult {
  eligible: boolean;
  reason?: string;
  bankName?: string;
}

export class EmailFilterService {
  private whitelistedSenders: Map<string, string> = new Map(); // email -> bankName
  private lastRefreshed = 0;
  private readonly REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  /** Refresh whitelist from database */
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
    logger.info(`Email whitelist refreshed: ${this.whitelistedSenders.size} approved senders`);
  }

  /** Lazily refresh whitelist if stale */
  private async ensureFreshWhitelist(): Promise<void> {
    if (Date.now() - this.lastRefreshed > this.REFRESH_INTERVAL_MS) {
      await this.refreshWhitelist();
    }
  }

  /** Apply both whitelist and keyword filters */
  async filter(message: GmailMessage): Promise<FilterResult> {
    await this.ensureFreshWhitelist();

    // ── 1. Sender whitelist check ────────────────────────────────────────
    const bankName = this.whitelistedSenders.get(message.senderEmail.toLowerCase());
    if (!bankName) {
      logger.debug(`Rejected non-whitelisted sender: ${message.senderEmail}`);
      return {
        eligible: false,
        reason: `Sender not whitelisted: ${message.senderEmail}`,
      };
    }

    // ── 2. Transaction keyword check ─────────────────────────────────────
    const textToSearch = `${message.subject} ${message.body}`.toLowerCase();
    const hasKeyword = TRANSACTION_KEYWORDS.some((kw) => textToSearch.includes(kw));

    if (!hasKeyword) {
      logger.debug(`Rejected no-keyword email from ${message.senderEmail}`);
      return {
        eligible: false,
        reason: 'No transaction keywords found in subject or body',
      };
    }

    return { eligible: true, bankName };
  }
}
