import { randomUUID } from 'crypto';
import { createOrder } from './order.repository';
import { Order } from './order.types';
import { sendOrderToQueue } from '../../messaging/producer/order.producer';
import { buildLogger } from '@repo/logger';
import { env } from '../../config/env';

const logger = buildLogger(env.SERVICE_NAME);

export const createOrderUseCase = async (): Promise<Order> => {
  const id = randomUUID();
  const correlationId = randomUUID();

  const order = await createOrder(id);

  logger.info('Order created', {
    orderId: order.id,
    correlationId: correlationId,
  });

  await sendOrderToQueue(id, correlationId);

  return order;
};
