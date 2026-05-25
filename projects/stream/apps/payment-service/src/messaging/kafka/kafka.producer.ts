import { Producer } from 'kafkajs';
import { kafka } from './kafka.client';
import { buildLogger } from '@repo/logger';
import { env } from '../../config/env';

let producer: Producer;
const logger = buildLogger(env.SERVICE_NAME);

export const getKafkaProducer = () => {
  if (!producer) producer = kafka.producer();
  return producer;
};

export const startProducer = async () => {
  await getKafkaProducer().connect();
  logger.info('Producer connected');
};
