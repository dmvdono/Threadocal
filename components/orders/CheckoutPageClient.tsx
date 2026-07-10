"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { demoPickupLocation } from "@/lib/demo/marketplace";
import { getBrandProducts } from "@/services/brand-portal";
import { getCartItems } from "@/services/cart";
import { createDemoOrder } from "@/services/orders";
import type { CartItem } from "@/types/product";
import type { ShippingAddress } from "@/types/order";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

export function CheckoutPageClient() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState(() => getBrandProducts());
  const [message, setMessage] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    queueMicrotask(() => {
      setItems(getCartItems());
      setProducts(getBrandProducts());
    });
  }, []);

  const checkoutLines = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((demoProduct) => demoProduct.id === item.productId);
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

  function handlePlaceOrder() {
    if (hasShipping && (!shippingAddress.fullName.trim() || !shippingAddress.line1.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim() || !shippingAddress.zipCode.trim())) {
      setMessage("Enter a shipping address before placing a shipping order.");
      return;
    }

    const order = createDemoOrder(hasShipping ? shippingAddress : null);

    if (!order) {
      setMessage("Your cart is empty. Add a demo product before placing an order.");
      return;
    }

    router.push(`${routes.orders}/${order.id}`);
  }

  if (checkoutLines.length === 0) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>No checkout items</h2>
          <p>Add demo products to your cart before checkout.</p>
          <Link className="primary-link" href={routes.shop}>
            Shop Demo Products
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
              <p>{demoPickupLocation}</p>
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
          <p>Demo checkout simulates Threadocal holding payment until pickup or shipping fulfillment is complete, or a dispute is resolved.</p>
        </div>
        {message && (
          <p className="auth-message error" role="alert">
            {message}
          </p>
        )}
        <button className="primary-link" onClick={handlePlaceOrder} type="button">
          Place Demo Order
        </button>
      </aside>
    </section>
  );
}
