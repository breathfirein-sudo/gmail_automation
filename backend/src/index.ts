import 'dotenv/config';
import { getEnv } from './config/env';
import { createApp } from './app';
import { startGmailPoller } from './jobs/gmailPoller';
import { logger } from './config/logger';

async function bootstrap() {
  const env = getEnv();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Backend running on http://localhost:${env.PORT}`);
    logger.info(`   NODE_ENV: ${env.NODE_ENV}`);
    logger.info(`   Frontend origin: ${env.WEB_ORIGIN}`);
  });

  // Start Gmail polling
  startGmailPoller();

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(() => {
      logger.info('Server closed.');
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
  console.error('Fatal startup error:', err);
  process.exit(1);
});
