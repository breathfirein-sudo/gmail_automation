import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '@payment/database/src/client';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { TransactionStatus } from '@payment/shared';

// GET /api/transactions
export async function listTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(400, 'Invalid query params');

    const {
      page = '1',
      limit = '20',
      status,
      bankName,
      utr,
      startDate,
      endDate,
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (bankName) where.bankName = { contains: bankName, mode: 'insensitive' };
    if (utr) where.utr = { contains: utr.toUpperCase() };
    if (startDate || endDate) {
      where.receivedAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { receivedAt: 'desc' },
        select: {
          id: true,
          utr: true,
          amount: true,
          currency: true,
          transactionType: true,
          bankName: true,
          senderEmail: true,
          status: true,
          parseMethod: true,
          parseConfidence: true,
          receivedAt: true,
          verifiedAt: true,
          sheetsSynced: true,
        },
      }),
      prisma.bankTransaction.count({ where }),
    ]);

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/transactions/:id
export async function getTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const transaction = await prisma.bankTransaction.findUnique({
      where: { id },
      include: { verifiedBy: { select: { name: true, email: true } } },
    });
    if (!transaction) throw new AppError(404, 'Transaction not found');
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/transactions/:id/status
export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, note } = req.body as { status: TransactionStatus; note?: string };

    const valid: TransactionStatus[] = ['UNUSED', 'VERIFIED', 'MANUAL_REVIEW', 'DUPLICATE'];
    if (!valid.includes(status)) throw new AppError(400, 'Invalid status');

    const transaction = await prisma.bankTransaction.update({
      where: { id },
      data: {
        status,
        verificationNote: note,
        ...(status === 'VERIFIED'
          ? { verifiedAt: new Date(), verifiedById: req.user!.sub }
          : {}),
      },
    });

    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

// GET /api/transactions/export
export async function exportTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { format = 'csv' } = req.query as { format?: string };

    const transactions = await prisma.bankTransaction.findMany({
      orderBy: { receivedAt: 'desc' },
      take: 5000,
    });

    if (format === 'csv') {
      const headers = ['UTR', 'Amount', 'Currency', 'Type', 'Bank', 'Status', 'Received At'];
      const rows = transactions.map((t) =>
        [t.utr, t.amount, t.currency, t.transactionType, t.bankName, t.status, t.receivedAt].join(
          ',',
        ),
      );
      const csv = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      res.send(csv);
    } else {
      throw new AppError(400, `Unsupported export format: ${format}`);
    }
  } catch (err) {
    next(err);
  }
}
