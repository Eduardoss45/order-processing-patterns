import { EventEnvelope } from './../../contracts/events/event-envelope';
import { getKafkaProducer } from '../kafka/kafka.producer';
import { buildLogger } from '@repo/logger';
import { env } from '../../config/env';

const logger = buildLogger(env.SERVICE_NAME);

export const publishEvent = async <T>(topic: string, key: string, message: EventEnvelope<T>) => {
  await getKafkaProducer().send({
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
