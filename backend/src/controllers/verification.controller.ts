import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { VerificationService } from '../services/verification.service';
import { logger } from '../config/logger';

const verificationService = new VerificationService();

// POST /api/verify
export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(400, 'Validation failed: ' + JSON.stringify(errors.array()));

    const { customerName, employeeId, amount, utr } = req.body as { customerName?: string; employeeId?: string; amount?: number; utr: string };
    logger.info(`Verify request — UTR: ${utr}${amount !== undefined ? `, Amount: ${amount}` : ''}${customerName ? `, Customer: ${customerName}` : ''}${employeeId ? `, Employee: ${employeeId}` : ''}`);

    const result = await verificationService.verifyPayment({
      customerName,
      employeeId,
      amount: amount !== undefined ? Number(amount) : undefined,
      utr: utr.toUpperCase().trim(),
    });

    res.status(200).json(result);
  } catch (err) { next(err); }
}

// GET /api/verify/:utr
export async function getVerificationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await verificationService.getStatusByUTR(req.params.utr.toUpperCase().trim());
    if (!status) throw new AppError(404, 'UTR not found');
    res.json(status);
  } catch (err) { next(err); }
}
