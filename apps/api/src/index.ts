import 'dotenv/config';
import { getEnv } from '@payment/config/src/env';
import { createApp } from './app';
import { startGmailPoller } from './jobs/gmailPoller';
import { logger } from './config/logger';

async function bootstrap() {
  const env = getEnv();
  const app = createApp();

  const server = app.listen(env.API_PORT, () => {
    logger.info(`🚀 API server running on http://localhost:${env.API_PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
  });

  // Start Gmail polling job
  startGmailPoller();

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
