import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as AdminController from '../controllers/admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('ADMIN'));

// GET /api/admin/stats
adminRouter.get('/stats', AdminController.getDashboardStats);

// GET /api/admin/manual-review
adminRouter.get('/manual-review', AdminController.getManualReviewQueue);

// PATCH /api/admin/manual-review/:id
adminRouter.patch('/manual-review/:id', AdminController.resolveManualReview);

// GET /api/admin/polling-status
adminRouter.get('/polling-status', AdminController.getPollingStatus);
