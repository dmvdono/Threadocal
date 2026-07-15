import { apiErrorResponse, requireApiAuth } from "@/app/api/_utils/auth";
import { stripeRequest, type StripeCheckoutSession } from "@/services/payments";

type FinalizeRequest = {
  sessionId?: string;
};

async function decrementInventoryForOrder(admin: Awaited<ReturnType<typeof requireApiAuth>>["admin"], orderId: string) {
  const { data: items, error: itemError } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .not("product_variant_id", "is", null);

  if (itemError) {
    throw new Error(itemError.message);
  }

  for (const item of items ?? []) {
    if (!item.product_variant_id) {
      continue;
    }

    const { data: inventory, error: inventoryError } = await admin
      .from("product_inventory")
      .select("*")
      .eq("product_variant_id", item.product_variant_id)
      .maybeSingle();

    if (inventoryError) {
      throw new Error(inventoryError.message);
    }

    if (!inventory) {
      continue;
    }

    const { error: updateError } = await admin
      .from("product_inventory")
      .update({
        stock_quantity: Math.max(0, inventory.stock_quantity - item.quantity),
        updated_at: new Date().toISOString(),
      })
      .eq("product_variant_id", item.product_variant_id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

export async function POST(request: Request) {
  try {
    const { admin, profile } = await requireApiAuth(request);
    const { sessionId } = (await request.json()) as FinalizeRequest;

    if (!sessionId) {
      return Response.json({ error: "Missing Stripe checkout session." }, { status: 400 });
    }

    const session = await stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      return Response.json({ error: "Stripe checkout did not include an order id." }, { status: 400 });
    }

    const { data: order, error: orderError } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();

    if (orderError) {
      throw new Error(orderError.message);
    }

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (profile.role !== "admin" && order.customer_profile_id !== profile.id) {
      return Response.json({ error: "You can only finalize your own checkout." }, { status: 403 });
    }

    if (session.payment_status !== "paid") {
      return Response.json({ error: "Stripe payment is not complete yet." }, { status: 402 });
    }

    if (order.payment_status === "paid") {
      return Response.json({ orderId: order.id, order });
    }

    const { data: updatedOrder, error: updateError } = await admin
      .from("orders")
      .update({
        payment_status: "paid",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "pending")
      .select("*")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!updatedOrder) {
      const { data: currentOrder, error: currentOrderError } = await admin
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .maybeSingle();

      if (currentOrderError) {
        throw new Error(currentOrderError.message);
      }

      return Response.json({ orderId: order.id, order: currentOrder });
    }

    await decrementInventoryForOrder(admin, order.id);

    return Response.json({ orderId: order.id, order: updatedOrder });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
