"use client";

import { demoProducts } from "@/lib/demo/marketplace";
import type { BrandCoupon, BrandInventoryVariant, BrandPortalProduct, ProductCategory } from "@/types/product";

const BRAND_PRODUCTS_STORAGE_KEY = "threadocal-demo-brand-products";
const BRAND_COUPONS_STORAGE_KEY = "threadocal-demo-brand-coupons";
export const BRAND_PORTAL_UPDATED_EVENT = "threadocal-brand-portal-updated";
export const STANDARD_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
export const STANDARD_COLOR_OPTIONS = [
  "Black",
  "White",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Brown",
  "Pink",
  "Purple",
  "Yellow",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function createInventory(sizes: string[], colors: string[], baseQuantity: number): BrandInventoryVariant[] {
  const safeSizes = sizes.length > 0 ? sizes : ["OS"];
  const safeColors = colors.length > 0 ? colors : ["Default"];

  return safeSizes.flatMap((size) =>
    safeColors.map((color) => ({
      id: `${size}-${color}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      size,
      color,
      quantity: baseQuantity,
    })),
  );
}

function syncInventory(
  sizes: string[],
  colors: string[],
  baseQuantity: number,
  existingInventory: BrandInventoryVariant[] = [],
) {
  const existingById = new Map(existingInventory.map((variant) => [variant.id, variant]));

  return sizes.flatMap((size) =>
    colors.map((color) => {
      const id = `${size}-${color}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const existingVariant = existingById.get(id);

      return existingVariant ?? { id, size, color, quantity: baseQuantity };
    }),
  );
}

function toPortalProduct(product: (typeof demoProducts)[number], index: number): BrandPortalProduct {
  const colors = index % 2 === 0 ? ["Black", "Green"] : ["White", "Gray"];
  const baseQuantity = index === 1 ? 2 : 12;

  return {
    ...product,
    colors,
    imagePlaceholder: product.imageTone ?? "graphite",
    inventory: createInventory(product.sizes ?? ["OS"], colors, baseQuantity),
    soldOut: false,
  };
}

const defaultProducts = demoProducts.map(toPortalProduct);
const defaultCoupons: BrandCoupon[] = [
  {
    id: "coupon-local10",
    code: "LOCAL10",
    description: "Launch discount for local shoppers",
    discountType: "percent",
    amount: 10,
    startsAt: "2026-07-01",
    endsAt: "2026-08-01",
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "coupon-pickup",
    code: "PICKUP",
    description: "Free local pickup promotion",
    discountType: "free_pickup",
    amount: 0,
    startsAt: "2026-07-01",
    endsAt: "2026-09-01",
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];

function readStorage<T>(key: string, fallback: T[]) {
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

function writeStorage<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(BRAND_PORTAL_UPDATED_EVENT));
}

export type BrandProductInput = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  sizes: string[];
  colors: string[];
  inventoryQuantity: string;
  imagePlaceholder: string;
  soldOut: boolean;
};

export type BrandCouponInput = {
  id?: string;
  code: string;
  description: string;
  discountType: BrandCoupon["discountType"];
  amount: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export function getBrandProducts() {
  return readStorage<BrandPortalProduct>(BRAND_PRODUCTS_STORAGE_KEY, defaultProducts);
}

export function saveBrandProduct(input: BrandProductInput) {
  const now = new Date().toISOString();
  const products = getBrandProducts();
  const sizes = input.sizes.filter((size) => STANDARD_SIZE_OPTIONS.includes(size));
  const colors = input.colors.filter((color) => STANDARD_COLOR_OPTIONS.includes(color));
  const priceCents = Math.max(1, Math.round(Number(input.price || 1)));
  const inventoryQuantity = Math.max(0, Number(input.inventoryQuantity || 0));
  const existingProduct = input.id ? products.find((product) => product.id === input.id) : null;
  const id = input.id ?? `brand-prod-${Date.now()}`;
  const product: BrandPortalProduct = {
    id,
    brandId: "brand-district-stitch",
    brandName: "District Stitch Co.",
    name: input.name.trim(),
    slug: existingProduct?.slug ?? slugify(input.name || id),
    description: input.description.trim(),
    category: input.category,
    imageTone: input.imagePlaceholder || "graphite",
    imagePlaceholder: input.imagePlaceholder || "graphite",
    sizes,
    colors,
    inventory: syncInventory(sizes, colors, inventoryQuantity, existingProduct?.inventory),
    pickupAvailable: true,
    priceCents,
    status: input.soldOut ? "archived" : "active",
    soldOut: input.soldOut,
    createdAt: existingProduct?.createdAt ?? now,
    updatedAt: now,
  };
  const nextProducts = existingProduct
    ? products.map((currentProduct) => (currentProduct.id === product.id ? product : currentProduct))
    : [product, ...products];

  writeStorage(BRAND_PRODUCTS_STORAGE_KEY, nextProducts);
  return product;
}

export function deleteBrandProduct(productId: string) {
  const nextProducts = getBrandProducts().filter((product) => product.id !== productId);
  writeStorage(BRAND_PRODUCTS_STORAGE_KEY, nextProducts);
  return nextProducts;
}

export function getBrandProductBySlug(slug: string) {
  return getBrandProducts().find((product) => product.slug === slug) ?? null;
}

export function updateInventoryQuantity(productId: string, variantId: string, quantity: number) {
  const nextProducts = getBrandProducts().map((product) => {
    if (product.id !== productId) {
      return product;
    }

    const inventory = product.inventory.map((variant) =>
      variant.id === variantId ? { ...variant, quantity: Math.max(0, quantity) } : variant,
    );
    const soldOut = inventory.every((variant) => variant.quantity === 0);

    return {
      ...product,
      inventory,
      soldOut,
      status: soldOut ? "archived" as const : "active" as const,
      updatedAt: new Date().toISOString(),
    };
  });

  writeStorage(BRAND_PRODUCTS_STORAGE_KEY, nextProducts);
  return nextProducts;
}

export function getBrandCoupons() {
  return readStorage<BrandCoupon>(BRAND_COUPONS_STORAGE_KEY, defaultCoupons);
}

export function saveBrandCoupon(input: BrandCouponInput) {
  const now = new Date().toISOString();
  const coupons = getBrandCoupons();
  const existingCoupon = input.id ? coupons.find((coupon) => coupon.id === input.id) : null;
  const coupon: BrandCoupon = {
    id: input.id ?? `coupon-${Date.now()}`,
    code: input.code.trim().toUpperCase(),
    description: input.description.trim(),
    discountType: input.discountType,
    amount: input.discountType === "free_pickup" ? 0 : Math.max(0, Number(input.amount || 0)),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    active: input.active,
    createdAt: existingCoupon?.createdAt ?? now,
    updatedAt: now,
  };
  const nextCoupons = existingCoupon
    ? coupons.map((currentCoupon) => (currentCoupon.id === coupon.id ? coupon : currentCoupon))
    : [coupon, ...coupons];

  writeStorage(BRAND_COUPONS_STORAGE_KEY, nextCoupons);
  return coupon;
}

export function deleteBrandCoupon(couponId: string) {
  const nextCoupons = getBrandCoupons().filter((coupon) => coupon.id !== couponId);
  writeStorage(BRAND_COUPONS_STORAGE_KEY, nextCoupons);
  return nextCoupons;
}
