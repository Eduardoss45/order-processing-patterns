import { kafka } from './kafka.client';
import { buildLogger } from '@repo/logger';
import { env } from '../../config/env';

const logger = buildLogger(env.SERVICE_NAME);

export const startAdmin = async () => {
  const admin = kafka.admin();

  await admin.connect();
  logger.info('Admin connected');

  const existingTopics = await admin.listTopics();

  const topicsToCreate = ['order-created', 'payment-processed'].filter(
    topic => !existingTopics.includes(topic)
  );

  if (topicsToCreate.length > 0) {
    await admin.createTopics({
      topics: topicsToCreate.map(topic => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
      })),
      waitForLeaders: true,
    });

    logger.info('Topics created', { topics: topicsToCreate });
  } else {
    logger.info('Topics already exist');
  }

  await admin.disconnect();
};
