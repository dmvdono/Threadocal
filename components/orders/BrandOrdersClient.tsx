"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDemoOrders, ORDERS_UPDATED_EVENT, updateDemoOrderStatus } from "@/services/orders";
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
  { label: "Shipping complete", status: "completed" },
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

  useEffect(() => {
    function syncOrders() {
      setOrders(getDemoOrders());
    }

    queueMicrotask(syncOrders);
    window.addEventListener(ORDERS_UPDATED_EVENT, syncOrders);
    window.addEventListener("storage", syncOrders);

    return () => {
      window.removeEventListener(ORDERS_UPDATED_EVENT, syncOrders);
      window.removeEventListener("storage", syncOrders);
    };
  }, []);

  function handleStatusUpdate(orderId: string, status: OrderStatus) {
    updateDemoOrderStatus(orderId, status);
    setOrders(getDemoOrders());
  }

  if (orders.length === 0) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>No demo orders yet</h2>
          <p>Create a local demo order from the shop, then return here to manage fulfillment as the brand.</p>
          <Link className="primary-link" href={routes.shop}>
            Shop Demo Products
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="brand-orders">
      {orders.map((order) => {
        const pickupOrder = hasPickupLine(order);
        const shippingOrder = hasShippingLine(order);

        return (
        <article className="brand-order-card" key={order.id}>
          <div>
            <p className="eyebrow">{getStatusLabel(order)}</p>
            <h2>{pickupOrder ? "Pickup order" : "Shipping order"} {order.id}</h2>
            <p>Total {formatCents(order.totalCents)}</p>
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
