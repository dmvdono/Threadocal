"use client";

import { demoBrands, demoProducts } from "@/lib/demo/marketplace";
import { getBrandProducts } from "@/services/brand-portal";
import type { BrandProfile } from "@/types/brand";
import type { Product } from "@/types/product";

const FAVORITE_PRODUCTS_KEY = "threadocal-demo-favorite-products";
const FAVORITE_BRANDS_KEY = "threadocal-demo-favorite-brands";
const RECENTLY_VIEWED_KEY = "threadocal-demo-recently-viewed";
const ADDRESSES_KEY = "threadocal-demo-addresses";
const NOTIFICATIONS_KEY = "threadocal-demo-notifications";
const REVIEWS_KEY = "threadocal-demo-reviews";

export const CUSTOMER_UPDATED_EVENT = "threadocal-demo-customer-updated";

export type DemoAddress = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  zipCode: string;
};

export type DemoNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type DemoProductReview = {
  id: string;
  productId: string;
  rating: number;
  body: string;
  createdAt: string;
};

const defaultAddresses: DemoAddress[] = [
  {
    id: "addr-demo-home",
    label: "Home",
    line1: "Demo customer address",
    city: "Washington",
    state: "DC",
    zipCode: "20001",
  },
];

const defaultNotifications: DemoNotification[] = [
  {
    id: "note-welcome",
    title: "Marketplace account tools are active",
    body: "Favorites, addresses, and reviews are saved for this browser while order history loads from Threadocal.",
    read: false,
    createdAt: "2026-07-09T00:00:00.000Z",
  },
  {
    id: "note-pickup",
    title: "Pickup flow ready",
    body: "Completed pickup orders can be reviewed from product pages.",
    read: false,
    createdAt: "2026-07-09T00:00:00.000Z",
  },
];

function readArray<T>(key: string, fallback: T[] = []) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeArray<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(CUSTOMER_UPDATED_EVENT));
}

export function getCatalogProducts(): Product[] {
  const localProducts = getBrandProducts();
  const byId = new Map<string, Product>();

  [...localProducts, ...demoProducts].forEach((product) => {
    if (product.status === "active") {
      byId.set(product.id, product);
    }
  });

  return Array.from(byId.values());
}

export function getCatalogProductById(productId: string) {
  return getCatalogProducts().find((product) => product.id === productId) ?? null;
}

export function getCatalogBrands(): BrandProfile[] {
  return demoBrands;
}

export function getFavoriteProductIds() {
  return readArray<string>(FAVORITE_PRODUCTS_KEY);
}

export function isFavoriteProduct(productId: string) {
  return getFavoriteProductIds().includes(productId);
}

export function toggleFavoriteProduct(productId: string) {
  const currentIds = getFavoriteProductIds();
  const isFavorite = currentIds.includes(productId);
  const nextIds = isFavorite ? currentIds.filter((id) => id !== productId) : [productId, ...currentIds];

  writeArray(FAVORITE_PRODUCTS_KEY, nextIds);
  return !isFavorite;
}

export function getFavoriteBrandSlugs() {
  return readArray<string>(FAVORITE_BRANDS_KEY);
}

export function isFavoriteBrand(brandSlug: string) {
  return getFavoriteBrandSlugs().includes(brandSlug);
}

export function toggleFavoriteBrand(brandSlug: string) {
  const currentSlugs = getFavoriteBrandSlugs();
  const isFavorite = currentSlugs.includes(brandSlug);
  const nextSlugs = isFavorite
    ? currentSlugs.filter((slug) => slug !== brandSlug)
    : [brandSlug, ...currentSlugs];

  writeArray(FAVORITE_BRANDS_KEY, nextSlugs);
  return !isFavorite;
}

export function recordRecentlyViewedProduct(productId: string) {
  const currentIds = readArray<string>(RECENTLY_VIEWED_KEY);
  const nextIds = [productId, ...currentIds.filter((id) => id !== productId)].slice(0, 8);

  writeArray(RECENTLY_VIEWED_KEY, nextIds);
}

export function getRecentlyViewedProductIds() {
  return readArray<string>(RECENTLY_VIEWED_KEY);
}

export function getSavedAddresses() {
  return readArray<DemoAddress>(ADDRESSES_KEY, defaultAddresses);
}

export function saveAddress(address: Omit<DemoAddress, "id"> & { id?: string }) {
  const addresses = getSavedAddresses();
  const id = address.id ?? `addr-${Date.now()}`;
  const nextAddress = { ...address, id };
  const exists = addresses.some((currentAddress) => currentAddress.id === id);
  const nextAddresses = exists
    ? addresses.map((currentAddress) => (currentAddress.id === id ? nextAddress : currentAddress))
    : [nextAddress, ...addresses];

  writeArray(ADDRESSES_KEY, nextAddresses);
  return nextAddress;
}

export function deleteAddress(addressId: string) {
  const nextAddresses = getSavedAddresses().filter((address) => address.id !== addressId);
  writeArray(ADDRESSES_KEY, nextAddresses);
  return nextAddresses;
}

export function getNotifications() {
  return readArray<DemoNotification>(NOTIFICATIONS_KEY, defaultNotifications);
}

export function markNotificationRead(notificationId: string) {
  const nextNotifications = getNotifications().map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification,
  );

  writeArray(NOTIFICATIONS_KEY, nextNotifications);
  return nextNotifications;
}

export function getReviews() {
  return readArray<DemoProductReview>(REVIEWS_KEY);
}

export function getReviewsForProduct(productId: string) {
  return getReviews().filter((review) => review.productId === productId);
}

export function saveProductReview(input: { productId: string; rating: number; body: string }) {
  const reviews = getReviews();
  const existingReview = reviews.find((review) => review.productId === input.productId);
  const review: DemoProductReview = {
    id: existingReview?.id ?? `review-${Date.now()}`,
    productId: input.productId,
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    body: input.body.trim(),
    createdAt: existingReview?.createdAt ?? new Date().toISOString(),
  };
  const nextReviews = existingReview
    ? reviews.map((currentReview) => (currentReview.id === existingReview.id ? review : currentReview))
    : [review, ...reviews];

  writeArray(REVIEWS_KEY, nextReviews);
  return review;
}

export function getAverageRating(productId: string) {
  const reviews = getReviewsForProduct(productId);

  if (reviews.length === 0) {
    return null;
  }

  const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  return Number(average.toFixed(1));
}

export function canReviewProduct(productId: string) {
  return Boolean(productId) && false;
}
