"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding mock transactions into database...');
    const admin = await prisma.user.findFirst({
        where: { email: 'admin@payment.local' }
    });
    if (!admin) {
        console.error('❌ Admin user not found. Please run npm run db:seed first.');
        return;
    }
    const mockTransactions = [
        {
            gmailMessageId: 'msg-hdfc-01',
            gmailHistoryId: 'hist-01',
            senderEmail: 'alerts@hdfcbank.net',
            bankName: 'HDFC Bank',
            subject: 'Alert: Your Account has been Credited',
            receivedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
            utr: 'HDFC423812938',
            amount: 15000.00,
            currency: 'INR',
            transactionType: client_1.TransactionType.CREDIT,
            parseMethod: client_1.ParseMethod.REGEX,
            parseConfidence: 0.95,
            rawEmailBody: 'Your HDFC Bank account has been credited with Rs 15,000.00 via UPI. Ref/UTR No: HDFC423812938.',
            status: client_1.TransactionStatus.UNUSED,
        },
        {
            gmailMessageId: 'msg-icici-01',
            gmailHistoryId: 'hist-02',
            senderEmail: 'alerts@icicibank.com',
            bankName: 'ICICI Bank',
            subject: 'Transaction Confirmation - Credit',
            receivedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
            utr: 'ICIC892341234',
            amount: 8500.00,
            currency: 'INR',
            transactionType: client_1.TransactionType.CREDIT,
            parseMethod: client_1.ParseMethod.AI,
            parseConfidence: 0.88,
            rawEmailBody: 'An amount of Rs.8,500.00 was credited to your ICICI Bank account. UTR: ICIC892341234.',
            status: client_1.TransactionStatus.VERIFIED,
            verifiedAt: new Date(Date.now() - 5 * 60 * 1000),
            verifiedById: admin.id,
            verificationNote: 'Verified by customer payment confirmation request.',
        },
        {
            gmailMessageId: 'msg-sbi-01',
            gmailHistoryId: 'hist-03',
            senderEmail: 'alerts@sbi.co.in',
            bankName: 'State Bank of India',
            subject: 'SBI Credit Alert',
            receivedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 min ago
            utr: 'SBIN182349123',
            amount: 2200.00,
            currency: 'INR',
            transactionType: client_1.TransactionType.CREDIT,
            parseMethod: client_1.ParseMethod.AI,
            parseConfidence: 0.45, // Low confidence -> Manual Review
            rawEmailBody: 'Dear Customer, your a/c is credited by INR 2,200.00. Ref No: SBIN182349123.',
            status: client_1.TransactionStatus.MANUAL_REVIEW,
            verificationNote: 'Low AI confidence score (45%). Requires manual inspection.',
        },
        {
            gmailMessageId: 'msg-axis-01',
            gmailHistoryId: 'hist-04',
            senderEmail: 'alerts@axisbank.com',
            bankName: 'Axis Bank',
            subject: 'Axis Bank: Account Credited',
            receivedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
            utr: 'UTIB567890123',
            amount: 50000.00,
            currency: 'INR',
            transactionType: client_1.TransactionType.CREDIT,
            parseMethod: client_1.ParseMethod.REGEX,
            parseConfidence: 0.92,
            rawEmailBody: 'Your account has been credited with INR 50,000.00. UTR: UTIB567890123.',
            status: client_1.TransactionStatus.UNUSED,
        },
        {
            gmailMessageId: 'msg-kotak-01',
            gmailHistoryId: 'hist-05',
            senderEmail: 'alerts@kotak.com',
            bankName: 'Kotak Bank',
            subject: 'Transaction Alert',
            receivedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            utr: 'KKBK345678901',
            amount: 3750.00,
            currency: 'INR',
            transactionType: client_1.TransactionType.CREDIT,
            parseMethod: client_1.ParseMethod.REGEX,
            parseConfidence: 0.90,
            rawEmailBody: 'Rs.3,750.00 credited to account. Ref: KKBK345678901.',
            status: client_1.TransactionStatus.DUPLICATE,
            verificationNote: 'Duplicate UTR detected.',
        }
    ];
    for (const tx of mockTransactions) {
        await prisma.bankTransaction.upsert({
            where: { utr: tx.utr },
            update: tx,
            create: tx,
        });
    }
    console.log('✅ Successfully seeded 5 mock transactions!');
    console.log('\nUse these to test verification:');
    console.log('1. UTR: HDFC423812938  | Amount: 15000 (Status: UNUSED)');
    console.log('2. UTR: UTIB567890123  | Amount: 50000 (Status: UNUSED)');
}
main()
    .catch((e) => {
    console.error('❌ Failed to seed mock transactions:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-transactions.js.map