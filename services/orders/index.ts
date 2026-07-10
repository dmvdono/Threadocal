"use client";

import { demoPickupLocation } from "@/lib/demo/marketplace";
import { getBrandProducts } from "@/services/brand-portal";
import { clearCart, getCartItems } from "@/services/cart";
import type { DemoDispute, DemoOrderLine, Order, OrderStatus, ShippingAddress } from "@/types/order";

const ORDERS_STORAGE_KEY = "threadocal-demo-orders";
export const ORDERS_UPDATED_EVENT = "threadocal-demo-orders-updated";

function readOrdersFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];

    return Array.isArray(parsedOrders) ? (parsedOrders as Order[]) : [];
  } catch {
    return [];
  }
}

function writeOrdersToStorage(orders: Order[]) {
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT));
}

export function getDemoOrders() {
  return readOrdersFromStorage();
}

export function getDemoOrder(orderId: string) {
  return readOrdersFromStorage().find((order) => order.id === orderId) ?? null;
}

export function createDemoOrder(shippingAddress?: ShippingAddress | null) {
  const cartItems = getCartItems();
  const products = getBrandProducts();
  const lines = cartItems
    .map((item): DemoOrderLine | null => {
      const product = products.find((demoProduct) => demoProduct.id === item.productId);

      if (!product) {
        return null;
      }

      const unitPriceCents = product.salePriceCents ?? product.priceCents;

      return {
        id: item.id,
        productId: item.productId,
        productName: product.name,
        brandName: product.brandName ?? "Threadocal brand",
        selectedSize: item.selectedSize,
        fulfillmentMethod: item.fulfillmentMethod,
        pickupSlot: item.pickupSlot,
        quantity: item.quantity,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
      };
    })
    .filter((line): line is DemoOrderLine => Boolean(line));

  if (lines.length === 0) {
    return null;
  }

  const subtotalCents = lines.reduce((total, line) => total + line.lineTotalCents, 0);
  const pickupSlot = lines.find((line) => line.fulfillmentMethod === "local_pickup")?.pickupSlot ?? null;
  const hasShipping = lines.some((line) => line.fulfillmentMethod === "shipping");
  const now = new Date().toISOString();
  const order: Order = {
    id: `demo-${Date.now()}`,
    status: "order_placed",
    lines,
    pickupLocation: demoPickupLocation,
    pickupSlot,
    shippingAddress: hasShipping ? shippingAddress ?? null : null,
    trackingNumber: null,
    subtotalCents,
    totalCents: subtotalCents,
    createdAt: now,
    updatedAt: now,
  };

  writeOrdersToStorage([order, ...readOrdersFromStorage()]);
  clearCart();

  return order;
}

export function updateDemoOrderStatus(orderId: string, status: OrderStatus) {
  const orders = readOrdersFromStorage();
  const nextOrders = orders.map((order) =>
    order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order,
  );

  writeOrdersToStorage(nextOrders);
  return nextOrders.find((order) => order.id === orderId) ?? null;
}

export function addDemoOrderDispute(orderId: string, dispute: Omit<DemoDispute, "createdAt">) {
  const orders = readOrdersFromStorage();
  const nextOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status: "disputed" as const,
          dispute: { ...dispute, createdAt: new Date().toISOString() },
          updatedAt: new Date().toISOString(),
        }
      : order,
  );

  writeOrdersToStorage(nextOrders);
  return nextOrders.find((order) => order.id === orderId) ?? null;
}
