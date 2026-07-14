import { requireApiAuth, apiErrorResponse } from "@/app/api/_utils/auth";
import { stripeRequest, type StripeCheckoutSession } from "@/services/payments";
import type { FulfillmentMethod } from "@/types/product";
import type { ShippingAddress } from "@/types/order";

type CheckoutLineInput = {
  productId: string;
  quantity: number;
  selectedSize: string | null;
  selectedColor: string | null;
  fulfillmentMethod: FulfillmentMethod;
  pickupSlot: string | null;
};

type CheckoutSessionRequest = {
  items?: CheckoutLineInput[];
  shippingAddress?: ShippingAddress | null;
};

function isFulfillmentMethod(value: unknown): value is FulfillmentMethod {
  return value === "shipping" || value === "local_pickup";
}

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin;
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function normalizeItems(items: CheckoutSessionRequest["items"]) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item) => {
    const quantity = Math.max(1, Math.min(20, Math.round(Number(item.quantity || 1))));

    if (!item.productId || !isFulfillmentMethod(item.fulfillmentMethod)) {
      return [];
    }

    return [
      {
        productId: item.productId,
        quantity,
        selectedSize: item.selectedSize?.trim() || null,
        selectedColor: item.selectedColor?.trim() || null,
        fulfillmentMethod: item.fulfillmentMethod,
        pickupSlot: item.pickupSlot?.trim() || null,
      },
    ];
  });
}

function validateShippingAddress(address: ShippingAddress | null | undefined) {
  if (!address) {
    throw new Error("Enter a shipping address before placing a shipping order.");
  }

  const fullName = address.fullName.trim();
  const line1 = address.line1.trim();
  const city = address.city.trim();
  const state = address.state.trim().toUpperCase();
  const zipCode = address.zipCode.trim();

  if (!fullName || !line1 || !city || !state || !zipCode) {
    throw new Error("Enter a complete shipping address before placing a shipping order.");
  }

  return {
    fullName,
    line1,
    line2: address.line2?.trim() || "",
    city,
    state,
    zipCode,
  };
}

