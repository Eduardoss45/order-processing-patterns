import { connectPostgres } from './infra/db/connection';
import { connectRabbit } from './messaging/rabbit/connection';
import { createOrderUseCase } from './modules/order/order.service';
import { buildLogger } from '@repo/logger';
import { env } from './config/env';
import { withRetry } from './bootstrap/with-retry';

const logger = buildLogger(env.SERVICE_NAME);

async function bootstrap() {
  logger.info('Service starting');

  await withRetry(connectPostgres, logger, 'PostgreSQL');
  await withRetry(connectRabbit, logger, 'RabbitMQ');
  await createOrderUseCase();

  logger.info('Service started');
}

bootstrap();
