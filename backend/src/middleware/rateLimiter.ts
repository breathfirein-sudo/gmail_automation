import rateLimit from 'express-rate-limit';
import { getEnv } from '../config/env';

const env = getEnv();

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 10000 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: env.NODE_ENV === 'development' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again later.' },
});
