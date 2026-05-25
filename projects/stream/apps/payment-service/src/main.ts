import { connectPostgres } from './infra/db/connection';
import { startProducer } from './messaging/kafka/kafka.producer';
import { startOrderCreatedConsumer } from './messaging/consumer/order-created.consumer';
import { buildLogger } from '@repo/logger';
import { env } from './config/env';
import { withRetry } from './bootstrap/with-retry';

const logger = buildLogger(env.SERVICE_NAME);

async function bootstrap() {
  logger.info('Service starting');

  await withRetry(connectPostgres, logger, 'PostgreSQL');
  await withRetry(startProducer, logger, 'Kafka producer');
  await withRetry(startOrderCreatedConsumer, logger, 'Kafka consumer');

  logger.info('Service started');
}

bootstrap();
