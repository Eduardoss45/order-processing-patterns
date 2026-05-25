import amqp from 'amqplib';
import { env } from '../../config/env';
import { buildLogger } from '@repo/logger';

let channel: amqp.Channel;
const logger = buildLogger(env.SERVICE_NAME);

export const connectRabbit = async () => {
  const conn = await amqp.connect(env.RABBITMQ_URL);

  channel = await conn.createChannel();

  await channel.assertQueue(env.DLQ, {
    durable: true,
  });

  await channel.assertQueue(env.RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-message-ttl': 5000,
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': env.QUEUE,
    },
  });

  await channel.assertQueue(env.QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': env.RETRY_QUEUE,
    },
  });

  logger.info('RabbitMQ connected');
};

export const getChannel = () => {
  if (!channel) throw new Error('Channel not initialized');
  return channel;
};
