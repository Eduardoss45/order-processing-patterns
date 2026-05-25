import 'dotenv/config';
import { connectRabbit } from './messaging/rabbit/connection';
import { startOrderConsumer } from './messaging/consumer/order.consumer';
import { buildLogger } from '@repo/logger';
import { env } from './config/env';
import { withRetry } from './bootstrap/with-retry';

const logger = buildLogger(env.SERVICE_NAME);

async function bootstrap() {
  logger.info('Service starting');

  await withRetry(connectRabbit, logger, 'RabbitMQ');
  await startOrderConsumer();

  logger.info('Service started');
}

bootstrap();
