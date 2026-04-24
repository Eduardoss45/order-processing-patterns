import amqp from 'amqplib';
import { env } from '../../config/env';

let channel: amqp.Channel;

export const connectRabbit = async () => {
  const conn = await amqp.connect(env.RABBITMQ_URL);

  channel = await conn.createChannel();

  await channel.assertQueue('orders', {
    durable: true,
  });

  console.log(`RabbitMQ connected ${env.SERVICE_NAME}`);
};

export const getChannel = () => {
  if (!channel) throw new Error('Channel not initialized');
  return channel;
};
