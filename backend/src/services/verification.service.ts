import { prisma } from '../lib/prisma';
import { logger } from '../config/logger';

export interface VerificationRequest {
  customerName?: string;
  employeeId?: string;
  amount?: number;
  utr: string;
}

export interface VerificationResult {
  success: boolean;
  status: string;
  transaction?: Record<string, unknown>;
  reason?: string;
}

export class VerificationService {
  async verifyPayment(request: VerificationRequest): Promise<VerificationResult> {
    const { customerName, employeeId, amount, utr } = request;

    // 1. UTR lookup
    const transaction = await prisma.bankTransaction.findUnique({ where: { utr } });
    if (!transaction) {
      logger.info(`UTR not found: ${utr}`);
      return { success: false, status: 'MANUAL_REVIEW', reason: 'UTR not found in our records' };
    }

    // 2. Duplicate check
    if (transaction.status === 'VERIFIED') {
      logger.warn(`Duplicate verification attempt — UTR: ${utr}`);
      return {
        success: false,
        status: 'DUPLICATE',
        reason: 'This transaction has already been verified',
        transaction: {
          utr: transaction.utr,
          amount: Number(transaction.amount),
          bankName: transaction.bankName,
          transactionType: transaction.transactionType,
          verifiedAt: transaction.verifiedAt,
          payerName: transaction.payerName,
          employeeId: transaction.employeeId,
        }
      };
    }
    if (transaction.status === 'DUPLICATE') {
      return { success: false, status: 'DUPLICATE', reason: 'Transaction is marked as duplicate' };
    }

    // 3. Must be CREDIT
    if (transaction.transactionType !== 'CREDIT') {
      await this.moveToManualReview(transaction.id, 'Not a credit transaction', employeeId);
      return { success: false, status: 'MANUAL_REVIEW', reason: 'Only credit transactions can be verified' };
    }

    // 4. Amount match (±1 tolerance)
    if (amount !== undefined) {
      const amountDiff = Math.abs(Number(transaction.amount) - amount);
      if (amountDiff > 1) {
        logger.info(`Amount mismatch: expected ${transaction.amount}, got ${amount}`);
        await this.moveToManualReview(transaction.id, `Amount mismatch: expected ${transaction.amount}, got ${amount}`, employeeId);
        return { success: false, status: 'MANUAL_REVIEW', reason: `Amount mismatch. Expected ₹${transaction.amount}` };
      }
    }

    // 5. All checks passed — mark VERIFIED
    const verified = await prisma.bankTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationNote: customerName ? `Verified for customer: ${customerName}` : 'Verified',
        employeeId: employeeId || null,
      },
    });

    logger.info(`✅ Payment verified — UTR: ${utr}${customerName ? `, Customer: ${customerName}` : ''}${employeeId ? `, Employee: ${employeeId}` : ''}`);
    return {
      success: true,
      status: 'VERIFIED',
      transaction: {
        utr: verified.utr,
        amount: Number(verified.amount),
        bankName: verified.bankName,
        transactionType: verified.transactionType,
        verifiedAt: verified.verifiedAt,
        payerName: verified.payerName,
        employeeId: verified.employeeId,
      },
    };
  }

  async getStatusByUTR(utr: string) {
    return prisma.bankTransaction.findUnique({
      where: { utr },
      select: { utr: true, status: true, amount: true, bankName: true },
    });
  }

  private async moveToManualReview(id: string, note: string, employeeId?: string) {
    await prisma.bankTransaction.update({
      where: { id },
      data: { 
        status: 'MANUAL_REVIEW', 
        verificationNote: note,
        employeeId: employeeId || null,
      },
    });
    logger.info(`Moved ${id} to MANUAL_REVIEW: ${note}`);
  }
}
