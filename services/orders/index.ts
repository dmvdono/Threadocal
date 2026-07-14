"use client";

import { createBrowserSupabaseClient } from "@/supabase/client";
import type { DemoDispute, DemoOrderLine, Order, OrderStatus, ShippingAddress } from "@/types/order";
import type { Database } from "@/types/supabase";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

export const ORDERS_UPDATED_EVENT = "threadocal-orders-updated";

function toShippingAddress(order: OrderRow): ShippingAddress | null {
  if (!order.shipping_line1 || !order.shipping_city || !order.shipping_state || !order.shipping_zip_code) {
    return null;
  }

  return {
    fullName: order.shipping_full_name ?? "",
    line1: order.shipping_line1,
    line2: order.shipping_line2 ?? "",
    city: order.shipping_city,
    state: order.shipping_state,
    zipCode: order.shipping_zip_code,
  };
}

function toDispute(order: OrderRow): DemoDispute | undefined {
  if (!order.dispute_reason && !order.dispute_notes) {
    return undefined;
  }

  return {
    reason: order.dispute_reason ?? "Customer reported an issue",
    notes: order.dispute_notes ?? "",
    createdAt: order.updated_at,
  };
}

function mapOrder(order: OrderRow, items: OrderItemRow[]): Order {
  const lines: DemoOrderLine[] = items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    brandName: item.brand_name,
    selectedSize: item.selected_size,
    selectedColor: item.selected_color,
    fulfillmentMethod: order.fulfillment_method,
    pickupSlot: order.pickup_slot,
    quantity: item.quantity,
    unitPriceCents: item.unit_price_cents,
    lineTotalCents: item.line_total_cents,
  }));

  return {
    id: order.id,
    customerId: order.customer_profile_id ?? undefined,
    brandId: order.brand_id,
    status: order.status,
    paymentStatus: order.payment_status,
    fulfillmentMethod: order.fulfillment_method,
    lines,
    pickupLocation: order.pickup_location ?? undefined,
    pickupSlot: order.pickup_slot,
    shippingAddress: toShippingAddress(order),
    trackingNumber: order.tracking_number,
    dispute: toDispute(order),
    subtotalCents: order.subtotal_cents,
    totalCents: order.total_cents,
    stripeCheckoutSessionId: order.stripe_checkout_session_id,
    stripePaymentIntentId: order.stripe_payment_intent_id,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

async function getOrderItems(orderIds: string[]) {
  if (orderIds.length === 0) {
    return [];
  }

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getAuthToken() {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.access_token) {
    throw new Error("Log in before managing orders.");
  }

  return session.access_token;
}

export async function getCustomerOrders() {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = await getOrderItems((orders ?? []).map((order) => order.id));
  return (orders ?? []).map((order) => mapOrder(order, items.filter((item) => item.order_id === order.id)));
}

export async function getOrder(orderId: string) {
  const supabase = createBrowserSupabaseClient();
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!order) {
    return null;
  }

  const items = await getOrderItems([order.id]);
  return mapOrder(order, items);
}

export async function getBrandOrders() {
  const supabase = createBrowserSupabaseClient();
  const { data: profileData } = await supabase.auth.getUser();
  const profileId = profileData.user?.id;

  if (!profileId) {
    throw new Error("Log in as a brand owner to manage orders.");
  }

  const { data: brands, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .or(`owner_profile_id.eq.${profileId},owner_id.eq.${profileId}`)
    .limit(2);

  if (brandError) {
    throw new Error(brandError.message);
  }

  const brandIds = (brands ?? []).map((brand) => brand.id);

  if (brandIds.length === 0) {
    return [];
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .in("brand_id", brandIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = await getOrderItems((orders ?? []).map((order) => order.id));
  return (orders ?? []).map((order) => mapOrder(order, items.filter((item) => item.order_id === order.id)));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string | null) {
  const token = await getAuthToken();
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, trackingNumber }),
  });
  const payload = await response.json() as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Threadocal could not update the order.");
  }

  window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT));
  return getOrder(orderId);
}

export async function addOrderDispute(orderId: string, dispute: Omit<DemoDispute, "createdAt">) {
  const token = await getAuthToken();
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status: "disputed",
      disputeReason: dispute.reason,
      disputeNotes: dispute.notes,
    }),
  });
  const payload = await response.json() as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Threadocal could not submit the dispute.");
  }

  window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT));
  return getOrder(orderId);
}
