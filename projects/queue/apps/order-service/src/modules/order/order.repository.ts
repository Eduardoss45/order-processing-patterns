import { pool } from '../../infra/db/connection';
import { Order } from './order.types';

export const createOrder = async (id: string): Promise<Order> => {
  const result = await pool.query(
    `INSERT INTO order_service.orders (id, status)
    VALUES ($1, $2)
    RETURNING id, status, created_at`,
    [id, 'CREATED']
  );

  return result.rows[0] ?? null;
};
