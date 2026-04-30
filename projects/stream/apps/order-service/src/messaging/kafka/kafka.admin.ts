import { getKafka } from './kafka';

export const initKafka = async () => {
  const kafka = getKafka();

  const admin = kafka.admin();
  await admin.connect();

  console.log('Kafka admin connected');

  await admin.createTopics({
    topics: [{ topic: 'order-created' }, { topic: 'payment-processed' }],
  });

  await admin.disconnect();
};
