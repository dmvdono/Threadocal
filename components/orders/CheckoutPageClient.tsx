"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { demoPickupLocation } from "@/lib/demo/marketplace";
import { getBrandProducts } from "@/services/brand-portal";
import { getCartItems } from "@/services/cart";
import { createDemoOrder } from "@/services/orders";
import type { CartItem } from "@/types/product";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

export function CheckoutPageClient() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState(() => getBrandProducts());
  const [message, setMessage] = useState<string | null>(null);

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

  function handlePlaceOrder() {
    const order = createDemoOrder();

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
                  {entry.item.fulfillmentMethod === "local_pickup" ? "Local pickup" : "Shipping"}
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
        <h2>Pickup & Payment</h2>
        <div className="pickup-box">
          <h3>Pickup location</h3>
          <p>{demoPickupLocation}</p>
        </div>
        <div className="pickup-box">
          <h3>Pickup time</h3>
          <p>{pickupSlot ?? "Shipping selected for all items."}</p>
        </div>
        <div className="payment-hold">
          <h3>Payment held by Threadocal</h3>
          <p>Demo checkout simulates Threadocal holding payment until pickup is confirmed or a dispute is resolved.</p>
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
