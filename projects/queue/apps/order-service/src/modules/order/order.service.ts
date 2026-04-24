import { randomUUID } from 'crypto';
import { createOrder } from './order.repository';
import { Order } from './order.types';
import { sendOrderToQueue } from '../../messaging/producer/order.producer';

export const createOrderUseCase = async (): Promise<Order> => {
  const id = randomUUID();

  const order = await createOrder(id);

  await sendOrderToQueue(id);

  return order;
};
