"use client";

import { useState } from "react";
import { addProductToCart } from "@/services/cart";
import type { FulfillmentMethod } from "@/types/product";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  requiresSize?: boolean;
  requiresColor?: boolean;
  selectedSize?: string | null;
  selectedColor?: string | null;
  fulfillmentMethod?: FulfillmentMethod;
  pickupSlot?: string | null;
};

export function AddToCartButton({
  productId,
  quantity = 1,
  requiresSize = false,
  requiresColor = false,
  selectedSize = null,
  selectedColor = null,
  fulfillmentMethod = "shipping",
  pickupSlot = null,
}: AddToCartButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleAddToCart() {
    setError(null);
    setMessage(null);

    if (requiresSize && !selectedSize) {
      setError("Select a size before adding this item to your cart.");
      return;
    }

    if (requiresColor && !selectedColor) {
      setError("Select a color before adding this item to your cart.");
      return;
    }

    if (fulfillmentMethod === "local_pickup" && !pickupSlot) {
      setError("Select a pickup time before adding this item to your cart.");
      return;
    }

    addProductToCart(productId, quantity, selectedSize, selectedColor, fulfillmentMethod, pickupSlot);
    setMessage("Added to cart.");
  }

  return (
    <div className="cart-action">
      <button className="primary-link" onClick={handleAddToCart} type="button">
        Add to Cart
      </button>
      {error && (
        <p className="auth-message error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="auth-message success" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
