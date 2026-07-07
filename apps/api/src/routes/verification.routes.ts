import { Router } from 'express';
import { body } from 'express-validator';
import * as VerificationController from '../controllers/verification.controller';

export const verificationRouter = Router();

// POST /api/verify — public endpoint for customer payment verification
verificationRouter.post(
  '/',
  [
    body('customerName').trim().notEmpty().withMessage('Customer name is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('utr').trim().notEmpty().isLength({ min: 12, max: 22 }).withMessage('Valid UTR required'),
    body('screenshotUrl').optional().isURL(),
  ],
  VerificationController.verifyPayment,
);

// GET /api/verify/:utr — check verification status by UTR
verificationRouter.get('/:utr', VerificationController.getVerificationStatus);
