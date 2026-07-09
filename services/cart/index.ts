"use client";

import type { CartItem } from "@/types/product";
import type { FulfillmentMethod } from "@/types/product";

export const CART_STORAGE_KEY = "threadocal-demo-cart";
export const CART_UPDATED_EVENT = "threadocal-cart-updated";

function isStoredCartItem(value: unknown): value is Record<string, unknown> & {
  productId: string;
  quantity: number;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).productId === "string" &&
    typeof (value as Record<string, unknown>).quantity === "number"
  );
}

function readCartItemsFromStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter(isStoredCartItem).map((item) => {
      const selectedSize = typeof item.selectedSize === "string" ? item.selectedSize : null;
      const fulfillmentMethod: FulfillmentMethod =
        item.fulfillmentMethod === "local_pickup" ? "local_pickup" : "shipping";
      const pickupSlot = typeof item.pickupSlot === "string" ? item.pickupSlot : null;

      return {
        id:
          typeof item.id === "string"
            ? item.id
            : createCartItemId(item.productId, selectedSize, fulfillmentMethod, pickupSlot),
        productId: item.productId,
        selectedSize,
        fulfillmentMethod,
        pickupSlot,
        quantity: item.quantity,
      };
    });
  } catch {
    return [];
  }
}

function createCartItemId(
  productId: string,
  selectedSize: string | null,
  fulfillmentMethod: FulfillmentMethod,
  pickupSlot: string | null,
) {
  return [productId, selectedSize ?? "no-size", fulfillmentMethod, pickupSlot ?? "no-slot"].join(":");
}

function writeCartItemsToStorage(items: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function getCartItems() {
  return readCartItemsFromStorage();
}

export function getCartItemCount() {
  return getCartItems().reduce((total, item) => total + item.quantity, 0);
}

export function addProductToCart(
  productId: string,
  quantity = 1,
  selectedSize: string | null = null,
  fulfillmentMethod: FulfillmentMethod = "shipping",
  pickupSlot: string | null = null,
) {
  const currentItems = readCartItemsFromStorage();
  const cartItemId = createCartItemId(productId, selectedSize, fulfillmentMethod, pickupSlot);
  const existingItem = currentItems.find((item) => item.id === cartItemId);

  if (existingItem) {
    existingItem.quantity += quantity;
    writeCartItemsToStorage(currentItems);
    return currentItems;
  }

  const nextItems = [
    ...currentItems,
    { id: cartItemId, productId, selectedSize, fulfillmentMethod, pickupSlot, quantity },
  ];
  writeCartItemsToStorage(nextItems);
  return nextItems;
}

export function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const nextItems = readCartItemsFromStorage()
    .map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);

  writeCartItemsToStorage(nextItems);
  return nextItems;
}

export function removeCartItem(cartItemId: string) {
  const nextItems = readCartItemsFromStorage().filter((item) => item.id !== cartItemId);

  writeCartItemsToStorage(nextItems);
  return nextItems;
}

export function clearCart() {
  writeCartItemsToStorage([]);
}
