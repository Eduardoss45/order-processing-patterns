import { Pool } from 'pg';
import { env } from '../../config/env';
import { buildLogger } from '@repo/logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const logger = buildLogger(env.SERVICE_NAME);

export const connectPostgres = async () => {
  const client = await pool.connect();

  try {
    await client.query('SELECT 1');
    logger.info('PostgreSQL connected');
  } finally {
    client.release();
  }
};
