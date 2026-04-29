import 'dotenv/config';
import { z } from 'zod';
import { zURL } from '@repo/validation';

const schema = z.object({
  DATABASE_URL: zURL(),
  RABBITMQ_URL: zURL(),
  SERVICE_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  QUEUE: z.string().default('orders'),
  RETRY_QUEUE: z.string().default('orders_retry'),
  DLQ: z.string().default('orders_dlq'),
  MAX_RETRIES: z.number().default(3),
});

export const env = schema.parse(process.env);
