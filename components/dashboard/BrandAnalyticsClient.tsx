"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandPortalNav } from "@/components/dashboard/BrandPortalNav";
import { getBrandProducts } from "@/services/brand-portal";
import { getDemoOrders } from "@/services/orders";
import type { Order } from "@/types/order";
import type { BrandPortalProduct } from "@/types/product";
import { formatCents } from "@/utils/money";

export function BrandAnalyticsClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<BrandPortalProduct[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setOrders(getDemoOrders());
      setProducts(getBrandProducts());
    });
  }, []);

  const analytics = useMemo(() => {
    const sales = orders.reduce((total, order) => total + order.totalCents, 0);
    const orderCount = orders.length;
    const views = 1240 + products.length * 80;
    const conversionRate = views > 0 ? (orderCount / views) * 100 : 0;
    const returningCustomers = Math.min(38, orderCount * 4 + 12);
    const topProducts = products.slice(0, 5).map((product, index) => ({
      name: product.name,
      value: Math.max(18, 92 - index * 14),
    }));

    return { conversionRate, orderCount, returningCustomers, sales, topProducts, views };
  }, [orders, products]);

  return (
    <>
      <BrandPortalNav />
      <section className="portal-metrics">
        <article><span>Sales</span><strong>{formatCents(analytics.sales)}</strong></article>
        <article><span>Orders</span><strong>{analytics.orderCount}</strong></article>
        <article><span>Views</span><strong>{analytics.views}</strong></article>
        <article><span>Conversion</span><strong>{analytics.conversionRate.toFixed(1)}%</strong></article>
        <article><span>Returning customers</span><strong>{analytics.returningCustomers}%</strong></article>
      </section>
      <section className="portal-panel portal-wide">
        <h2>Top products</h2>
        <div className="bar-list">
          {analytics.topProducts.map((product) => (
            <div className="bar-row" key={product.name}>
              <span>{product.name}</span>
              <div><b style={{ width: `${product.value}%` }} /></div>
              <strong>{product.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
