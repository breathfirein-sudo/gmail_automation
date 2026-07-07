import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { gmailPollerStatus } from '../jobs/gmailPoller';

// GET /api/admin/stats
export async function getDashboardStats(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, verified, manualReview, unused, duplicate, totalAmountResult] =
      await Promise.all([
        prisma.bankTransaction.count(),
        prisma.bankTransaction.count({ where: { receivedAt: { gte: today } } }),
        prisma.bankTransaction.count({ where: { status: 'VERIFIED' } }),
        prisma.bankTransaction.count({ where: { status: 'MANUAL_REVIEW' } }),
        prisma.bankTransaction.count({ where: { status: 'UNUSED' } }),
        prisma.bankTransaction.count({ where: { status: 'DUPLICATE' } }),
        prisma.bankTransaction.aggregate({ _sum: { amount: true }, where: { status: 'VERIFIED' } }),
      ]);

    res.json({
      total, todayCount, verified, manualReview, unused, duplicate,
      totalVerifiedAmount: totalAmountResult._sum.amount ?? 0,
    });
  } catch (err) { next(err); }
}

// GET /api/admin/manual-review
export async function getManualReviewQueue(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const transactions = await prisma.bankTransaction.findMany({
      where: { status: 'MANUAL_REVIEW' },
      orderBy: { receivedAt: 'desc' },
      take: 50,
      select: {
        id: true, utr: true, amount: true, bankName: true,
        transactionType: true, receivedAt: true,
        verificationNote: true, parseConfidence: true,
      },
    });
    res.json({ data: transactions, total: transactions.length });
  } catch (err) { next(err); }
}

// PATCH /api/admin/manual-review/:id
export async function resolveManualReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, note } = req.body as { status: string; note?: string };
    const allowed = ['VERIFIED', 'DUPLICATE', 'UNUSED'];
    if (!allowed.includes(status)) throw new AppError(400, 'Status must be VERIFIED, DUPLICATE, or UNUSED');

    const transaction = await prisma.bankTransaction.update({
      where: { id: req.params.id },
      data: {
        status: status as 'VERIFIED' | 'DUPLICATE' | 'UNUSED',
        verificationNote: note,
        ...(status === 'VERIFIED' ? { verifiedAt: new Date(), verifiedById: req.user!.sub } : {}),
      },
    });
    res.json(transaction);
  } catch (err) { next(err); }
}

// GET /api/admin/polling-status
export function getPollingStatus(_req: AuthRequest, res: Response) {
  res.json(gmailPollerStatus());
}
