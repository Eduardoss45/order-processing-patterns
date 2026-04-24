import 'dotenv/config';
import { connectRabbit } from './messaging/rabbit/connection';
import { startOrderConsumer } from './messaging/consumer/order.consumer';

async function bootstrap() {
  console.log('Worker started');

  await connectRabbit();
  await startOrderConsumer();
}

bootstrap();
