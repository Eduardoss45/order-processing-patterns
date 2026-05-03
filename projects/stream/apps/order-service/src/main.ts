import { connectPostgres } from './infra/db/connection';
import { startAdmin } from './messaging/kafka/kafka.admin';
import { startConsumer } from './messaging/kafka/kafka.consumer';
import { startProducer } from './messaging/kafka/kafka.producer';
import { createOrderUseCase } from './modules/order/order.service';

async function bootstrap() {
  console.log('Service starting...');

  await connectPostgres();
  await startAdmin();
  await startProducer();
  await startConsumer();
  
  await createOrderUseCase();

  console.log('Service started');
}

bootstrap();
