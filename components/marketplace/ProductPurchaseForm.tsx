"use client";

import { useState } from "react";
import { demoPickupSlots } from "@/lib/demo/marketplace";
import type { FulfillmentMethod } from "@/types/product";
import type { Product } from "@/types/product";
import { AddToCartButton } from "@/components/marketplace/AddToCartButton";

type ProductPurchaseFormProps = {
  product: Product;
};

export function ProductPurchaseForm({ product }: ProductPurchaseFormProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("shipping");
  const [pickupSlot, setPickupSlot] = useState<string | null>(null);
  const hasSizes = Boolean(product.sizes?.length);
  const canPickup = Boolean(product.pickupAvailable);

  function updateFulfillmentMethod(nextMethod: FulfillmentMethod) {
    setFulfillmentMethod(nextMethod);

    if (nextMethod === "shipping") {
      setPickupSlot(null);
      return;
    }

    setPickupSlot(demoPickupSlots[0] ?? null);
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
        {!canPickup && <p className="option-note">Local pickup is not available for this demo item.</p>}
      </fieldset>

      {fulfillmentMethod === "local_pickup" && (
        <fieldset className="option-group">
          <legend>Pickup time</legend>
          <div className="pickup-slot-grid">
            {demoPickupSlots.map((slot) => (
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
        selectedSize={selectedSize}
      />
    </div>
  );
}
