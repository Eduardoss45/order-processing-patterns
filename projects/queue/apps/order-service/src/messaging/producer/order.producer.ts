import { randomUUID } from 'crypto';
import { getChannel } from '../rabbit/connection';

export const sendOrderToQueue = async (orderId: string, correlationId: string) => {
  const channel = getChannel();

  const msg = {
    type: 'process-order',
    orderId,
  };

  channel.sendToQueue('orders', Buffer.from(JSON.stringify(msg)), {
    persistent: true,
    correlationId,
  });
};
