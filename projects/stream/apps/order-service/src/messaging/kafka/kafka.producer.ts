import { Producer } from 'kafkajs';
import { kafka } from './kafka.client';

let producer: Producer;

export const getKafkaProducer = () => {
  if (!producer) {
    producer = kafka.producer();
  }
  return producer;
};

export const startProducer = async () => {
  const producer = getKafkaProducer();
  await producer.connect();
};
