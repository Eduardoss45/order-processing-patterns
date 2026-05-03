import { publishEvent } from '../../messaging/producer/event.publisher';
import { randomUUID } from 'crypto';
import { createOrder } from './order.repository';
import { buildLogger } from '@repo/logger';
import { env } from '../../config/env';

const logger = buildLogger(env.SERVICE_NAME);

export const createOrderUseCase = async () => {
  const id = randomUUID();
  const correlationId = randomUUID();

  await createOrder(id);

  const event = {
    eventId: id,
    eventName: 'order-created',
    occurredAt: new Date().toISOString(),
    correlationId,
    payload: {
      orderId: id,
      userId: 'test-user',
      items: [],
    },
  };

  logger.info('Order created', {
    orderId: id,
    correlationId,
  });

  await publishEvent({
    topic: 'order-created',
    key: id,
    message: event,
  });
};
