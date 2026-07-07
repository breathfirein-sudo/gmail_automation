import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import * as TransactionsController from '../controllers/transactions.controller';

export const transactionsRouter = Router();

// All transaction routes require authentication
transactionsRouter.use(authenticate);

// GET /api/transactions — paginated list with filters
transactionsRouter.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['UNUSED', 'VERIFIED', 'MANUAL_REVIEW', 'DUPLICATE']),
    query('bankName').optional().isString(),
    query('utr').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  TransactionsController.listTransactions,
);

// GET /api/transactions/:id
transactionsRouter.get('/:id', TransactionsController.getTransaction);

// PATCH /api/transactions/:id/status — ADMIN or OPERATOR only
transactionsRouter.patch(
  '/:id/status',
  authorize('ADMIN', 'OPERATOR'),
  TransactionsController.updateStatus,
);

// GET /api/transactions/export — CSV/Excel/PDF export
transactionsRouter.get(
  '/export',
  authorize('ADMIN', 'OPERATOR'),
  TransactionsController.exportTransactions,
);
