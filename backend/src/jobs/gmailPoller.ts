import { prisma } from '../lib/prisma';
import { GmailService } from '../services/gmail.service';
import { EmailFilterService } from '../services/emailFilter.service';
import { EmailParserService } from '../services/emailParser.service';
import { SheetsSyncService } from '../services/sheetsSync.service';
import { logger } from '../config/logger';

const POLL_INTERVAL_MS = 30_000;

const gmailService = new GmailService();
const filterService = new EmailFilterService();
const parserService = new EmailParserService();
const sheetsService = new SheetsSyncService();

let pollerInterval: ReturnType<typeof setInterval> | null = null;
let lastPollAt: Date | null = null;
let lastPollSuccess = true;
let processedCount = 0;
let errorCount = 0;

export function gmailPollerStatus() {
  return { running: pollerInterval !== null, lastPollAt, lastPollSuccess, processedCount, errorCount, pollIntervalMs: POLL_INTERVAL_MS };
}

export function startGmailPoller(): void {
  if (pollerInterval) { logger.warn('Gmail poller already running'); return; }
  logger.info(`Starting Gmail poller (interval: ${POLL_INTERVAL_MS}ms)`);
  poll();
  pollerInterval = setInterval(poll, POLL_INTERVAL_MS);
}

export function stopGmailPoller(): void {
  if (pollerInterval) { clearInterval(pollerInterval); pollerInterval = null; logger.info('Gmail poller stopped'); }
}

async function poll(): Promise<void> {
  try {
    lastPollAt = new Date();
    const pollingState = await prisma.gmailPollingState.findFirst();
    const historyId = pollingState?.historyId ?? '1';

    const messages = await gmailService.fetchMessagesSinceHistory(historyId);
    if (messages.length === 0) { lastPollSuccess = true; return; }

    logger.info(`Processing ${messages.length} Gmail messages`);
    
    // Find the latest history ID from the batch of messages fetched
    let latestHistoryId = historyId;
    for (const msg of messages) {
      try {
        if (BigInt(msg.historyId) > BigInt(latestHistoryId)) {
          latestHistoryId = msg.historyId;
        }
      } catch {
        if (msg.historyId > latestHistoryId) latestHistoryId = msg.historyId;
      }
    }

    for (const message of messages) {
      try {
        // Filter
        const filterResult = await filterService.filter(message);
        if (!filterResult.eligible) { logger.debug(`Skipped: ${filterResult.reason}`); continue; }

        // Dedupe
        const existing = await prisma.bankTransaction.findFirst({ where: { gmailMessageId: message.id } });
        if (existing) { logger.debug(`Already processed: ${message.id}`); continue; }

        // Parse
        const parsed = await parserService.parse(message, filterResult.bankName!);
        if (!parsed) { logger.warn(`Parse failed: ${message.senderEmail}`); continue; }

        // Duplicate UTR check
        const existingUTR = await prisma.bankTransaction.findUnique({ where: { utr: parsed.utr } });
        const status = existingUTR ? 'DUPLICATE' : 'UNUSED';

        // Store
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

        logger.info(`💾 Stored — UTR: ${parsed.utr}, Bank: ${filterResult.bankName}, Status: ${status}`);
        processedCount++;

        if (status !== 'DUPLICATE') {
          sheetsService.syncTransaction(transaction.id).catch((err) => {
            logger.error(`Sheets sync failed for ${transaction.id}:`, err);
          });
        }
      } catch (err) {
        logger.error(`Error processing message ${message.id}:`, err);
        errorCount++;
      }
    }

    // Update historyId
    if (latestHistoryId !== historyId) {
      if (pollingState) {
        await prisma.gmailPollingState.update({
          where: { id: pollingState.id },
          data: { historyId: latestHistoryId, lastPolledAt: new Date() },
        });
      } else {
        await prisma.gmailPollingState.create({ data: { historyId: latestHistoryId } });
      }
    }

    lastPollSuccess = true;
  } catch (err) {
    lastPollSuccess = false;
    errorCount++;
    logger.error('Polling cycle failed:', err);
  }
}
