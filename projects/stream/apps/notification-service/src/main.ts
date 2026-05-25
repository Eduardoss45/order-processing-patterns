import { connectPostgres } from './infra/db/connection';
import { startInventoryUpdatedConsumer } from './messaging/consumer/inventory-updated.consumer';
import { buildLogger } from '@repo/logger';
import { env } from './config/env';
import { withRetry } from './bootstrap/with-retry';

const logger = buildLogger(env.SERVICE_NAME);

async function bootstrap() {
  logger.info('Service starting');

  await withRetry(connectPostgres, logger, 'PostgreSQL');
  await withRetry(startInventoryUpdatedConsumer, logger, 'Kafka consumer');

  logger.info('Service started');
}

bootstrap();
