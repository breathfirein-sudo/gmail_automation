import { GmailService } from './services/gmail.service';
import { EmailFilterService } from './services/emailFilter.service';
import { EmailParserService } from './services/emailParser.service';
import { SheetsSyncService } from './services/sheetsSync.service';
import { prisma } from './lib/prisma';
import { logger } from './config/logger';

const gmailService = new GmailService();
const filterService = new EmailFilterService();
const parserService = new EmailParserService();
const sheetsService = new SheetsSyncService();

async function run() {
  console.log('📬 Fetching the past 2 messages from Gmail inbox...');

  try {
    const messages = await gmailService.fetchRecentMessages(2);
    
    if (messages.length === 0) {
      console.log('ℹ️ No messages found in the Inbox.');
      return;
    }

    console.log(`\n🔍 Found ${messages.length} messages. Analyzing details...\n`);

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      console.log(`=========================================`);
      console.log(`📧 Message #${i + 1}`);
      console.log(`   From:    ${msg.senderEmail}`);
      console.log(`   Subject: ${msg.subject}`);
      console.log(`   Date:    ${msg.receivedAt}`);
      console.log(`-----------------------------------------`);

      // Filter Check
      const filterResult = await filterService.filter(msg);
      if (!filterResult.eligible) {
        console.log(`❌ Skipped: ${filterResult.reason}`);
        continue;
      }

      console.log(`🟢 Eligible transaction email from: ${filterResult.bankName}`);

      // Dedupe Check
      const existing = await prisma.bankTransaction.findFirst({ where: { gmailMessageId: msg.id } });
      if (existing) {
        console.log(`⚠️ Already processed in DB (UTR: ${existing.utr})`);
        continue;
      }

      // Parse Details
      console.log(`⚙️ Parsing transaction details...`);
      const parsed = await parserService.parse(msg, filterResult.bankName!);
      if (!parsed) {
        console.log(`❌ Failed to parse UTR and Amount from the email body.`);
        continue;
      }

      console.log(`✅ Parsed Successfully!`);
      console.log(`   UTR:    ${parsed.utr}`);
      console.log(`   Amount: ₹${parsed.amount.toLocaleString()}`);
      console.log(`   Type:   ${parsed.transactionType}`);
      console.log(`   Method: ${parsed.method} (Confidence: ${(parsed.confidence * 100).toFixed(0)}%)`);

      // Store in DB
      const existingUTR = await prisma.bankTransaction.findUnique({ where: { utr: parsed.utr } });
      const status = existingUTR ? 'DUPLICATE' : 'UNUSED';

      const transaction = await prisma.bankTransaction.create({
        data: {
          gmailMessageId: msg.id,
          gmailHistoryId: msg.historyId,
          senderEmail: msg.senderEmail,
          bankName: filterResult.bankName!,
          subject: msg.subject,
          receivedAt: msg.receivedAt,
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
          rawEmailBody: msg.body,
          status,
        },
      });

      console.log(`💾 Saved to Database (ID: ${transaction.id}, Status: ${status})`);

      // Sheets Sync
      if (status !== 'DUPLICATE') {
        try {
          await sheetsService.syncTransaction(transaction.id);
          console.log(`📊 Synced to Google Sheets!`);
        } catch (sheetsErr: any) {
          console.error(`⚠️ Google Sheets Sync failed:`, sheetsErr.message);
        }
      }
    }
    
    console.log(`=========================================`);
    console.log('\n🏁 Run complete.');
  } catch (err: any) {
    console.error('❌ Error executing manual fetch:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
