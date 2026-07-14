import { apiErrorResponse, requireApiAuth } from "@/app/api/_utils/auth";
import type { OrderStatus } from "@/types/order";

type StatusRequest = {
  status?: OrderStatus;
  trackingNumber?: string | null;
  disputeReason?: string | null;
  disputeNotes?: string | null;
};

const brandPickupStatuses: OrderStatus[] = ["brand_preparing", "ready_for_pickup"];
const brandShippingStatuses: OrderStatus[] = ["brand_preparing", "shipped", "delivered"];
const customerPickupStatuses: OrderStatus[] = ["picked_up", "completed", "disputed"];
const customerShippingStatuses: OrderStatus[] = ["completed", "disputed"];
const adminStatuses: OrderStatus[] = [
  "order_placed",
  "brand_preparing",
  "shipped",
  "delivered",
  "ready_for_pickup",
  "picked_up",
  "completed",
  "disputed",
  "cancelled",
];

function normalizeStatus(value: unknown): OrderStatus | null {
  return adminStatuses.includes(value as OrderStatus) ? value as OrderStatus : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { admin, profile } = await requireApiAuth(request);
    const body = (await request.json()) as StatusRequest;
    const status = normalizeStatus(body.status);

    if (!status) {
      return Response.json({ error: "Select a valid order status." }, { status: 400 });
    }

    const { data: order, error: orderError } = await admin.from("orders").select("*").eq("id", id).maybeSingle();

    if (orderError) {
      throw new Error(orderError.message);
    }

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    const { data: brand, error: brandError } = await admin.from("brands").select("*").eq("id", order.brand_id).maybeSingle();

    if (brandError) {
      throw new Error(brandError.message);
    }

    const isCustomerOwner = order.customer_profile_id === profile.id;
    const isBrandOwner = brand?.owner_profile_id === profile.id || brand?.owner_id === profile.id;
    const isAdmin = profile.role === "admin";
    const allowedStatuses = isAdmin
      ? adminStatuses
      : isBrandOwner
        ? order.fulfillment_method === "local_pickup"
          ? brandPickupStatuses
          : brandShippingStatuses
        : isCustomerOwner
          ? order.fulfillment_method === "local_pickup"
            ? customerPickupStatuses
            : customerShippingStatuses
          : [];

    if (!allowedStatuses.includes(status)) {
      return Response.json({ error: "You cannot make that order status change." }, { status: 403 });
    }

    if (status === "picked_up" && order.status !== "ready_for_pickup" && !isAdmin) {
      return Response.json({ error: "The brand must mark the pickup ready before you can confirm pickup." }, { status: 400 });
    }

    if (status === "completed" && order.fulfillment_method === "shipping" && order.status !== "delivered" && !isAdmin) {
      return Response.json({ error: "Shipping orders can be completed after delivery." }, { status: 400 });
    }

    const update = {
      status,
      tracking_number: body.trackingNumber?.trim() || order.tracking_number,
      dispute_reason: status === "disputed" ? body.disputeReason?.trim() || "Customer reported an issue" : order.dispute_reason,
      dispute_notes: status === "disputed" ? body.disputeNotes?.trim() || null : order.dispute_notes,
      updated_at: new Date().toISOString(),
    };
    const { data: updatedOrder, error: updateError } = await admin
      .from("orders")
      .update(update)
      .eq("id", order.id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return Response.json({ order: updatedOrder });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
