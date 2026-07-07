import { Router } from 'express';
import { body } from 'express-validator';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import * as AuthController from '../controllers/auth.controller';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post(
  '/login',
  authRateLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })],
  AuthController.login,
);

// POST /api/auth/refresh
authRouter.post('/refresh', AuthController.refresh);

// POST /api/auth/logout
authRouter.post('/logout', authenticate, AuthController.logout);

// GET /api/auth/google — initiate OAuth
authRouter.get('/google', AuthController.googleAuth);

// GET /api/auth/google/callback
authRouter.get('/google/callback', AuthController.googleCallback);

// GET /api/auth/me
authRouter.get('/me', authenticate, AuthController.getMe);
