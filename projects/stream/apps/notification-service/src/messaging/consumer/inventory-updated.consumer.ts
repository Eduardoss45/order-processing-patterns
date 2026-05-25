import { randomUUID } from 'crypto';
import { kafka } from '../kafka/kafka.client';
import { inventoryUpdatedSchema } from '../../contracts/events/schemas';
import { EventEnvelope } from '../../contracts/events/event-envelope';
import { tryMarkEventProcessing } from '../../modules/idempotency/processed-events.repository';
import { env } from '../../config/env';
import { buildLogger } from '@repo/logger';

const logger = buildLogger(env.SERVICE_NAME);

const isRecoverableError = (err: unknown) => {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('connection') ||
    msg.includes('econnreset') ||
    msg.includes('temporarily')
  );
};

export const startInventoryUpdatedConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: env.SERVICE_NAME,
  });

  await consumer.connect();
  await consumer.subscribe({
    topic: 'inventory-updated',
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString('utf-8') ?? '';
      let correlationId = 'unknown';

      try {
        const rawJson = JSON.parse(raw);
        if (typeof rawJson?.correlationId === 'string') correlationId = rawJson.correlationId;

        const event = inventoryUpdatedSchema.parse(rawJson);

        const firstTime = await tryMarkEventProcessing(event.eventId);
        if (!firstTime) {
          logger.warn('Skipping duplicate', {
            correlationId: event.correlationId,
            orderId: event.payload.orderId,
            topic,
            partition,
            offset: message.offset,
          });
          return;
        }

        logger.info('User notified', {
          orderId: event.payload.orderId,
          correlationId: event.correlationId,
          items: event.payload.reservedItems.length,
          topic,
          partition,
          offset: message.offset,
        });
      } catch (err) {
        if (isRecoverableError(err)) throw err;

        const dlq: EventEnvelope<{
          raw: string;
          error: string;
          topic: string;
          partition: number;
          offset: string;
        }> = {
          eventId: randomUUID(),
          eventName: 'inventory-updated-dlq',
          occurredAt: new Date().toISOString(),
          correlationId,
          payload: {
            raw,
            error: err instanceof Error ? err.message : String(err),
            topic,
            partition,
            offset: message.offset,
          },
        };

        logger.error('DLQ event', dlq);
      }
    },
  });
};
