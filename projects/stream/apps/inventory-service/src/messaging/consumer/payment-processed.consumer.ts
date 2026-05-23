import { randomUUID } from 'crypto';
import { kafka } from '../kafka/kafka.client';
import { publishEvent } from '../producer/event.publisher';
import { paymentProcessedSchema } from '../../contracts/events/schemas';
import { EventEnvelope } from '../../contracts/events/event-envelope';
import { tryMarkEventProcessing } from '../../modules/idempotency/processed-events.repository';
import { env } from '../../config/env';

const isRecoverableError = (err: unknown) => {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('connection') ||
    msg.includes('econnreset') ||
    msg.includes('temporarily')
  );
};

export const startPaymentProcessedConsumer = async () => {
  const consumer = kafka.consumer({ groupId: env.SERVICE_NAME });

  await consumer.connect();
  await consumer.subscribe({ topic: 'payment-processed', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString('utf-8') ?? '';
      const key = message.key?.toString('utf-8') ?? randomUUID();
      let correlationId = 'unknown';

      try {
        const rawJson = JSON.parse(raw);
        if (typeof rawJson?.correlationId === 'string') correlationId = rawJson.correlationId;

        const event = paymentProcessedSchema.parse(rawJson);

        const firstTime = await tryMarkEventProcessing(event.eventId);
        if (!firstTime) return;

        if (event.payload.status !== 'success') {
          return;
        }

        const out: EventEnvelope<{
          orderId: string;
          reservedItems: { productId: string; qty: number }[];
        }> = {
          eventId: randomUUID(),
          eventName: 'inventory-updated',
          occurredAt: new Date().toISOString(),
          correlationId: event.correlationId,
          payload: {
            orderId: event.payload.orderId,
            reservedItems: [{ productId: 'p1', qty: 2 }],
          },
        };

        await publishEvent('inventory-updated', event.payload.orderId, out);
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
          eventName: 'payment-processed-dlq',
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
        await publishEvent('payment-processed-dlq', key, dlq);
      }
    },
  });
};
