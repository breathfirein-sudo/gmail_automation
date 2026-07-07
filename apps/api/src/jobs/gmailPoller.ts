import { prisma } from '@payment/database/src/client';
import { GMAIL_POLL_INTERVAL_MS } from '@payment/shared';
import { GmailService } from '../services/gmail.service';
import { EmailFilterService } from '../services/emailFilter.service';
import { EmailParserService } from '../services/emailParser.service';
import { SheetsSyncService } from '../services/sheetsSync.service';
import { logger } from '../config/logger';

const gmailService = new GmailService();
const filterService = new EmailFilterService();
const parserService = new EmailParserService();
const sheetsService = new SheetsSyncService();

// Poller runtime state
let pollerInterval: ReturnType<typeof setInterval> | null = null;
let lastPollAt: Date | null = null;
let lastPollSuccess = true;
let processedCount = 0;
let errorCount = 0;

export function gmailPollerStatus() {
  return {
    running: pollerInterval !== null,
    lastPollAt,
    lastPollSuccess,
    processedCount,
    errorCount,
    pollIntervalMs: GMAIL_POLL_INTERVAL_MS,
  };
}

export function startGmailPoller(): void {
  if (pollerInterval) {
    logger.warn('Gmail poller already running');
    return;
  }

  logger.info(`Starting Gmail poller (interval: ${GMAIL_POLL_INTERVAL_MS}ms)`);

  // Run immediately, then on interval
  poll();
  pollerInterval = setInterval(poll, GMAIL_POLL_INTERVAL_MS);
}

export function stopGmailPoller(): void {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
    logger.info('Gmail poller stopped');
  }
}

async function poll(): Promise<void> {
  try {
    lastPollAt = new Date();

    // ── 1. Get stored historyId ─────────────────────────────────────────
    const pollingState = await prisma.gmailPollingState.findFirst();
    const historyId = pollingState?.historyId ?? '1';

    // ── 2. Fetch new messages from Gmail ─────────────────────────────────
    const messages = await gmailService.fetchMessagesSinceHistory(historyId);

    if (messages.length === 0) {
      logger.debug('No new Gmail messages');
      lastPollSuccess = true;
      return;
    }

    logger.info(`Processing ${messages.length} new Gmail messages`);

    let latestHistoryId = historyId;

    for (const message of messages) {
      try {
        // ── 3. Bank filter ──────────────────────────────────────────────
        const filterResult = await filterService.filter(message);

        if (!filterResult.eligible) {
          logger.debug(`Skipped: ${message.senderEmail} — ${filterResult.reason}`);
          continue;
        }

        // ── 4. Check for already processed message ──────────────────────
        const existing = await prisma.bankTransaction.findFirst({
          where: { gmailMessageId: message.id },
        });
        if (existing) {
          logger.debug(`Already processed: ${message.id}`);
          continue;
        }

        // ── 5. Parse email ──────────────────────────────────────────────
        const parsed = await parserService.parse(message, filterResult.bankName!);

        if (!parsed) {
          logger.warn(`Failed to parse email from ${message.senderEmail}`);
          continue;
        }

        // ── 6. Check for duplicate UTR ──────────────────────────────────
        const existingUTR = await prisma.bankTransaction.findUnique({
          where: { utr: parsed.utr },
        });

        const status = existingUTR ? 'DUPLICATE' : 'UNUSED';

        // ── 7. Store transaction ────────────────────────────────────────
        const transaction = await prisma.bankTransaction.create({
          data: {
            gmailMessageId: message.id,
            gmailHistoryId: message.historyId,
            senderEmail: message.senderEmail,
            bankName: filterResult.bankName!,
            subject: message.subject,
            receivedAt: message.receivedAt,
            utr: parsed.utr,
            amount: parsed.amount,
            currency: parsed.currency,
            transactionType: parsed.transactionType,
            payerName: parsed.payerName,
            payerAccount: parsed.payerAccount,
            payerUpiId: parsed.payerUpiId,
            beneficiaryAccount: parsed.beneficiaryAccount,
            parseMethod: parsed.method,
            parseConfidence: parsed.confidence,
            rawEmailBody: message.body,
            status,
          },
        });

        logger.info(`💾 Stored transaction — UTR: ${parsed.utr}, Bank: ${filterResult.bankName}, Status: ${status}`);
        processedCount++;

        // ── 8. Sync to Google Sheets ────────────────────────────────────
        if (status !== 'DUPLICATE') {
          sheetsService.syncTransaction(transaction.id).catch((err) => {
            logger.error(`Sheets sync failed for ${transaction.id}:`, err);
          });
        }

        // Track latest historyId
        if (message.historyId > latestHistoryId) {
          latestHistoryId = message.historyId;
        }
      } catch (err) {
        logger.error(`Error processing message ${message.id}:`, err);
        errorCount++;
        // Continue processing other messages — don't stop the loop
      }
    }

    // ── 9. Update stored historyId ──────────────────────────────────────
    if (latestHistoryId !== historyId) {
      if (pollingState) {
        await prisma.gmailPollingState.update({
          where: { id: pollingState.id },
          data: { historyId: latestHistoryId, lastPolledAt: new Date() },
        });
      } else {
        await prisma.gmailPollingState.create({
          data: { historyId: latestHistoryId },
        });
      }
    }

    lastPollSuccess = true;
  } catch (err) {
    lastPollSuccess = false;
    errorCount++;
    logger.error('Gmail polling cycle failed:', err);
    // Don't throw — let the interval continue
  }
}
