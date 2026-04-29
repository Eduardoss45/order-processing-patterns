import { pool } from '../../infra/db/connection';
import { OrderStatus } from './order.types';

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  await pool.query(
    `UPDATE order_service.orders
    SET status = $1
    WHERE id = $2`,
    [status, orderId]
  );
};

export const isMessageProcessed = async (id: string) => {
  const result = await pool.query(`SELECT 1 FROM order_service.processed_messages WHERE id = $1`, [
    id,
  ]);

  return result.rows.length > 0;
};

export const markMessageAsProcessed = async (id: string) => {
  await pool.query(
    `INSERT INTO order_service.processed_messages (id)
        VALUES ($1)
        ON CONFLICT DO NOTHING`,
    [id]
  );
};
