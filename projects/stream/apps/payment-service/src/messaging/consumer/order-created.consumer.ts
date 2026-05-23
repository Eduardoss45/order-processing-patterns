import { kafka } from '../kafka/kafka.client';
import { env } from '../../config/env';
import { buildLogger } from '@repo/logger';
import { z } from 'zod';
import { tryMarkEventProcessing } from '../../modules/idempotency/processed-events.repository';
import { publishEvent } from '../producer/event.publisher';
import { randomUUID } from 'crypto';
import { EventEnvelope } from '../../contracts/events/event-envelope';

const logger = buildLogger(env.SERVICE_NAME);

const isRecoverableError = (err: unknown) => {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('temporarily') ||
    message.includes('econnreset') ||
    message.includes('too many connections')
  );
};

const orderCreatedSchema = z.object({
  eventId: z.string().min(1),
  eventName: z.literal('order-created'),
  occurredAt: z.string().min(1),
  correlationId: z.string().min(1),
  payload: z.object({
    orderId: z.string().min(1),
    userId: z.string().min(1),
    items: z.array(z.any()),
  }),
});

export const startOrderCreatedConsumer = async () => {
  const consumer = kafka.consumer({ groupId: env.SERVICE_NAME });

  await consumer.connect();
  await consumer.subscribe({ topic: 'order-created', fromBeginning: false });

  logger.info('Consumer subscribed', { topic: 'order-created', groupId: env.SERVICE_NAME });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString('utf-8') ?? '';
      const key = message.key?.toString('utf-8') ?? '';
      const ctxBase = { topic, partition, offset: message.offset, key };
      let extractedCorrelationId: string | undefined;

      try {
        const rawJson = JSON.parse(raw);
        if (rawJson && typeof rawJson.correlationId === 'string') {
          extractedCorrelationId = rawJson.correlationId;
        }

        const parsed = orderCreatedSchema.parse(rawJson);
        const ctx = { ...ctxBase, correlationId: parsed.correlationId, eventId: parsed.eventId };

        logger.info('Event received', ctx);

        const firstTime = await tryMarkEventProcessing(parsed.eventId);
        if (!firstTime) {
          logger.warn('Skipping duplicate', ctx);
          return;
        }

        logger.info('Payment processed (mock)', { ...ctx, orderId: parsed.payload.orderId });

        const out: EventEnvelope<{ orderId: string }> = {
          eventId: randomUUID(),
          eventName: 'payment-processed',
          occurredAt: new Date().toISOString(),
          correlationId: parsed.correlationId,
          payload: { orderId: parsed.payload.orderId },
        };

        await publishEvent('payment-processed', parsed.payload.orderId, out);

        logger.info('Done', ctx);
      } catch (err: any) {
        if (isRecoverableError(err)) {
          logger.error('Recoverable error, retrying', {
            ...ctxBase,
            error: err?.message ?? String(err),
          });
          throw err;
        }

        logger.error('Failed processing message', {
          ...ctxBase,
          error: err?.message ?? String(err),
        });

        const dlq: EventEnvelope<any> = {
          eventId: randomUUID(),
          eventName: 'order-created-dlq',
          occurredAt: new Date().toISOString(),
          correlationId: extractedCorrelationId ?? 'unknown',
          payload: {
            raw,
            error: err?.message ?? String(err),
            topic,
            partition,
            offset: message.offset,
          },
        };

        await publishEvent('order-created-dlq', key || randomUUID(), dlq);
      }
    },
  });
};
