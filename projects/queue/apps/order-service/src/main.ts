import { connectPostgres } from './infra/db/connection';
import { connectRabbit } from './messaging/rabbit/connection';
import { createOrderUseCase } from './modules/order/order.service';

async function bootstrap() {
  console.log('Server started');

  await connectPostgres();
  await connectRabbit();
  await createOrderUseCase();
}

bootstrap();
