"use client";

import { useState } from "react";
import type { FulfillmentMethod } from "@/types/product";
import type { Product } from "@/types/product";
import { AddToCartButton } from "@/components/marketplace/AddToCartButton";

type ProductPurchaseFormProps = {
  product: Product;
};

export function ProductPurchaseForm({ product }: ProductPurchaseFormProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("shipping");
  const [pickupSlot, setPickupSlot] = useState<string | null>(null);
  const hasSizes = Boolean(product.sizes?.length);
  const hasColors = Boolean(product.colors?.length);
  const canPickup = Boolean(product.pickupAvailable);
  const pickupSlots = ["Today 4:00 PM - 6:00 PM", "Tomorrow 12:00 PM - 2:00 PM", "Saturday 10:00 AM - 12:00 PM"];

  function updateFulfillmentMethod(nextMethod: FulfillmentMethod) {
    setFulfillmentMethod(nextMethod);

    if (nextMethod === "shipping") {
      setPickupSlot(null);
      return;
    }

    setPickupSlot(pickupSlots[0] ?? null);
  }

  return (
    <div className="purchase-options">
      {hasSizes && (
        <fieldset className="option-group">
          <legend>Size</legend>
          <div className="size-row">
            {product.sizes?.map((size) => (
              <button
                className={selectedSize === size ? "active" : ""}
                key={size}
                onClick={() => setSelectedSize(size)}
                type="button"
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {hasColors && (
        <fieldset className="option-group">
          <legend>Color</legend>
          <div className="size-row">
            {product.colors?.map((color) => (
              <button
                className={selectedColor === color ? "active" : ""}
                key={color}
                onClick={() => setSelectedColor(color)}
                type="button"
              >
                {color}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="quantity-control">
        <span>Quantity</span>
        <div className="quantity-stepper" aria-label="Product quantity">
          <button
            aria-label="Decrease quantity"
            onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
            type="button"
          >
            -
          </button>
          <span>{quantity}</span>
          <button
            aria-label="Increase quantity"
            onClick={() => setQuantity((currentQuantity) => currentQuantity + 1)}
            type="button"
          >
            +
          </button>
        </div>
      </div>

      <fieldset className="option-group">
        <legend>Fulfillment</legend>
        <div className="fulfillment-row">
          <button
            className={fulfillmentMethod === "shipping" ? "active" : ""}
            onClick={() => updateFulfillmentMethod("shipping")}
            type="button"
          >
            Ship
          </button>
          <button
            className={fulfillmentMethod === "local_pickup" ? "active" : ""}
            disabled={!canPickup}
            onClick={() => updateFulfillmentMethod("local_pickup")}
            type="button"
          >
            Local Pickup
          </button>
        </div>
        {!canPickup && <p className="option-note">Local pickup is not available for this item.</p>}
      </fieldset>

      {fulfillmentMethod === "local_pickup" && (
        <fieldset className="option-group">
          <legend>Pickup time</legend>
          <div className="pickup-slot-grid">
            {pickupSlots.map((slot) => (
              <button
                className={pickupSlot === slot ? "active" : ""}
                key={slot}
                onClick={() => setPickupSlot(slot)}
                type="button"
              >
                {slot}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <AddToCartButton
        fulfillmentMethod={fulfillmentMethod}
        pickupSlot={pickupSlot}
        productId={product.id}
        quantity={quantity}
        requiresSize={hasSizes}
        requiresColor={hasColors}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
      />
    </div>
  );
}
