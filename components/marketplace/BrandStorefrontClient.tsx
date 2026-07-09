"use client";

import { useEffect, useMemo, useState } from "react";
import { FavoriteBrandButton } from "@/components/customer/FavoriteBrandButton";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { demoPickupLocation, productCategories } from "@/lib/demo/marketplace";
import { ADMIN_UPDATED_EVENT, filterVisibleProducts } from "@/services/admin";
import { getBrandCoupons, getBrandProducts } from "@/services/brand-portal";
import { CUSTOMER_UPDATED_EVENT, getReviews } from "@/services/customer";
import type { BrandProfile } from "@/types/brand";
import type { BrandCoupon, Product } from "@/types/product";

type BrandStorefrontClientProps = {
  brand: BrandProfile;
  fallbackProducts: Product[];
};

const businessHours = [
  "Mon-Fri: 11 AM - 7 PM",
  "Saturday: 12 PM - 6 PM",
  "Sunday: Pickup by appointment",
];

export function BrandStorefrontClient({ brand, fallbackProducts }: BrandStorefrontClientProps) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [coupons, setCoupons] = useState<BrandCoupon[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [rating, setRating] = useState<string | null>(brand.rating ?? null);

  useEffect(() => {
    function syncStorefront() {
      const localProducts = getBrandProducts().filter(
        (product) => product.brandId === brand.id && product.status === "active",
      );
      const nextProducts = filterVisibleProducts(localProducts.length > 0 ? localProducts : fallbackProducts);
      setProducts(nextProducts);
      setCoupons(getBrandCoupons().filter((coupon) => coupon.active));

      const localReviews = getReviews();
      const brandProductIds = new Set(nextProducts.map((product) => product.id));
      const brandReviews = localReviews.filter((review) => brandProductIds.has(review.productId));

      if (brandReviews.length > 0) {
        const average = brandReviews.reduce((total, review) => total + review.rating, 0) / brandReviews.length;
        setRating(average.toFixed(1));
      }
    }

    queueMicrotask(syncStorefront);
    window.addEventListener(ADMIN_UPDATED_EVENT, syncStorefront);
    window.addEventListener(CUSTOMER_UPDATED_EVENT, syncStorefront);
    window.addEventListener("storage", syncStorefront);

    return () => {
      window.removeEventListener(ADMIN_UPDATED_EVENT, syncStorefront);
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, syncStorefront);
      window.removeEventListener("storage", syncStorefront);
    };
  }, [brand.id, fallbackProducts]);

  const categories = useMemo(
    () => productCategories.filter((category) => category.value === "all" || products.some((product) => product.category === category.value)),
    [products],
  );
  const visibleProducts = selectedCategory === "all"
    ? products
    : products.filter((product) => product.category === selectedCategory);

  return (
    <section className="brand-storefront">
      <div className="brand-storefront-hero">
        <div className="brand-banner">
          <span>{brand.name.slice(0, 2).toUpperCase()}</span>
        </div>
        <article className="brand-storefront-info">
          <div className="brand-logo">{brand.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="eyebrow">{brand.category}</p>
            <h2>{brand.name}</h2>
            <p>{brand.description}</p>
            <div className="product-meta">
              <span>
                {brand.city}, {brand.state}
              </span>
              <span>{brand.pickupAvailable ? "Pickup today demo" : "Shipping only"}</span>
              <span>{rating ? `${rating} stars` : "Ratings placeholder"}</span>
            </div>
          </div>
          <FavoriteBrandButton brandName={brand.name} brandSlug={brand.slug} className="secondary-action" showText />
        </article>
      </div>

      <div className="brand-storefront-grid">
        <aside className="storefront-sidebar">
          <article>
            <h3>Pickup Information</h3>
            <p>{brand.pickupAvailable ? demoPickupLocation : "Pickup is not enabled for this brand in demo mode."}</p>
          </article>
          <article>
            <h3>Business Hours</h3>
            {businessHours.map((hours) => (
              <p key={hours}>{hours}</p>
            ))}
          </article>
          <article>
            <h3>Contact</h3>
            <p>hello@{brand.slug}.demo</p>
            <p>
              {brand.city}, {brand.state}
            </p>
          </article>
          <article>
            <h3>Promotions</h3>
            {coupons.length === 0 ? (
              <p>No active demo promotions yet.</p>
            ) : (
              coupons.slice(0, 3).map((coupon) => (
                <p key={coupon.id}>
                  <strong>{coupon.code}</strong> · {coupon.description}
                </p>
              ))
            )}
          </article>
        </aside>

        <div>
          <div className="shop-filters storefront-filters" aria-label="Storefront categories">
            {categories.map((category) => (
              <button
                className={`filter-chip ${selectedCategory === category.value ? "active" : ""}`}
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                type="button"
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="product-grid storefront-products">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
