import { Producer } from 'kafkajs';
import { kafka } from './kafka.client';

let producer: Producer | null = null;

export const getKafkaProducer = () => {
  if (!producer) producer = kafka.producer();
  return producer;
};

export const startProducer = async () => {
  await getKafkaProducer().connect();
};
