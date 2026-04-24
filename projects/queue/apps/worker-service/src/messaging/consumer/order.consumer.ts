import { getChannel } from '../rabbit/connection';

export const startOrderConsumer = async () => {
  const channel = getChannel();

  channel.prefetch(1);

  channel.consume(
    'orders',
    async msg => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());

        console.log('Message recived: ', content);

        channel.ack(msg);
      } catch (error) {
        console.error('Error processing message: ', error);

        channel.nack(msg, false, true);
      }
    },
    {
      noAck: false,
    }
  );
};
