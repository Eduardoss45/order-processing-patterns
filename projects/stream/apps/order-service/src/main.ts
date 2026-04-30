import { connectPostgres } from './infra/db/connection';

async function bootstrap() {
  console.log('Service starting...');

  await connectPostgres();
  // await connectKafka(); // infra
  // await startProducer(); // opcional (se producer)
  // await startConsumer(); // opcional (se consumer)

  console.log('Service started');
}
