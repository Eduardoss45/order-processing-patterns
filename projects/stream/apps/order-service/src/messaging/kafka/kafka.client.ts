import { Kafka } from 'kafkajs';
import { env } from '../../config/env';

export const kafka = new Kafka({
  clientId: env.SERVICE_NAME,
  brokers: [env.KAFKA_BROKERS],
});
