import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@payment.local' },
    update: {},
    create: { email: 'admin@payment.local', passwordHash, name: 'System Admin', role: 'ADMIN' },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Bank whitelist ────────────────────────────────────────────────────────
  const banks = [
    {
      bankName: 'HDFC Bank',
      senderEmails: ['alerts@hdfcbank.net', 'noreply@hdfcbank.com', 'transaction.alerts@hdfcbank.com', 'alerts@hdfcbank.bank.in'],
      keywords: ['hdfc', 'credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
      parserPatterns: {
        utr: [
          'UTR\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'UPI\\s*(?:Ref\\.?|Reference)?\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Ref\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Transaction\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})',
          'Txn\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})'
        ],
        amount: ['Rs\\.?\\s*([\\d,]+(?:\\.\\d{2})?)', 'INR\\s*([\\d,]+(?:\\.\\d{2})?)'],
      },
    },
    {
      bankName: 'ICICI Bank',
      senderEmails: ['icicibank@icicibank.com', 'alerts@icicibank.com', 'noreply@icicibank.com'],
      keywords: ['icici', 'credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
      parserPatterns: {
        utr: [
          'UTR\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'UPI\\s*(?:Ref\\.?|Reference)?\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Ref\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Transaction\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})',
          'Txn\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})'
        ],
        amount: ['Rs\\.?\\s*([\\d,]+(?:\\.\\d{2})?)'],
      },
    },
    {
      bankName: 'State Bank of India',
      senderEmails: ['alerts@sbi.co.in', 'noreply@sbi.co.in', 'sbiatm@sbi.co.in'],
      keywords: ['sbi', 'credited', 'debited', 'utr', 'neft', 'imps', 'upi', 'rtgs'],
      parserPatterns: {
        utr: [
          'UTR\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'UPI\\s*(?:Ref\\.?|Reference)?\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Ref\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Transaction\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})',
          'Txn\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})'
        ],
        amount: ['Rs\\.?\\s*([\\d,]+(?:\\.\\d{2})?)', 'Amount\\s*:?\\s*INR\\s*([\\d,]+(?:\\.\\d{2})?)'],
      },
    },
    {
      bankName: 'Axis Bank',
      senderEmails: ['alerts@axisbank.com', 'noreply@axisbank.com'],
      keywords: ['axis', 'credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
      parserPatterns: {
        utr: [
          'UTR\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'UPI\\s*(?:Ref\\.?|Reference)?\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Ref\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Transaction\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})',
          'Txn\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})'
        ],
        amount: ['Rs\\.?\\s*([\\d,]+(?:\\.\\d{2})?)'],
      },
    },
    {
      bankName: 'Kotak Mahindra Bank',
      senderEmails: ['alerts@kotak.com', 'noreply@kotak.com'],
      keywords: ['kotak', 'credited', 'debited', 'utr', 'neft', 'imps', 'upi'],
      parserPatterns: {
        utr: [
          'UTR\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'UPI\\s*(?:Ref\\.?|Reference)?\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Ref\\s*(?:No\\.?|Number)?\\s*:?\\s*([A-Z0-9]{12,22})',
          'Transaction\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})',
          'Txn\\s*ID\\s*:?\\s*([A-Z0-9]{12,22})'
        ],
        amount: ['Rs\\.?\\s*([\\d,]+(?:\\.\\d{2})?)'],
      },
    },
  ];

  for (const bank of banks) {
    const result = await prisma.bankConfig.upsert({
      where: { bankName: bank.bankName },
      update: bank,
      create: bank,
    });
    console.log(`✅ Bank: ${result.bankName} (${result.senderEmails.length} senders)`);
  }

  // ── Gmail polling state ───────────────────────────────────────────────────
  const existing = await prisma.gmailPollingState.findFirst();
  if (!existing) {
    await prisma.gmailPollingState.create({ data: { historyId: '1' } });
    console.log('✅ Gmail polling state initialized');
  }

  console.log('🌱 Seeding complete.');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
