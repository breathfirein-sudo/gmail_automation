import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.statusCode}]: ${err.message} — ${req.method} ${req.path}`);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
