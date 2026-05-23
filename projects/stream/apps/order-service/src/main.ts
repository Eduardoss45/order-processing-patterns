import { connectPostgres } from './infra/db/connection';
import { startProducer } from './messaging/kafka/kafka.producer';
import { createOrderUseCase } from './modules/order/order.service';

async function bootstrap() {
  console.log('Service starting...');

  await connectPostgres();
  await startProducer();

  await createOrderUseCase();

  console.log('Service started');
}

bootstrap();
