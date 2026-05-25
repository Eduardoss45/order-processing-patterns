import { z } from 'zod';

export const envelopeBaseSchema = z.object({
  eventId: z.string().uuid(),
  eventName: z.string().min(1),
  occurredAt: z.string().datetime(),
  correlationId: z.string().uuid(),
  payload: z.unknown(),
});

export const inventoryUpdatedSchema = envelopeBaseSchema.extend({
  eventName: z.literal('inventory-updated'),
  payload: z.object({
    orderId: z.string().uuid(),
    reservedItems: z.array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().positive(),
      })
    ),
  }),
});
