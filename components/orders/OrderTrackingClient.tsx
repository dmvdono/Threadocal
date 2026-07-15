"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { addOrderDispute, getOrder, ORDERS_UPDATED_EVENT, updateOrderStatus } from "@/services/orders";
import type { Order, OrderStatus } from "@/types/order";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

const shippingSteps: { label: string; status: OrderStatus }[] = [
  { label: "Shipping order placed", status: "order_placed" },
  { label: "Brand preparing shipment", status: "brand_preparing" },
  { label: "Shipped", status: "shipped" },
  { label: "Delivered", status: "delivered" },
  { label: "Completed", status: "completed" },
];

const pickupSteps: { label: string; status: OrderStatus }[] = [
  { label: "Pickup order placed", status: "order_placed" },
  { label: "Brand preparing pickup", status: "brand_preparing" },
  { label: "Ready for pickup", status: "ready_for_pickup" },
  { label: "Picked up", status: "picked_up" },
  { label: "Completed", status: "completed" },
];

type OrderTrackingClientProps = {
  orderId: string;
  confirmed?: boolean;
};

export function OrderTrackingClient({ orderId, confirmed = false }: OrderTrackingClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function syncOrder() {
      try {
        setOrder(await getOrder(orderId));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Threadocal could not load this order.");
      } finally {
        setLoading(false);
      }
    }

    void syncOrder();
    window.addEventListener(ORDERS_UPDATED_EVENT, syncOrder);

    return () => {
      window.removeEventListener(ORDERS_UPDATED_EVENT, syncOrder);
    };
  }, [orderId]);

  async function handleStatus(status: OrderStatus, successMessage: string) {
    try {
      setOrder(await updateOrderStatus(orderId, status));
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Threadocal could not update this order.");
    }
  }

  function handleConfirmPickup() {
    void handleStatus("picked_up", "Pickup confirmed. If everything looks good, mark the order complete.");
  }

  function handleEverythingFine() {
    void handleStatus("completed", "Thanks. This order is marked complete.");
  }

  async function handleIssueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason.trim()) {
      setMessage("Select or enter a reason before submitting a dispute.");
      return;
    }

    try {
      setOrder(await addOrderDispute(orderId, { reason, notes }));
      setMessage("Threadocal will investigate this dispute and hold payment while it is reviewed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Threadocal could not submit this dispute.");
    }
  }

  if (loading) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>Loading order</h2>
          <p>Threadocal is loading your Supabase order details.</p>
        </article>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>Order not found</h2>
          <p>Threadocal could not find that order for this account.</p>
          <Link className="primary-link" href={routes.shop}>
            Shop Products
          </Link>
        </article>
      </section>
    );
  }

  const activeStepIndex = Math.max(
    (order.fulfillmentMethod === "local_pickup" ? pickupSteps : shippingSteps).findIndex((step) => step.status === order.status),
    0,
  );
  const hasPickup = order.fulfillmentMethod === "local_pickup";
  const steps = hasPickup ? pickupSteps : shippingSteps;

  return (
    <section className="checkout-layout">
      <div className="cart-summary checkout-summary">
        <h2>{hasPickup ? "Pickup order" : "Shipping order"} {order.id}</h2>
        <p className="option-note">Payment status: {order.paymentStatus ?? "pending"}</p>
        {order.lines?.map((line) => (
          <article className="checkout-line" key={line.id}>
            <div>
              <strong>{line.productName}</strong>
              <span>
                Qty {line.quantity}
                {line.selectedSize ? ` · Size ${line.selectedSize}` : ""}
                {line.selectedColor ? ` · Color ${line.selectedColor}` : ""}
              </span>
              <span>
                {line.fulfillmentMethod === "local_pickup" ? "Pickup order" : "Shipping order"}
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
          {steps.map((step, index) => (
            <div className={index <= activeStepIndex ? "active" : ""} key={step.status}>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      <aside className="cart-summary">
        {confirmed && (
          <p className="auth-message success" role="status">
            Payment confirmed. Your order has been created in Threadocal.
          </p>
        )}
        <h2>{hasPickup ? "Pickup confirmation" : "Shipping details"}</h2>
        {hasPickup ? (
          <>
            <div className="pickup-box">
              <h3>Pickup location</h3>
              <p>{order.pickupLocation}</p>
            </div>
            <div className="pickup-box">
              <h3>Pickup time</h3>
              <p>{order.pickupSlot}</p>
            </div>
          </>
        ) : (
          <div className="pickup-box">
            <h3>Shipping address</h3>
            {order.shippingAddress ? (
              <p>
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
            ) : (
              <p>No shipping address was saved for this order.</p>
            )}
            {order.trackingNumber ? <p>Tracking number: {order.trackingNumber}</p> : <p>Tracking appears only after the brand adds a tracking number.</p>}
          </div>
        )}
        {order.status === "ready_for_pickup" && (
          <button className="primary-link" onClick={handleConfirmPickup} type="button">
            Confirm pickup
          </button>
        )}
        {(order.status === "picked_up" || order.status === "delivered") && (
          <button className="primary-link" onClick={handleEverythingFine} type="button">
            Everything went fine
          </button>
        )}
        {order.status !== "ready_for_pickup" && order.status !== "picked_up" && order.status !== "completed" && (
          <p className="option-note">
            {hasPickup
              ? "The brand will update preparation and pickup readiness from the brand orders page."
              : "The brand will update shipping status. Tracking appears only after a tracking number is added."}
          </p>
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
