"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDemoOrders, ORDERS_UPDATED_EVENT, updateDemoOrderStatus } from "@/services/orders";
import type { Order, OrderStatus } from "@/types/order";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

const brandStatuses: { label: string; status: OrderStatus }[] = [
  { label: "Order placed", status: "order_placed" },
  { label: "Brand preparing order", status: "brand_preparing" },
  { label: "Ready for pickup", status: "ready_for_pickup" },
];

function getStatusLabel(status: OrderStatus) {
  return brandStatuses.find((item) => item.status === status)?.label ?? status.replaceAll("_", " ");
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
      {orders.map((order) => (
        <article className="brand-order-card" key={order.id}>
          <div>
            <p className="eyebrow">{getStatusLabel(order.status)}</p>
            <h2>{order.id}</h2>
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
                  {line.fulfillmentMethod === "local_pickup" ? " · Local pickup" : " · Shipping"}
                </span>
              </p>
            ))}
          </div>

          <div className="brand-status-actions">
            {brandStatuses.map((item) => (
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
              View customer tracking
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
