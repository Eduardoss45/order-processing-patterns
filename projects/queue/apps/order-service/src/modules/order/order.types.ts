export type OrderStatus = 'CREATED' | 'PAID' | 'INVENTORY_UPDATED' | 'COMPLETED' | 'FAILED';

export interface Order {
  id: string;
  status: OrderStatus;
  created_at: Date;
}
