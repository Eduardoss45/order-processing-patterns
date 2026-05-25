import { connectPostgres } from './infra/db/connection';
import { startProducer } from './messaging/kafka/kafka.producer';
import { createOrderUseCase } from './modules/order/order.service';
import { buildLogger } from '@repo/logger';
import { env } from './config/env';
import { withRetry } from './bootstrap/with-retry';

const logger = buildLogger(env.SERVICE_NAME);

async function bootstrap() {
  logger.info('Service starting');

  await withRetry(connectPostgres, logger, 'PostgreSQL');
  await withRetry(startProducer, logger, 'Kafka producer');

  await createOrderUseCase();

  logger.info('Service started');
}

bootstrap();
