import { Router } from 'express';
import { body } from 'express-validator';
import * as VerificationController from '../controllers/verification.controller';

export const verificationRouter = Router();

// POST /api/verify — public endpoint
verificationRouter.post(
  '/',
  [
    body('customerName').optional().trim(),
    body('employeeId').optional().trim(),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('utr').trim().notEmpty().isLength({ min: 12, max: 22 }).withMessage('Valid UTR required'),
  ],
  VerificationController.verifyPayment,
);

// GET /api/verify/:utr
verificationRouter.get('/:utr', VerificationController.getVerificationStatus);
