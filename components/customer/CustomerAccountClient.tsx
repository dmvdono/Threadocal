"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  CUSTOMER_UPDATED_EVENT,
  deleteAddress,
  getCatalogBrands,
  getCatalogProductById,
  getFavoriteBrandSlugs,
  getFavoriteProductIds,
  getNotifications,
  getRecentlyViewedProductIds,
  getSavedAddresses,
  markNotificationRead,
  saveAddress,
  type DemoAddress,
  type DemoNotification,
} from "@/services/customer";
import { getDemoOrders, ORDERS_UPDATED_EVENT } from "@/services/orders";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

type AddressDraft = Omit<DemoAddress, "id">;

const emptyAddress: AddressDraft = {
  label: "",
  line1: "",
  city: "",
  state: "",
  zipCode: "",
};

export function CustomerAccountClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [favoriteBrandSlugs, setFavoriteBrandSlugs] = useState<string[]>([]);
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<DemoAddress[]>([]);
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(emptyAddress);

  useEffect(() => {
    function syncCustomerData() {
      setOrders(getDemoOrders());
      setFavoriteProductIds(getFavoriteProductIds());
      setFavoriteBrandSlugs(getFavoriteBrandSlugs());
      setRecentProductIds(getRecentlyViewedProductIds());
      setAddresses(getSavedAddresses());
      setNotifications(getNotifications());
    }

    queueMicrotask(syncCustomerData);
    window.addEventListener(CUSTOMER_UPDATED_EVENT, syncCustomerData);
    window.addEventListener(ORDERS_UPDATED_EVENT, syncCustomerData);
    window.addEventListener("storage", syncCustomerData);

    return () => {
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, syncCustomerData);
      window.removeEventListener(ORDERS_UPDATED_EVENT, syncCustomerData);
      window.removeEventListener("storage", syncCustomerData);
    };
  }, []);

  const favoriteProducts = useMemo(
    () => favoriteProductIds.map(getCatalogProductById).filter((product): product is Product => Boolean(product)),
    [favoriteProductIds],
  );
  const favoriteBrands = useMemo(
    () => getCatalogBrands().filter((brand) => favoriteBrandSlugs.includes(brand.slug)),
    [favoriteBrandSlugs],
  );
  const recentProducts = useMemo(
    () => recentProductIds.map(getCatalogProductById).filter((product): product is Product => Boolean(product)),
    [recentProductIds],
  );
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!addressDraft.label || !addressDraft.line1 || !addressDraft.city || !addressDraft.state || !addressDraft.zipCode) {
      return;
    }

    saveAddress(addressDraft);
    setAddressDraft(emptyAddress);
    setAddresses(getSavedAddresses());
  }

  return (
    <section className="account-dashboard">
      <article className="account-panel profile-panel">
        <p className="eyebrow">Profile</p>
        <h2>Demo Customer</h2>
        <p>
          customer@threadocal.demo · Washington, DC
        </p>
        <div className="account-stats">
          <span>{orders.length} orders</span>
          <span>{favoriteProducts.length} favorite products</span>
          <span>{favoriteBrands.length} followed brands</span>
        </div>
      </article>

      <article className="account-panel" id="orders">
        <div className="panel-heading">
          <h2>My Orders</h2>
          <Link href={routes.shop}>Shop again</Link>
        </div>
        <div className="stack-list">
          {orders.length === 0 ? (
            <p>No demo orders yet.</p>
          ) : (
            orders.slice(0, 5).map((order) => (
              <Link href={`${routes.orders}/${order.id}`} key={order.id}>
                <strong>{order.id}</strong>
                <span>{order.status.replaceAll("_", " ")}</span>
                <b>{formatCents(order.totalCents)}</b>
              </Link>
            ))
          )}
        </div>
      </article>

      <article className="account-panel" id="favorites">
        <h2>Favorite Products</h2>
        <ProductMiniList products={favoriteProducts} emptyText="Heart products to save them here." />
      </article>

      <article className="account-panel" id="following">
        <h2>Favorite Brands</h2>
        <div className="stack-list">
          {favoriteBrands.length === 0 ? (
            <p>Follow brands to save storefronts here.</p>
          ) : (
            favoriteBrands.map((brand) => (
              <Link href={`${routes.brands}/${brand.slug}`} key={brand.id}>
                <strong>{brand.name}</strong>
                <span>
                  {brand.city}, {brand.state}
                </span>
              </Link>
            ))
          )}
        </div>
      </article>

      <article className="account-panel" id="addresses">
        <h2>Saved Addresses</h2>
        <div className="stack-list">
          {addresses.map((address) => (
            <div key={address.id}>
              <strong>{address.label}</strong>
              <span>
                {address.line1}, {address.city}, {address.state} {address.zipCode}
              </span>
              <button type="button" onClick={() => deleteAddress(address.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <form className="inline-form" onSubmit={handleAddressSubmit}>
          <input
            aria-label="Address label"
            placeholder="Label"
            value={addressDraft.label}
            onChange={(event) => setAddressDraft({ ...addressDraft, label: event.target.value })}
          />
          <input
            aria-label="Street address"
            placeholder="Street"
            value={addressDraft.line1}
            onChange={(event) => setAddressDraft({ ...addressDraft, line1: event.target.value })}
          />
          <input
            aria-label="City"
            placeholder="City"
            value={addressDraft.city}
            onChange={(event) => setAddressDraft({ ...addressDraft, city: event.target.value })}
          />
          <input
            aria-label="State"
            placeholder="State"
            value={addressDraft.state}
            onChange={(event) => setAddressDraft({ ...addressDraft, state: event.target.value })}
          />
          <input
            aria-label="ZIP code"
            placeholder="ZIP"
            value={addressDraft.zipCode}
            onChange={(event) => setAddressDraft({ ...addressDraft, zipCode: event.target.value })}
          />
          <button type="submit">Save</button>
        </form>
      </article>

      <article className="account-panel" id="recently-viewed">
        <h2>Recently Viewed</h2>
        <ProductMiniList products={recentProducts} emptyText="Viewed products will appear here." />
      </article>

      <article className="account-panel" id="notifications">
        <div className="panel-heading">
          <h2>Notifications</h2>
          <span>{unreadCount} unread</span>
        </div>
        <div className="stack-list">
          {notifications.map((notification) => (
            <div className={notification.read ? "" : "unread"} key={notification.id}>
              <strong>{notification.title}</strong>
              <span>{notification.body}</span>
              {!notification.read && (
                <button type="button" onClick={() => markNotificationRead(notification.id)}>
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      </article>

      <article className="account-panel" id="settings">
        <h2>Account Settings</h2>
        <label className="inline-check">
          <input defaultChecked type="checkbox" />
          Email order updates
        </label>
        <label className="inline-check">
          <input defaultChecked type="checkbox" />
          Pickup reminders
        </label>
        <p>Full authenticated account settings will connect after Supabase Auth resumes.</p>
      </article>
    </section>
  );
}

function ProductMiniList({ products, emptyText }: { products: Product[]; emptyText: string }) {
  if (products.length === 0) {
    return <p>{emptyText}</p>;
  }

  return (
    <div className="stack-list">
      {products.map((product) => (
        <Link href={`${routes.shop}/${product.slug}`} key={product.id}>
          <strong>{product.name}</strong>
          <span>{product.brandName}</span>
          <b>{formatCents(product.salePriceCents ?? product.priceCents)}</b>
        </Link>
      ))}
    </div>
  );
}
