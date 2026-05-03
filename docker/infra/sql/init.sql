CREATE SCHEMA IF NOT EXISTS order_service;

CREATE TABLE order_service.orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_service.processed_messages (
  id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW()
);