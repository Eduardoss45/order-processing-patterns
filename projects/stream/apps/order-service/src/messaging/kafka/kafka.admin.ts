import { kafka } from './kafka.client';

export const startAdmin = async () => {
  const admin = kafka.admin();

  await admin.connect();
  console.log('Admin connected');

  const existingTopics = await admin.listTopics();

  const topicsToCreate = ['order-created', 'payment-processed'].filter(
    topic => !existingTopics.includes(topic)
  );

  if (topicsToCreate.length > 0) {
    await admin.createTopics({
      topics: topicsToCreate.map(topic => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
      })),
      waitForLeaders: true,
    });

    console.log('Topics created:', topicsToCreate);
  } else {
    console.log('Topics already exist');
  }

  await admin.disconnect();
};
