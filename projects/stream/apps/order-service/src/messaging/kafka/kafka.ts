import { Kafka } from 'kafkajs';
import { env } from '../../config/env';

let kafka: Kafka | null = null;

export const getKafka = () => {
  if (!kafka) {
    kafka = new Kafka({
      clientId: env.SERVICE_NAME,
      brokers: env.KAFKA_BROKERS.split(','),
    });
  }

  return kafka;
};


