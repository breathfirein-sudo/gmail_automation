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
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Validation failed: ' + JSON.stringify(errors.array()));
    }

    const { customerName, amount, utr, screenshotUrl } = req.body as {
      customerName: string;
      amount: number;
      utr: string;
      screenshotUrl?: string;
    };

    logger.info(`Verification request — UTR: ${utr}, Amount: ${amount}, Customer: ${customerName}`);

    const result = await verificationService.verifyPayment({
      customerName,
      amount: Number(amount),
      utr: utr.toUpperCase().trim(),
      screenshotUrl,
    });

    const statusCode = result.success ? 200 : 422;
    res.status(statusCode).json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/verify/:utr
export async function getVerificationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { utr } = req.params;
    const status = await verificationService.getStatusByUTR(utr.toUpperCase().trim());
    if (!status) throw new AppError(404, 'UTR not found');
    res.json(status);
  } catch (err) {
    next(err);
  }
}
