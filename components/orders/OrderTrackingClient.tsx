"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { addDemoOrderDispute, getDemoOrder, ORDERS_UPDATED_EVENT, updateDemoOrderStatus } from "@/services/orders";
import type { Order, OrderStatus } from "@/types/order";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

const trackingSteps: { label: string; status: OrderStatus }[] = [
  { label: "Order placed", status: "order_placed" },
  { label: "Brand preparing order", status: "brand_preparing" },
  { label: "Ready for pickup", status: "ready_for_pickup" },
  { label: "Picked up", status: "picked_up" },
  { label: "Completed", status: "completed" },
];

type OrderTrackingClientProps = {
  orderId: string;
};

export function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function syncOrder() {
      setOrder(getDemoOrder(orderId));
    }

    queueMicrotask(syncOrder);
    window.addEventListener(ORDERS_UPDATED_EVENT, syncOrder);
    window.addEventListener("storage", syncOrder);

    return () => {
      window.removeEventListener(ORDERS_UPDATED_EVENT, syncOrder);
      window.removeEventListener("storage", syncOrder);
    };
  }, [orderId]);

  function handleEverythingFine() {
    setOrder(updateDemoOrderStatus(orderId, "completed"));
    setMessage("Thanks. Payment would be released to the brand in the real flow.");
  }

  function handleConfirmPickup() {
    setOrder(updateDemoOrderStatus(orderId, "picked_up"));
    setMessage("Pickup confirmed. If everything looks good, mark the order complete.");
  }

  function handleIssueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason.trim()) {
      setMessage("Select or enter a reason before submitting a dispute.");
      return;
    }

    setOrder(addDemoOrderDispute(orderId, { reason, notes }));
    setMessage("Threadocal will investigate this demo dispute and hold payment while it is reviewed.");
  }

  if (!order) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>Order not found</h2>
          <p>This demo order only exists in the browser where it was created.</p>
          <Link className="primary-link" href={routes.shop}>
            Shop Demo Products
          </Link>
        </article>
      </section>
    );
  }

  const activeStepIndex = Math.max(
    trackingSteps.findIndex((step) => step.status === order.status),
    0,
  );

  return (
    <section className="checkout-layout">
      <div className="cart-summary checkout-summary">
        <h2>Order {order.id}</h2>
        {order.lines?.map((line) => (
          <article className="checkout-line" key={line.id}>
            <div>
              <strong>{line.productName}</strong>
              <span>
                Qty {line.quantity}
                {line.selectedSize ? ` · Size ${line.selectedSize}` : ""}
              </span>
              <span>
                {line.fulfillmentMethod === "local_pickup" ? "Local pickup" : "Shipping"}
                {line.pickupSlot ? ` · ${line.pickupSlot}` : ""}
              </span>
            </div>
            <strong>{formatCents(line.lineTotalCents)}</strong>
          </article>
        ))}
        <p>
          <span>Total</span>
          <strong>{formatCents(order.totalCents)}</strong>
        </p>
        <div className="tracking-list">
          {trackingSteps.map((step, index) => (
            <div className={index <= activeStepIndex ? "active" : ""} key={step.status}>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      <aside className="cart-summary">
        <h2>Confirmation</h2>
        <div className="pickup-box">
          <h3>Pickup location</h3>
          <p>{order.pickupLocation}</p>
        </div>
        <div className="pickup-box">
          <h3>Pickup time</h3>
          <p>{order.pickupSlot ?? "Shipping selected."}</p>
        </div>
        {order.status === "ready_for_pickup" && (
          <button className="primary-link" onClick={handleConfirmPickup} type="button">
            Confirm pickup
          </button>
        )}
        {order.status === "picked_up" && (
          <button className="primary-link" onClick={handleEverythingFine} type="button">
            Everything went fine
          </button>
        )}
        {order.status !== "ready_for_pickup" && order.status !== "picked_up" && order.status !== "completed" && (
          <p className="option-note">The brand will update preparation and pickup readiness from the brand orders page.</p>
        )}
        <form className="dispute-form" onSubmit={handleIssueSubmit}>
          <h3>Something went wrong</h3>
          <label>
            Reason
            <input
              onChange={(event) => setReason(event.target.value)}
              placeholder="Missing item, wrong size..."
              value={reason}
            />
          </label>
          <label>
            Notes
            <textarea
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Tell Threadocal what happened."
              value={notes}
            />
          </label>
          <button className="secondary-action" type="submit">
            Submit Dispute
          </button>
        </form>
        {message && (
          <p className={`auth-message ${order.status === "disputed" ? "error" : "success"}`} role="status">
            {message}
          </p>
        )}
      </aside>
    </section>
  );
}
