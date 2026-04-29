import { log } from 'node:console';
import { env } from '../../config/env';
import { processOrder } from '../../modules/order/order.processor';
import { isMessageProcessed, markMessageAsProcessed } from '../../modules/order/order.repository';
import { getChannel } from '../rabbit/connection';
import { buildLogger } from '@repo/logger';

const logger = buildLogger(env.SERVICE_NAME);

const getRetryCount = (msg: any): number => {
  return msg.properties.headers?.['x-retry-count'] || 0;
};

export const startOrderConsumer = async () => {
  const channel = getChannel();

  channel.prefetch(1);

  channel.consume(
    env.QUEUE,
    async msg => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());

      const correlationId = msg.properties.correlationId || 'unknown';

      const orderId = content.orderId;

      const ctx = { correlationId, orderId };

      logger.info('Message received', ctx);

      try {
        const alreadyProcessed = await isMessageProcessed(orderId);

        if (alreadyProcessed) {
          logger.warn('Skipping duplicate', ctx);
          channel.ack(msg);
          return;
        }

        await processOrder(orderId, ctx);

        logger.info('Message processed', ctx);

        await markMessageAsProcessed(orderId);

        channel.ack(msg);
      } catch (error: any) {
        logger.error('Processing failed', {
          ...ctx,
          error: error.message,
        });

        const retryCount = getRetryCount(msg);

        console.error('Processing failed: ', orderId, 'retry: ', retryCount);

        if (retryCount >= env.MAX_RETRIES) {
          channel.sendToQueue(env.DLQ, msg.content, {
            persistent: true,
            headers: {
              'x-retry-count': retryCount,
            },
          });

          channel.ack(msg);
          return;
        }

        channel.sendToQueue(env.RETRY_QUEUE, msg.content, {
          persistent: true,
          headers: {
            'x-retry-count': retryCount + 1,
          },
        });

        channel.ack(msg);
      }
    },
    {
      noAck: false,
    }
  );
};
