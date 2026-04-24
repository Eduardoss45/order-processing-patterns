import { getChannel } from '../rabbit/connection';

export const sendOrderToQueue = async (orderId: string) => {
  const channel = getChannel();

  const msg = {
    type: 'process-order',
    orderId,
  };

  channel.sendToQueue('orders', Buffer.from(JSON.stringify(msg)), {
    persistent: true,
  });

  // console.log('Message sent to queue: ', message);
};
