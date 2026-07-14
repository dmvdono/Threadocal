import type { FulfillmentMethod } from "@/types/product";

export type OrderStatus =
  | "order_placed"
  | "brand_preparing"
  | "shipped"
  | "delivered"
  | "ready_for_pickup"
  | "picked_up"
  | "completed"
  | "disputed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type ShippingAddress = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
};

export type DemoOrderLine = {
  id: string;
  productId: string;
  productName: string;
  brandName: string;
  selectedSize: string | null;
  selectedColor?: string | null;
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
  paymentStatus?: PaymentStatus;
  fulfillmentMethod?: FulfillmentMethod;
  lines?: DemoOrderLine[];
  pickupLocation?: string;
  pickupSlot?: string | null;
  shippingAddress?: ShippingAddress | null;
  trackingNumber?: string | null;
  dispute?: DemoDispute;
  subtotalCents: number;
  totalCents: number;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  createdAt: string;
  updatedAt: string;
};
