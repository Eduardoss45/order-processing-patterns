import { buildLogger } from '@repo/logger';
import { updateOrderStatus } from './order.repository';
import { env } from '../../config/env';

const logger = buildLogger(env.SERVICE_NAME);

export const processOrder = async (
  orderId: string,
  ctx: { correlationId?: string; orderId: string }
) => {
  logger.info('Processing order', ctx);

  await processPayment(orderId, ctx);
  await updateOrderStatus(orderId, 'PAID');

  await updateInventory(orderId, ctx);
  await updateOrderStatus(orderId, 'INVENTORY_UPDATED');

  await sendNotification(orderId, ctx);
  await updateOrderStatus(orderId, 'COMPLETED');

  logger.info('Order completed', ctx);
};

const processPayment = async (orderId: string, ctx: any) => {
  logger.info('Payment processed', ctx);
};

const updateInventory = async (orderId: string, ctx: any) => {
  logger.info('Inventory updated', ctx);
};

const sendNotification = async (orderId: string, ctx: any) => {
  logger.info('Notification sent', ctx);
};
