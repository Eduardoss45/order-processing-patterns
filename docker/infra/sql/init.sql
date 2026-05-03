-- SCHEMAS
CREATE SCHEMA IF NOT EXISTS order_service;
CREATE SCHEMA IF NOT EXISTS payment_service;
CREATE SCHEMA IF NOT EXISTS inventory_service;
CREATE SCHEMA IF NOT EXISTS notification_service;

-- ORDER (QUEUE + STREAM)
CREATE TABLE IF NOT EXISTS order_service.orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- QUEUE (worker idempotency)
CREATE TABLE IF NOT EXISTS order_service.processed_messages (
  id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW()
);

-- STREAM (idempotência por serviço)
CREATE TABLE IF NOT EXISTS payment_service.processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_service.processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_service.processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW()
);