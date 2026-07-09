"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ADMIN_UPDATED_EVENT, filterVisibleProducts } from "@/services/admin";
import { BRAND_PORTAL_UPDATED_EVENT, getBrandProducts } from "@/services/brand-portal";
import type { Product } from "@/types/product";

type ShopProductGridClientProps = {
  category?: string;
  fallbackProducts: Product[];
};

export function ShopProductGridClient({ category, fallbackProducts }: ShopProductGridClientProps) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);

  useEffect(() => {
    function syncProducts() {
      const localProducts = getBrandProducts();
      const categoryProducts = category && category !== "all"
        ? localProducts.filter((product) => product.category === category)
        : localProducts;

      setProducts(filterVisibleProducts(categoryProducts));
    }

    queueMicrotask(syncProducts);
    window.addEventListener(ADMIN_UPDATED_EVENT, syncProducts);
    window.addEventListener(BRAND_PORTAL_UPDATED_EVENT, syncProducts);
    window.addEventListener("storage", syncProducts);

    return () => {
      window.removeEventListener(ADMIN_UPDATED_EVENT, syncProducts);
      window.removeEventListener(BRAND_PORTAL_UPDATED_EVENT, syncProducts);
      window.removeEventListener("storage", syncProducts);
    };
  }, [category]);

  if (products.length === 0) {
    return (
      <section className="product-grid" aria-label="Demo products">
        <article className="starter-card">
          <h2>No visible products</h2>
          <p>Products hidden by admin moderation will stay out of customer-facing discovery until restored.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="product-grid" aria-label="Demo products">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}
