"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/types/product";
import { clearCart, getCartItems, removeCartItem, updateCartItemQuantity } from "@/services/cart";
import { getMarketplaceProductsByIds } from "@/services/products";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

export function CartPageClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getMarketplaceProductsByIds>>>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function syncCart() {
      const cartItems = getCartItems();
      setItems(cartItems);

      try {
        setProducts(await getMarketplaceProductsByIds(cartItems.map((item) => item.productId)));
        setMessage(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Threadocal could not load cart products.");
      }
    }

    void syncCart();
  }, []);

  const cartProducts = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((marketplaceProduct) => marketplaceProduct.id === item.productId);
          return product ? { item, product } : null;
        })
        .filter(Boolean),
    [items, products],
  );

  const subtotalCents = cartProducts.reduce((total, entry) => {
    if (!entry) {
      return total;
    }

    return total + (entry.product.salePriceCents ?? entry.product.priceCents) * entry.item.quantity;
  }, 0);

  function handleQuantityChange(cartItemId: string, quantity: number) {
    setItems(updateCartItemQuantity(cartItemId, quantity));
  }

  function handleRemoveItem(cartItemId: string) {
    setItems(removeCartItem(cartItemId));
  }

  function handleClearCart() {
    clearCart();
    setItems([]);
  }

  if (cartProducts.length === 0) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>Your cart is empty</h2>
          <p>Browse marketplace products and add something to your cart for pickup or shipping checkout.</p>
          <Link className="primary-link" href={routes.shop}>
            Shop Products
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="cart-layout">
      <div className="cart-items">
        {cartProducts.map((entry) => {
          if (!entry) {
            return null;
          }

          const unitPrice = entry.product.salePriceCents ?? entry.product.priceCents;

          return (
            <article className="cart-line" key={entry.item.id}>
              <div className={`cart-thumb tone-${entry.product.imageTone ?? "graphite"}`} />
              <div>
                <p>{entry.product.brandName}</p>
                <h2>{entry.product.name}</h2>
                <span>{formatCents(unitPrice)}</span>
                {entry.item.selectedSize && <small>Size {entry.item.selectedSize}</small>}
                {entry.item.selectedColor && <small>Color {entry.item.selectedColor}</small>}
                <small>
                  {entry.item.fulfillmentMethod === "local_pickup" ? "Pickup order" : "Shipping order"}
                  {entry.item.pickupSlot ? ` · ${entry.item.pickupSlot}` : ""}
                </small>
              </div>
              <div className="cart-line-actions">
                <div className="quantity-stepper" aria-label={`Quantity for ${entry.product.name}`}>
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => handleQuantityChange(entry.item.id, entry.item.quantity - 1)}
                    type="button"
                  >
                    -
                  </button>
                  <span>{entry.item.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => handleQuantityChange(entry.item.id, entry.item.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <button className="remove-line" onClick={() => handleRemoveItem(entry.item.id)} type="button">
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="cart-summary">
        <h2>Order Summary</h2>
        {message && (
          <p className="auth-message error" role="alert">
            {message}
          </p>
        )}
        <p>
          <span>Subtotal</span>
          <strong>{formatCents(subtotalCents)}</strong>
        </p>
        <div className="pickup-box">
          <h3>Fulfillment</h3>
          <p>Pickup items use pickup windows. Shipping items request a shipping address at checkout.</p>
        </div>
        <Link className="primary-link" href={routes.checkout}>
          Checkout
        </Link>
        <button className="secondary-action" onClick={handleClearCart} type="button">
          Clear Cart
        </button>
      </aside>
    </section>
  );
}