export async function POST(request: Request) {
  try {
    const { admin, profile } = await requireApiAuth(request);
    const body = (await request.json()) as CheckoutSessionRequest;
    const items = normalizeItems(body.items);

    if (items.length === 0) {
      return Response.json({ error: "Your cart is empty." }, { status: 400 });
    }

    if (profile.role !== "customer" && profile.role !== "admin") {
      return Response.json({ error: "Use a customer account to place orders." }, { status: 403 });
    }

    const hasShipping = items.some((item) => item.fulfillmentMethod === "shipping");
    const hasPickup = items.some((item) => item.fulfillmentMethod === "local_pickup");

    if (hasShipping && hasPickup) {
      return Response.json({ error: "Place shipping and pickup items as separate orders." }, { status: 400 });
    }

    const fulfillmentMethod = items[0].fulfillmentMethod;
    const shippingAddress = fulfillmentMethod === "shipping" ? validateShippingAddress(body.shippingAddress) : null;
    const productIds = Array.from(new Set(items.map((item) => item.productId)));
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("status", "published");

    if (productsError) {
      throw new Error(productsError.message);
    }

    if (!products || products.length !== productIds.length) {
      return Response.json({ error: "One or more products in your cart are no longer available." }, { status: 400 });
    }

    const brandIds = Array.from(new Set(products.map((product) => product.brand_id)));

    if (brandIds.length !== 1) {
      return Response.json({ error: "Checkout currently supports one brand per order." }, { status: 400 });
    }

    const brandId = brandIds[0];
    const { data: brand, error: brandError } = await admin
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .maybeSingle();

    if (brandError) {
      throw new Error(brandError.message);
    }

    if (!brand || brand.approval_status !== "approved") {
      return Response.json({ error: "This brand is not accepting marketplace orders yet." }, { status: 400 });
    }

    const { data: variants, error: variantsError } = await admin
      .from("product_variants")
      .select("*")
      .in("product_id", productIds);

    if (variantsError) {
      throw new Error(variantsError.message);
    }

    const variantIds = (variants ?? []).map((variant) => variant.id);
    const { data: inventoryRows, error: inventoryError } =
      variantIds.length > 0
        ? await admin.from("product_inventory").select("*").in("product_variant_id", variantIds)
        : { data: [], error: null };

    if (inventoryError) {
      throw new Error(inventoryError.message);
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const inventoryByVariantId = new Map((inventoryRows ?? []).map((inventory) => [inventory.product_variant_id, inventory]));
    const orderItems = items.map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        throw new Error("A product in your cart is no longer available.");
      }

      const variant = (variants ?? []).find(
        (candidate) =>
          candidate.product_id === item.productId &&
          candidate.size === (item.selectedSize ?? "OS") &&
          candidate.color === (item.selectedColor ?? "Default"),
      );
      const stockQuantity = variant ? inventoryByVariantId.get(variant.id)?.stock_quantity ?? 0 : 999999;

      if (stockQuantity < item.quantity) {
        throw new Error(`${product.name} does not have enough stock for that quantity.`);
      }

      const unitPriceCents = product.sale_price_cents ?? product.price_cents;

      return {
        item,
        product,
        variant,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
      };
    });
    const subtotalCents = orderItems.reduce((total, item) => total + item.lineTotalCents, 0);
    const totalCents = subtotalCents;
    const pickupLocation = fulfillmentMethod === "local_pickup"
      ? [brand.location, brand.city, brand.state, brand.zip_code].filter(Boolean).join(", ") || "Brand pickup location"
      : null;
    const now = new Date().toISOString();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_profile_id: profile.id,
        brand_id: brandId,
        fulfillment_method: fulfillmentMethod,
        status: "order_placed",
        payment_status: "pending",
        subtotal_cents: subtotalCents,
        total_cents: totalCents,
        pickup_location: pickupLocation,
        pickup_slot: fulfillmentMethod === "local_pickup" ? items[0].pickupSlot : null,
        shipping_full_name: shippingAddress?.fullName ?? null,
        shipping_line1: shippingAddress?.line1 ?? null,
        shipping_line2: shippingAddress?.line2 ?? null,
        shipping_city: shippingAddress?.city ?? null,
        shipping_state: shippingAddress?.state ?? null,
        shipping_zip_code: shippingAddress?.zipCode ?? null,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .maybeSingle();

    if (orderError) {
      throw new Error(orderError.message);
    }

    if (!order) {
      throw new Error("Threadocal could not create your order.");
    }

    const { error: itemError } = await admin.from("order_items").insert(
      orderItems.map((entry) => ({
        order_id: order.id,
        product_id: entry.product.id,
        product_variant_id: entry.variant?.id ?? null,
        product_name: entry.product.name,
        brand_name: brand.name,
        selected_size: entry.item.selectedSize,
        selected_color: entry.item.selectedColor,
        sku: entry.variant?.sku ?? null,
        quantity: entry.item.quantity,
        unit_price_cents: entry.unitPriceCents,
        line_total_cents: entry.lineTotalCents,
      })),
    );

    if (itemError) {
      throw new Error(itemError.message);
    }

    const baseUrl = getBaseUrl(request);
    const sessionBody = new URLSearchParams();
    sessionBody.set("mode", "payment");
    sessionBody.set("success_url", `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    sessionBody.set("cancel_url", `${baseUrl}/checkout?cancelled=1`);
    sessionBody.set("client_reference_id", order.id);
    sessionBody.set("metadata[order_id]", order.id);
    sessionBody.set("metadata[customer_profile_id]", profile.id);
    orderItems.forEach((entry, index) => {
      sessionBody.set(`line_items[${index}][quantity]`, String(entry.item.quantity));
      sessionBody.set(`line_items[${index}][price_data][currency]`, "usd");
      sessionBody.set(`line_items[${index}][price_data][unit_amount]`, String(entry.unitPriceCents));
      sessionBody.set(`line_items[${index}][price_data][product_data][name]`, entry.product.name);
      sessionBody.set(`line_items[${index}][price_data][product_data][metadata][product_id]`, entry.product.id);
    });

    const session = await stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
      method: "POST",
      body: sessionBody,
    });

    const { error: sessionError } = await admin
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    return Response.json({ checkoutUrl: session.url, orderId: order.id });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
