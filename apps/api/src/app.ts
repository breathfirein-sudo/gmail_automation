import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { getEnv } from '@payment/config/src/env';
import { apiRouter } from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './config/logger';

export function createApp(): Application {
  const env = getEnv();
  const app = express();

  // ── Security headers ──────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Body parsers ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Request logging ───────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Rate limiting ─────────────────────────────────────────────────────
  app.use('/api', rateLimiter);

  // ── Health check ──────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API routes ────────────────────────────────────────────────────────
  app.use('/api', apiRouter);

  // ── 404 handler ───────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // ── Global error handler ──────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
