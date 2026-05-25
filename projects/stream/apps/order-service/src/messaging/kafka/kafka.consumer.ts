import { kafka } from './kafka.client';
import { env } from '../../config/env';
import { buildLogger } from '@repo/logger';

const logger = buildLogger(env.SERVICE_NAME);

export const startConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: env.SERVICE_NAME,
  });

  await consumer.connect();

  logger.info('Consumer connected');

  return consumer;
};
