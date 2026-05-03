import { kafka } from './kafka.client';
import { env } from '../../config/env';

export const startConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: env.SERVICE_NAME,
  });

  await consumer.connect();

  console.log('Consumer connected');

  return consumer;
};
