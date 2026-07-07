import { prisma } from '@payment/database/src/client';
import { VerificationRequest, VerificationResult } from '@payment/shared';
import { logger } from '../config/logger';

export class VerificationService {
  /** Verify a customer payment by UTR matching */
  async verifyPayment(request: VerificationRequest): Promise<VerificationResult> {
    const { customerName, amount, utr } = request;

    logger.info(`Verifying payment — UTR: ${utr}, Amount: ${amount}`);

    // ── 1. Look up by UTR ─────────────────────────────────────────────────
    const transaction = await prisma.bankTransaction.findUnique({
      where: { utr },
    });

    if (!transaction) {
      logger.info(`Verification failed — UTR not found: ${utr}`);
      return {
        success: false,
        status: 'MANUAL_REVIEW',
        reason: 'UTR not found in our records',
      };
    }

    // ── 2. Check already verified / duplicate ────────────────────────────
    if (transaction.status === 'VERIFIED') {
      logger.warn(`Duplicate verification attempt — UTR: ${utr}`);
      return {
        success: false,
        status: 'DUPLICATE',
        reason: 'This transaction has already been verified',
      };
    }

    if (transaction.status === 'DUPLICATE') {
      return {
        success: false,
        status: 'DUPLICATE',
        reason: 'This transaction is marked as duplicate',
      };
    }

    // ── 3. Transaction type must be CREDIT ────────────────────────────────
    if (transaction.transactionType !== 'CREDIT') {
      await this.moveToManualReview(transaction.id, 'Transaction is not a credit');
      return {
        success: false,
        status: 'MANUAL_REVIEW',
        reason: 'Only credit transactions can be verified',
      };
    }

    // ── 4. Amount matching (allow ±1 tolerance for float precision) ──────
    const tolerance = 1;
    const amountDiff = Math.abs(Number(transaction.amount) - amount);

    if (amountDiff > tolerance) {
      logger.info(`Amount mismatch — expected: ${transaction.amount}, got: ${amount}`);
      await this.moveToManualReview(transaction.id, `Amount mismatch: expected ${transaction.amount}, got ${amount}`);
      return {
        success: false,
        status: 'MANUAL_REVIEW',
        reason: `Amount does not match. Expected ₹${transaction.amount}`,
      };
    }

    // ── 5. All checks passed — mark VERIFIED ─────────────────────────────
    const verified = await prisma.bankTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationNote: `Verified for customer: ${customerName}`,
      },
    });

    logger.info(`✅ Payment verified — UTR: ${utr}, Customer: ${customerName}`);

    return {
      success: true,
      status: 'VERIFIED',
      transaction: {
        utr: verified.utr,
        amount: Number(verified.amount),
        bankName: verified.bankName,
        transactionType: verified.transactionType,
        verifiedAt: verified.verifiedAt ?? undefined,
      },
    };
  }

  /** Get verification status by UTR */
  async getStatusByUTR(utr: string): Promise<{ utr: string; status: string } | null> {
    const transaction = await prisma.bankTransaction.findUnique({
      where: { utr },
      select: { utr: true, status: true, amount: true, bankName: true },
    });
    return transaction;
  }

  private async moveToManualReview(id: string, note: string): Promise<void> {
    await prisma.bankTransaction.update({
      where: { id },
      data: { status: 'MANUAL_REVIEW', verificationNote: note },
    });
    logger.info(`Moved transaction ${id} to MANUAL_REVIEW: ${note}`);
  }
}
