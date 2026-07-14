"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCartItems } from "@/services/cart";
import { getMarketplaceProductsByIds } from "@/services/products";
import { createBrowserSupabaseClient } from "@/supabase/client";
import type { CartItem } from "@/types/product";
import type { ShippingAddress } from "@/types/order";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

export function CheckoutPageClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getMarketplaceProductsByIds>>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    async function syncCheckout() {
      const cartItems = getCartItems();
      setItems(cartItems);

      try {
        setProducts(await getMarketplaceProductsByIds(cartItems.map((item) => item.productId)));
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Threadocal could not load checkout products.");
      }
    }

    void syncCheckout();
  }, []);

  const checkoutLines = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((marketplaceProduct) => marketplaceProduct.id === item.productId);
          return product ? { item, product } : null;
        })
        .filter(Boolean),
    [items, products],
  );

  const subtotalCents = checkoutLines.reduce((total, entry) => {
    if (!entry) {
      return total;
    }

    return total + (entry.product.salePriceCents ?? entry.product.priceCents) * entry.item.quantity;
  }, 0);
  const pickupSlot = checkoutLines.find((entry) => entry?.item.fulfillmentMethod === "local_pickup")?.item.pickupSlot;
  const hasPickup = checkoutLines.some((entry) => entry?.item.fulfillmentMethod === "local_pickup");
  const hasShipping = checkoutLines.some((entry) => entry?.item.fulfillmentMethod === "shipping");

  async function handlePlaceOrder() {
    if (hasShipping && (!shippingAddress.fullName.trim() || !shippingAddress.line1.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim() || !shippingAddress.zipCode.trim())) {
      setMessage("Enter a shipping address before placing a shipping order.");
      return;
    }

    if (hasShipping && hasPickup) {
      setMessage("Place shipping and pickup items as separate orders.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw new Error(error.message);
      }

      if (!session?.access_token) {
        throw new Error("Log in as a customer before checkout.");
      }

      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items,
          shippingAddress: hasShipping ? shippingAddress : null,
        }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "Threadocal could not start Stripe checkout.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Threadocal could not start checkout.");
      setSubmitting(false);
    }
  }

  if (checkoutLines.length === 0) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>No checkout items</h2>
          <p>Add marketplace products to your cart before checkout.</p>
          <Link className="primary-link" href={routes.shop}>
            Shop Products
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="checkout-layout">
      <div className="cart-summary checkout-summary">
        <h2>Order Summary</h2>
        {checkoutLines.map((entry) => {
          if (!entry) {
            return null;
          }

          const unitPriceCents = entry.product.salePriceCents ?? entry.product.priceCents;

          return (
            <article className="checkout-line" key={entry.item.id}>
              <div>
                <strong>{entry.product.name}</strong>
                <span>
                  Qty {entry.item.quantity}
                  {entry.item.selectedSize ? ` · Size ${entry.item.selectedSize}` : ""}
                  {entry.item.selectedColor ? ` · Color ${entry.item.selectedColor}` : ""}
                </span>
                <span>
                  {entry.item.fulfillmentMethod === "local_pickup" ? "Pickup order" : "Shipping order"}
                  {entry.item.pickupSlot ? ` · ${entry.item.pickupSlot}` : ""}
                </span>
              </div>
              <strong>{formatCents(unitPriceCents * entry.item.quantity)}</strong>
            </article>
          );
        })}
        <p>
          <span>Subtotal</span>
          <strong>{formatCents(subtotalCents)}</strong>
        </p>
      </div>

      <aside className="cart-summary">
        <h2>Fulfillment & Payment</h2>
        {hasPickup && (
          <>
            <div className="pickup-box">
              <h3>Pickup location</h3>
              <p>The brand pickup location will appear on your order after checkout.</p>
            </div>
            <div className="pickup-box">
              <h3>Pickup time</h3>
              <p>{pickupSlot ?? "Select pickup time on the product page."}</p>
            </div>
          </>
        )}
        {hasShipping && (
          <div className="pickup-box">
            <h3>Shipping address</h3>
            <div className="inline-form shipping-form">
              <input placeholder="Full name" value={shippingAddress.fullName} onChange={(event) => setShippingAddress({ ...shippingAddress, fullName: event.target.value })} />
              <input placeholder="Address line 1" value={shippingAddress.line1} onChange={(event) => setShippingAddress({ ...shippingAddress, line1: event.target.value })} />
              <input placeholder="Apt, suite" value={shippingAddress.line2 ?? ""} onChange={(event) => setShippingAddress({ ...shippingAddress, line2: event.target.value })} />
              <input placeholder="City" value={shippingAddress.city} onChange={(event) => setShippingAddress({ ...shippingAddress, city: event.target.value })} />
              <input placeholder="State" value={shippingAddress.state} onChange={(event) => setShippingAddress({ ...shippingAddress, state: event.target.value.toUpperCase() })} />
              <input placeholder="ZIP" value={shippingAddress.zipCode} onChange={(event) => setShippingAddress({ ...shippingAddress, zipCode: event.target.value })} />
            </div>
          </div>
        )}
        <div className="payment-hold">
          <h3>Payment held by Threadocal</h3>
          <p>Stripe test-mode checkout authorizes the order while Threadocal tracks pickup or shipping fulfillment.</p>
        </div>
        {message && (
          <p className="auth-message error" role="alert">
            {message}
          </p>
        )}
        <button className="primary-link" disabled={submitting} onClick={handlePlaceOrder} type="button">
          {submitting ? "Opening Stripe..." : "Pay with Stripe"}
        </button>
      </aside>
    </section>
  );
}
