import { pool } from '../../infra/db/connection';

export const tryMarkEventProcessing = async (eventId: string) => {
  const r = await pool.query(
    `INSERT INTO inventory_service.processed_events (event_id)
     VALUES ($1)
     ON CONFLICT DO NOTHING`,
    [eventId]
  );
  return (r.rowCount ?? 0) > 0;
};
