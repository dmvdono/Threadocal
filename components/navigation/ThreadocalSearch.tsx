"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoBrands, productCategories } from "@/lib/demo/marketplace";
import { ADMIN_UPDATED_EVENT, filterVisibleProducts } from "@/services/admin";
import { BRAND_PORTAL_UPDATED_EVENT, getBrandProducts } from "@/services/brand-portal";
import type { Product } from "@/types/product";
import { routes } from "@/utils/routes";

type SearchResult = {
  href: string;
  label: string;
  detail: string;
  type: "Brand" | "Product" | "Category" | "City";
};

function includes(value: string | undefined, query: string) {
  return Boolean(value?.toLowerCase().includes(query));
}

export function ThreadocalSearch() {
  const [query, setQuery] = useState("");
  const [pickupToday, setPickupToday] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    function syncProducts() {
      setProducts(filterVisibleProducts(getBrandProducts()));
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
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const hasFilters = pickupToday || openNow;

    if (!normalizedQuery && !hasFilters) {
      return [];
    }

    const brandResults: SearchResult[] = demoBrands
      .filter((brand) => {
        const matchesQuery =
          !normalizedQuery ||
          includes(brand.name, normalizedQuery) ||
          includes(brand.category, normalizedQuery) ||
          includes(brand.city, normalizedQuery) ||
          includes(brand.state, normalizedQuery);
        const matchesPickup = !pickupToday || brand.pickupAvailable;
        const matchesOpen = !openNow || brand.status === "active";

        return matchesQuery && matchesPickup && matchesOpen;
      })
      .map((brand) => ({
        href: `${routes.brands}/${brand.slug}`,
        label: brand.name,
        detail: `${brand.category} · ${brand.city}, ${brand.state}`,
        type: "Brand" as const,
      }));

    const productResults: SearchResult[] = products
      .filter((product) => {
        const brand = demoBrands.find((currentBrand) => currentBrand.id === product.brandId);
        const matchesQuery =
          !normalizedQuery ||
          includes(product.name, normalizedQuery) ||
          includes(product.brandName, normalizedQuery) ||
          includes(product.category, normalizedQuery) ||
          includes(brand?.city, normalizedQuery);
        const matchesPickup = !pickupToday || product.pickupAvailable;
        const matchesOpen = !openNow || brand?.status === "active";

        return matchesQuery && matchesPickup && matchesOpen;
      })
      .map((product) => ({
        href: `${routes.shop}/${product.slug}`,
        label: product.name,
        detail: `${product.brandName} · ${product.category}`,
        type: "Product" as const,
      }));

    const categoryResults: SearchResult[] = productCategories
      .filter((category) => category.value !== "all")
      .filter((category) => !normalizedQuery || includes(category.label, normalizedQuery))
      .map((category) => ({
        href: `${routes.shop}?category=${category.value}`,
        label: category.label,
        detail: "Shop category",
        type: "Category" as const,
      }));

    const cityResults: SearchResult[] = Array.from(new Set(demoBrands.map((brand) => `${brand.city}, ${brand.state}`)))
      .filter((city) => !normalizedQuery || city.toLowerCase().includes(normalizedQuery))
      .map((city) => ({
        href: `${routes.brands}?city=${encodeURIComponent(city)}`,
        label: city,
        detail: "City",
        type: "City" as const,
      }));

    return [...brandResults, ...productResults, ...categoryResults, ...cityResults].slice(0, 8);
  }, [openNow, pickupToday, products, query]);

  return (
    <div className="search-shell">
      <div className="top-search-input">
        <span>⌕</span>
        <input
          aria-label="Search brands, products, categories, or cities"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search brands, products, city..."
          value={query}
        />
      </div>
      {(focused || query || pickupToday || openNow) && (
        <div className="search-results">
          <div className="search-filters">
            <button className={pickupToday ? "active" : ""} onClick={() => setPickupToday(!pickupToday)} type="button">
              Pickup today
            </button>
            <button className={openNow ? "active" : ""} onClick={() => setOpenNow(!openNow)} type="button">
              Open now
            </button>
          </div>
          {results.length === 0 ? (
            <p>No local matches yet.</p>
          ) : (
            results.map((result) => (
              <Link
                href={result.href}
                key={`${result.type}-${result.href}`}
                onClick={() => {
                  setFocused(false);
                  setQuery("");
                }}
              >
                <strong>{result.label}</strong>
                <span>
                  {result.type} · {result.detail}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
