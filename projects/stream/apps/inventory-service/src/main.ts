import { connectPostgres } from './infra/db/connection';
import { startProducer } from './messaging/kafka/kafka.producer';
import { startPaymentProcessedConsumer } from './messaging/consumer/payment-processed.consumer';

async function bootstrap() {
  console.log('Inventory service starting...');

  await connectPostgres();
  await startProducer();
  await startPaymentProcessedConsumer();

  console.log('Inventory service started');
}

bootstrap();
