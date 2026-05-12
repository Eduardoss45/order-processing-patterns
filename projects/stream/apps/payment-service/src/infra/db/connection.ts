import { Pool } from 'pg';
import { env } from '../../config/env';

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const connectPostgres = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('PostgreSQL connected');
  } finally {
    client.release();
  }
};
