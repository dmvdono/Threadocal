"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FavoriteProductButton } from "@/components/customer/FavoriteProductButton";
import { ProductReviewsClient } from "@/components/customer/ProductReviewsClient";
import { ADMIN_UPDATED_EVENT, isProductHidden } from "@/services/admin";
import { getBrandProductBySlug } from "@/services/brand-portal";
import { recordRecentlyViewedProduct } from "@/services/customer";
import type { Product } from "@/types/product";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";
import { ProductPurchaseForm } from "@/components/marketplace/ProductPurchaseForm";

type ProductDetailClientProps = {
  fallbackProduct: Product;
};

export function ProductDetailClient({ fallbackProduct }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product>(fallbackProduct);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    function syncProduct() {
      const localProduct = getBrandProductBySlug(fallbackProduct.slug) ?? fallbackProduct;
      const hidden = isProductHidden(localProduct.id);
      setProduct(localProduct);
      setUnavailable(hidden);

      if (!hidden) {
        recordRecentlyViewedProduct(localProduct.id);
      }
    }

    queueMicrotask(syncProduct);
    window.addEventListener(ADMIN_UPDATED_EVENT, syncProduct);
    window.addEventListener("storage", syncProduct);

    return () => {
      window.removeEventListener(ADMIN_UPDATED_EVENT, syncProduct);
      window.removeEventListener("storage", syncProduct);
    };
  }, [fallbackProduct]);

  if (unavailable) {
    return (
      <section className="product-detail">
        <article className="product-detail-panel unavailable-panel">
          <p className="eyebrow">Product unavailable</p>
          <h2>This product is currently unavailable.</h2>
          <p>
            This item was hidden by admin moderation in demo mode. Restore it in the Admin Products tab to make it
            visible again across Threadocal.
          </p>
          <Link className="primary-link" href={routes.shop}>
            Back to shop
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="product-detail">
      <div className={`product-detail-art tone-${product.imageTone ?? "graphite"}`}>
        <span>{product.brandName}</span>
      </div>
      <article className="product-detail-panel">
        <p className="eyebrow">{product.category}</p>
        <FavoriteProductButton
          className="secondary-action compact-action"
          label={`Favorite ${product.name}`}
          productId={product.id}
        />
        <h2>{product.salePriceCents ? formatCents(product.salePriceCents) : formatCents(product.priceCents)}</h2>
        {product.salePriceCents && <s>{formatCents(product.priceCents)}</s>}
        <p>{product.description}</p>
        <ProductPurchaseForm product={product} />
        <div className="pickup-box">
          <h3>Local pickup option</h3>
          <p>
            {product.pickupAvailable
              ? "This demo item is marked pickup-ready. Scheduling and pickup windows will connect after orders move to Supabase."
              : "This item is shipping-only in demo mode. Pickup support can be enabled later by brand location."}
          </p>
        </div>
        <Link className="secondary-link" href={routes.shop}>
          Back to shop
        </Link>
      </article>
      <ProductReviewsClient productId={product.id} />
    </section>
  );
}
