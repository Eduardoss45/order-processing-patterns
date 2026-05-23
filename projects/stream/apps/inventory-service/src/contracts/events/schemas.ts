import { z } from 'zod';

export const envelopeBaseSchema = z.object({
  eventId: z.string().uuid(),
  eventName: z.string().min(1),
  occurredAt: z.string().datetime(),
  correlationId: z.string().uuid(),
  payload: z.unknown(),
});

export const orderCreatedSchema = envelopeBaseSchema.extend({
  eventName: z.literal('order-created'),
  payload: z.object({
    orderId: z.string().uuid(),
    userId: z.string().min(1),
    items: z.array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().positive(),
      })
    ),
  }),
});

export const paymentProcessedSchema = envelopeBaseSchema.extend({
  eventName: z.literal('payment-processed'),
  payload: z.object({
    orderId: z.string().uuid(),
    status: z.enum(['success', 'failed']),
  }),
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
