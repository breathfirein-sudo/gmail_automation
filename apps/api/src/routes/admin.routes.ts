import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as AdminController from '../controllers/admin.controller';

export const adminRouter = Router();

// All admin routes require ADMIN role
adminRouter.use(authenticate, authorize('ADMIN'));

// GET /api/admin/stats — dashboard metrics
adminRouter.get('/stats', AdminController.getDashboardStats);

// GET /api/admin/manual-review — manual review queue
adminRouter.get('/manual-review', AdminController.getManualReviewQueue);

// PATCH /api/admin/manual-review/:id — resolve a manual review item
adminRouter.patch('/manual-review/:id', AdminController.resolveManualReview);

// GET /api/admin/polling-status — Gmail poller health
adminRouter.get('/polling-status', AdminController.getPollingStatus);
