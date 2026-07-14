"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrandOrders, ORDERS_UPDATED_EVENT, updateOrderStatus } from "@/services/orders";
import type { Order, OrderStatus } from "@/types/order";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

const pickupStatuses: { label: string; status: OrderStatus }[] = [
  { label: "Pickup order placed", status: "order_placed" },
  { label: "Preparing pickup", status: "brand_preparing" },
  { label: "Ready for pickup", status: "ready_for_pickup" },
];

const shippingStatuses: { label: string; status: OrderStatus }[] = [
  { label: "Shipping order placed", status: "order_placed" },
  { label: "Preparing shipment", status: "brand_preparing" },
  { label: "Shipped", status: "shipped" },
  { label: "Delivered", status: "delivered" },
];

function hasPickupLine(order: Order) {
  return order.lines?.some((line) => line.fulfillmentMethod === "local_pickup") ?? false;
}

function hasShippingLine(order: Order) {
  return order.lines?.some((line) => line.fulfillmentMethod === "shipping") ?? false;
}

function getStatusActions(order: Order) {
  return hasPickupLine(order) ? pickupStatuses : shippingStatuses;
}

function getStatusLabel(order: Order) {
  return getStatusActions(order).find((item) => item.status === order.status)?.label ?? order.status.replaceAll("_", " ");
}

export function BrandOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function syncOrders() {
      try {
        setOrders(await getBrandOrders());
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Threadocal could not load brand orders.");
      }
    }

    void syncOrders();
    window.addEventListener(ORDERS_UPDATED_EVENT, syncOrders);

    return () => {
      window.removeEventListener(ORDERS_UPDATED_EVENT, syncOrders);
    };
  }, []);

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    try {
      await updateOrderStatus(orderId, status, trackingNumbers[orderId] ?? null);
      setOrders(await getBrandOrders());
      setMessage("Order updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Threadocal could not update this order.");
    }
  }

  if (orders.length === 0) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>No orders yet</h2>
          <p>Paid Supabase orders for your brand will appear here.</p>
          <Link className="primary-link" href={routes.shop}>
            Shop Products
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="brand-orders">
      {message && (
        <p className="auth-message" role="status">
          {message}
        </p>
      )}
      {orders.map((order) => {
        const pickupOrder = hasPickupLine(order);
        const shippingOrder = hasShippingLine(order);

        return (
        <article className="brand-order-card" key={order.id}>
          <div>
            <p className="eyebrow">{getStatusLabel(order)}</p>
            <h2>{pickupOrder ? "Pickup order" : "Shipping order"} {order.id}</h2>
            <p>Total {formatCents(order.totalCents)}</p>
            <p>Payment {order.paymentStatus ?? "pending"}</p>
            {order.dispute && (
              <p className="auth-message error" role="status">
                Dispute: {order.dispute.reason}
              </p>
            )}
          </div>

          <div className="brand-order-lines">
            {order.lines?.map((line) => (
              <p key={line.id}>
                <strong>{line.productName}</strong>
                <span>
                  Qty {line.quantity}
                  {line.selectedSize ? ` · Size ${line.selectedSize}` : ""}
                  {line.selectedColor ? ` · Color ${line.selectedColor}` : ""}
                  {line.fulfillmentMethod === "local_pickup" ? " · Pickup order" : " · Shipping order"}
                </span>
              </p>
            ))}
            {pickupOrder && (
              <p>
                <strong>Pickup</strong>
                <span>{order.pickupSlot ?? "Pickup time not selected"}</span>
              </p>
            )}
            {shippingOrder && (
              <p>
                <strong>Shipping</strong>
                <span>
                  {order.shippingAddress
                    ? `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`
                    : "No shipping address saved"}
                </span>
              </p>
            )}
            {shippingOrder && (
              <label className="inline-field">
                Tracking number
                <input
                  onChange={(event) => setTrackingNumbers({ ...trackingNumbers, [order.id]: event.target.value })}
                  placeholder="Add tracking when shipped"
                  value={trackingNumbers[order.id] ?? order.trackingNumber ?? ""}
                />
              </label>
            )}
          </div>

          <div className="brand-status-actions">
            {getStatusActions(order).map((item) => (
              <button
                className={order.status === item.status ? "active" : ""}
                disabled={order.status === "completed" || order.status === "picked_up" || order.status === "disputed"}
                key={item.status}
                onClick={() => handleStatusUpdate(order.id, item.status)}
                type="button"
              >
                {item.label}
              </button>
            ))}
            <Link className="secondary-link" href={`${routes.orders}/${order.id}`}>
              View customer order
            </Link>
          </div>
        </article>
        );
      })}
    </section>
  );
}
