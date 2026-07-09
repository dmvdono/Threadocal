import type { FulfillmentMethod } from "@/types/product";

export type OrderStatus =
  | "order_placed"
  | "brand_preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "completed"
  | "disputed"
  | "cancelled";

export type DemoOrderLine = {
  id: string;
  productId: string;
  productName: string;
  brandName: string;
  selectedSize: string | null;
  fulfillmentMethod: FulfillmentMethod;
  pickupSlot: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type DemoDispute = {
  reason: string;
  notes: string;
  createdAt: string;
};

export type Order = {
  id: string;
  customerId?: string;
  brandId?: string;
  status: OrderStatus;
  lines?: DemoOrderLine[];
  pickupLocation?: string;
  pickupSlot?: string | null;
  dispute?: DemoDispute;
  subtotalCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
};
