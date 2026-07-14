"use client";

import { ProductCard } from "@/components/marketplace/ProductCard";
import type { Product } from "@/types/product";

type ShopProductGridClientProps = {
  category?: string;
  fallbackProducts: Product[];
};

export function ShopProductGridClient({ category, fallbackProducts }: ShopProductGridClientProps) {
  const products = fallbackProducts;
  void category;

  if (products.length === 0) {
    return (
      <section className="product-grid" aria-label="Products">
        <article className="starter-card">
          <h2>No visible products</h2>
          <p>Approved, published products will appear here when brands add inventory.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="product-grid" aria-label="Products">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}
