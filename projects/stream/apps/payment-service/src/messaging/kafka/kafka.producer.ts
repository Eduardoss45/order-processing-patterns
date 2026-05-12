import { Producer } from 'kafkajs';
import { kafka } from './kafka.client';

let producer: Producer;

export const getKafkaProducer = () => {
  if (!producer) producer = kafka.producer();
  return producer;
};

export const stratProducer = async () => {
  await getKafkaProducer().connect();
  console.log('Producer connected');
};
