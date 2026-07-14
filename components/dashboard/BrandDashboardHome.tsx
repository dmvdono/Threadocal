"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandPortalNav } from "@/components/dashboard/BrandPortalNav";
import { BRAND_PORTAL_UPDATED_EVENT, getBrandDashboardProducts } from "@/services/brand-portal";
import { getBrandOrders, ORDERS_UPDATED_EVENT } from "@/services/orders";
import type { Order } from "@/types/order";
import type { BrandPortalProduct } from "@/types/product";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

export function BrandDashboardHome() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<BrandPortalProduct[]>([]);

  useEffect(() => {
    async function syncDashboard() {
      try {
        setOrders(await getBrandOrders());
      } catch {
        setOrders([]);
      }
      const result = await getBrandDashboardProducts();
      setProducts(result.products);
    }

    void syncDashboard();
    window.addEventListener(ORDERS_UPDATED_EVENT, syncDashboard);
    window.addEventListener(BRAND_PORTAL_UPDATED_EVENT, syncDashboard);
    window.addEventListener("storage", syncDashboard);

    return () => {
      window.removeEventListener(ORDERS_UPDATED_EVENT, syncDashboard);
      window.removeEventListener(BRAND_PORTAL_UPDATED_EVENT, syncDashboard);
      window.removeEventListener("storage", syncDashboard);
    };
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today).length;
    const pendingPickupOrders = orders.filter((order) => order.status === "ready_for_pickup").length;
    const revenue = orders
      .filter((order) => order.status === "completed")
      .reduce((total, order) => total + order.totalCents, 0);
    const lowInventory = products.flatMap((product) =>
      product.inventory
        .filter((variant) => variant.quantity <= 3)
        .map((variant) => `${product.name} / ${variant.size} / ${variant.color}: ${variant.quantity}`),
    );

    return {
      revenue,
      lowInventory,
      pendingPickupOrders,
      productCount: products.length,
      todayOrders,
    };
  }, [orders, products]);

  return (
    <>
      <BrandPortalNav />
      <section className="portal-metrics">
        <article>
          <span>Today&apos;s orders</span>
          <strong>{stats.todayOrders}</strong>
        </article>
        <article>
          <span>Pending pickup</span>
          <strong>{stats.pendingPickupOrders}</strong>
        </article>
        <article>
          <span>Revenue</span>
          <strong>{formatCents(stats.revenue)}</strong>
        </article>
        <article>
          <span>Products</span>
          <strong>{stats.productCount}</strong>
        </article>
      </section>

      <section className="portal-grid">
        <article className="portal-panel">
          <h2>Low inventory alerts</h2>
          {stats.lowInventory.length > 0 ? (
            <ul>
              {stats.lowInventory.slice(0, 6).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No low inventory alerts right now.</p>
          )}
        </article>

        <article className="portal-panel">
          <h2>Quick links</h2>
          <div className="portal-actions">
            <Link href={routes.brandProducts}>Products</Link>
            <Link href={routes.brandOrders}>Orders</Link>
            <Link href={routes.brandCoupons}>Coupons</Link>
            <Link href={routes.brandAnalytics}>Analytics</Link>
            <Link href={routes.brandInventory}>Inventory</Link>
            <Link href={routes.brandSubmit}>Settings</Link>
          </div>
        </article>
      </section>
    </>
  );
}
