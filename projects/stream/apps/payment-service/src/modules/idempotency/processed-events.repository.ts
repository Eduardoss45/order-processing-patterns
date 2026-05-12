import { pool } from '../../infra/db/connection';

export const isEventProcessed = async (eventId: string) => {
  const r = await pool.query('SELECT 1 FROM payment_service.processed_events WHERE event_id = $1', [
    eventId,
  ]);

  return (r.rowCount ?? 0) > 0;
};

export const markEventProcessed = async (eventId: string) => {
  await pool.query(
    'INSERT INTO payment_service.processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [eventId]
  );
};
