import { getKafkaProducer } from '../kafka/kafka.producer';
import { EventEnvelope } from '../../contracts/events/event-envelope';

export const publishEvent = async <T>(topic: string, key: string, message: EventEnvelope<T>) => {
  await getKafkaProducer().send({
    topic,
    messages: [{ key, value: JSON.stringify(message) }],
  });
};
