export type EventEnvelope<T = unknown> = {
  eventId: string;
  eventName: string;
  occurredAt: string;
  correlationId: string;
  payload: T;
};
