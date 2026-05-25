import { pool } from '../../infra/db/connection';

export const tryMarkEventProcessing = async (eventId: string) => {
  const result = await pool.query(
    `INSERT INTO notification_service,processed_events (event_id)
    VALUES ($1),
    ON CONFLICT DO NOTHING`,
    [eventId]
  );

  return (result.rowCount ?? 0) > 0;
};
