import { getKafkaProducer } from '../kafka/kafka.producer';
import { env } from '../../config/env';
import { buildLogger } from '@repo/logger';
import { EventEnvelope } from '../../contracts/events/event-envelope';

const logger = buildLogger(env.SERVICE_NAME);

export const publishEvent = async <T>({
  topic,
  key,
  message,
}: {
  topic: string;
  key: string;
  message: EventEnvelope<T>;
}) => {
  const producer = getKafkaProducer();

  await producer.send({
    topic,
    messages: [{ key, value: JSON.stringify(message) }],
  });

  logger.info('Event published', {
    topic,
    key,
    eventName: message.eventName,
    correlationId: message.correlationId,
  });
};
