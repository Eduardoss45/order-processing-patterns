#!/bin/sh

echo "Waiting for Kafka..."

until /opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server kafka:9092 >/dev/null 2>&1; do
  echo "Kafka not ready yet..."
  sleep 3
done

echo "Kafka is ready. Creating topics..."

/opt/kafka/bin/kafka-topics.sh --create --if-not-exists --topic order-created --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1

/opt/kafka/bin/kafka-topics.sh --create --if-not-exists --topic payment-processed --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1

/opt/kafka/bin/kafka-topics.sh --create --if-not-exists --topic inventory-updated --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1

echo "Kafka topics created"