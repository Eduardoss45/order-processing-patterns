import 'dotenv/config';
import { z } from 'zod';
import { zURL } from '@repo/validation';

const schema = z.object({
  DATABASE_URL: zURL(),
  KAFKA_BROKERS: zURL(),
  SERVICE_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export const env = schema.parse(process.env);
