import { connectPostgres } from './infra/db/connection';
import { startProducer } from './messaging/kafka/kafka.producer';
import { startOrderCreatedConsumer } from './messaging/consumer/order-created.consumer';

async function bootstrap() {
  console.log('Payment service starting...');

  await connectPostgres();
  await startProducer();
  await startOrderCreatedConsumer();

  console.log('Payment service started');
}

bootstrap();
