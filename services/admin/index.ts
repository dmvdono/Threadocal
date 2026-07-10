"use client";

import { defaultBrandSubmission, demoBrands } from "@/lib/demo/marketplace";
import { createBrowserSupabaseClient } from "@/supabase/client";
import { getBrandProducts } from "@/services/brand-portal";
import { getDemoOrders } from "@/services/orders";
import type { DemoBrandSubmission } from "@/types/brand";
import type { Database, ImageModerationStatus } from "@/types/supabase";
import type {
  AdminActivityLogItem,
  AdminBrandSubmission,
  AdminBrandStatus,
  AdminDisputeDecision,
  AdminDisputeStatus,
  AdminProductModeration,
  AdminProductModerationStatus,
} from "@/types/admin";

const BRAND_QUEUE_KEY = "threadocal-admin-brand-queue";
const PRODUCT_MODERATION_KEY = "threadocal-admin-product-moderation";
const DISPUTE_DECISIONS_KEY = "threadocal-admin-dispute-decisions";
const ACTIVITY_LOG_KEY = "threadocal-admin-activity-log";
const LEGACY_BRAND_SUBMISSION_KEY = "threadocal-demo-brand-submission";

export const ADMIN_UPDATED_EVENT = "threadocal-admin-updated";

export type AdminMarketplaceBrand = Database["public"]["Tables"]["brands"]["Row"];
type AdminMarketplaceProduct = Database["public"]["Tables"]["products"]["Row"];
type AdminMarketplaceProductImage = Database["public"]["Tables"]["product_images"]["Row"];

export type AdminMarketplaceImageReview = {
  id: string;
  imageUrl: string;
  imageType: "brand_logo" | "brand_banner" | "product_image";
  moderationStatus: ImageModerationStatus;
  brandName: string;
  productName?: string;
  brandId?: string;
  productImageId?: string;
};

const defaultBrandQueue: AdminBrandSubmission[] = [
  {
    ...defaultBrandSubmission,
    id: "admin-brand-queue-1",
    brandName: "Harbor Goods",
    ownerName: "Maya Carter",
    email: "maya@harborgoods.demo",
    city: "Baltimore",
    state: "MD",
    category: "Workwear",
    description: "Durable coastal workwear with limited local capsule drops.",
    pickupAvailable: true,
    status: "pending",
    verified: false,
    submittedAt: "2026-07-09T00:00:00.000Z",
    updatedAt: "2026-07-09T00:00:00.000Z",
  },
  {
    ...defaultBrandSubmission,
    id: "admin-brand-queue-2",
    brandName: "Northline Knits",
    ownerName: "Evan Moore",
    email: "evan@northline.demo",
    city: "Philadelphia",
    state: "PA",
    category: "Knitwear",
    description: "Small-batch knit basics and cold-weather accessories.",
    pickupAvailable: false,
    status: "pending",
    verified: false,
    submittedAt: "2026-07-09T00:00:00.000Z",
    updatedAt: "2026-07-09T00:00:00.000Z",
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
  window.dispatchEvent(new Event(ADMIN_UPDATED_EVENT));
}

function logAdminAction(action: string, target: string) {
  const item: AdminActivityLogItem = {
    id: `admin-log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action,
    target,
    createdAt: new Date().toISOString(),
  };

  writeArray(ACTIVITY_LOG_KEY, [item, ...getAdminActivityLog()].slice(0, 50));
  return item;
}

function getLegacyBrandSubmission() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LEGACY_BRAND_SUBMISSION_KEY);
    return stored ? (JSON.parse(stored) as DemoBrandSubmission) : null;
  } catch {
    return null;
  }
}

export function addBrandToApprovalQueue(submission: DemoBrandSubmission) {
  const now = new Date().toISOString();
  const queuedBrand: AdminBrandSubmission = {
    ...submission,
    id: `admin-brand-${Date.now()}`,
    status: "pending",
    verified: false,
    submittedAt: now,
    updatedAt: now,
  };

  writeArray(BRAND_QUEUE_KEY, [queuedBrand, ...getAdminBrandQueue()]);
  logAdminAction("Brand submitted for review", submission.brandName);
  return queuedBrand;
}

export function getAdminBrandQueue(): AdminBrandSubmission[] {
  const queue = readArray<AdminBrandSubmission>(BRAND_QUEUE_KEY, defaultBrandQueue);
  const legacySubmission = getLegacyBrandSubmission();

  if (!legacySubmission?.brandName) {
    return queue;
  }

  const alreadyQueued = queue.some(
    (submission) =>
      submission.brandName.toLowerCase() === legacySubmission.brandName.toLowerCase() &&
      submission.email.toLowerCase() === legacySubmission.email.toLowerCase(),
  );

  if (alreadyQueued) {
    return queue;
  }

  return [
    {
      ...legacySubmission,
      id: "admin-brand-legacy-submission",
      status: "pending" as const,
      verified: false,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    ...queue,
  ];
}

export function updateBrandApproval(brandId: string, status: AdminBrandStatus) {
  const nextQueue = getAdminBrandQueue().map((brand) =>
    brand.id === brandId ? { ...brand, status, updatedAt: new Date().toISOString() } : brand,
  );

  writeArray(BRAND_QUEUE_KEY, nextQueue);
  const brand = nextQueue.find((submission) => submission.id === brandId);
  logAdminAction(`Brand ${status}`, brand?.brandName ?? brandId);
  return nextQueue;
}

export function markBrandVerified(brandId: string) {
  const nextQueue = getAdminBrandQueue().map((brand) =>
    brand.id === brandId ? { ...brand, verified: true, status: "approved" as const, updatedAt: new Date().toISOString() } : brand,
  );

  writeArray(BRAND_QUEUE_KEY, nextQueue);
  const brand = nextQueue.find((submission) => submission.id === brandId);
  logAdminAction("Brand marked verified", brand?.brandName ?? brandId);
  return nextQueue;
}

export function getProductModeration() {
  return readArray<AdminProductModeration>(PRODUCT_MODERATION_KEY);
}

export function getProductModerationStatus(productId: string) {
  return getProductModeration().find((item) => item.productId === productId)?.status ?? "visible";
}

export function isProductHidden(productId: string) {
  return getProductModerationStatus(productId) === "hidden";
}

export function filterVisibleProducts<ProductLike extends { id: string }>(products: ProductLike[]) {
  return products.filter((product) => !isProductHidden(product.id));
}

export function updateProductModeration(productId: string, status: AdminProductModerationStatus) {
  const moderation = getProductModeration();
  const existing = moderation.find((item) => item.productId === productId);
  const nextItem: AdminProductModeration = {
    productId,
    status,
    updatedAt: new Date().toISOString(),
  };
  const nextModeration = existing
    ? moderation.map((item) => (item.productId === productId ? nextItem : item))
    : [nextItem, ...moderation];

  writeArray(PRODUCT_MODERATION_KEY, nextModeration);
  const product = getBrandProducts().find((item) => item.id === productId);
  logAdminAction(`Product ${status}`, product?.name ?? productId);
  return nextModeration;
}

export function getDisputeDecisions() {
  return readArray<AdminDisputeDecision>(DISPUTE_DECISIONS_KEY);
}

export function getDisputeDecisionStatus(orderId: string) {
  return getDisputeDecisions().find((decision) => decision.orderId === orderId)?.status ?? "open";
}

export function updateDisputeDecision(orderId: string, status: AdminDisputeStatus) {
  const decisions = getDisputeDecisions();
  const existing = decisions.find((decision) => decision.orderId === orderId);
  const nextDecision: AdminDisputeDecision = {
    orderId,
    status,
    updatedAt: new Date().toISOString(),
  };
  const nextDecisions = existing
    ? decisions.map((decision) => (decision.orderId === orderId ? nextDecision : decision))
    : [nextDecision, ...decisions];

  writeArray(DISPUTE_DECISIONS_KEY, nextDecisions);
  logAdminAction(`Dispute marked ${status}`, orderId);
  return nextDecisions;
}

export function getAdminActivityLog() {
  return readArray<AdminActivityLogItem>(ACTIVITY_LOG_KEY);
}

export function getAdminOverview() {
  const orders = getDemoOrders();
  const products = getBrandProducts();
  const brandQueue = getAdminBrandQueue();

  return {
    totalOrders: orders.length,
    totalBrands: demoBrands.length + brandQueue.filter((brand) => brand.status === "approved").length,
    totalProducts: products.length,
    disputedOrders: orders.filter((order) => order.status === "disputed").length,
    pendingBrandApprovals: brandQueue.filter((brand) => brand.status === "pending").length,
  };
}

export async function getMarketplaceBrandsForAdmin() {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function updateMarketplaceBrandApproval(
  brandId: string,
  approvalStatus: "pending_review" | "approved" | "rejected" | "suspended",
) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from("brands")
    .update({ approval_status: approvalStatus, updated_at: new Date().toISOString() })
    .eq("id", brandId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateMarketplaceBrandVerified(brandId: string, verified: boolean) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from("brands")
    .update({ verified, updated_at: new Date().toISOString() })
    .eq("id", brandId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getMarketplaceImageReviewsForAdmin(): Promise<AdminMarketplaceImageReview[]> {
  const supabase = createBrowserSupabaseClient();
  const [{ data: brands, error: brandsError }, { data: images, error: imagesError }] = await Promise.all([
    supabase.from("brands").select("*").order("updated_at", { ascending: false }),
    supabase.from("product_images").select("*").order("created_at", { ascending: false }),
  ]);

  if (brandsError) {
    throw new Error(brandsError.message);
  }

  if (imagesError) {
    throw new Error(imagesError.message);
  }

  const productIds = Array.from(new Set((images ?? []).map((image) => image.product_id).filter(Boolean)));
  const { data: products, error: productsError } =
    productIds.length > 0
      ? await supabase.from("products").select("*").in("id", productIds)
      : { data: [] as AdminMarketplaceProduct[], error: null };

  if (productsError) {
    throw new Error(productsError.message);
  }

  const brandsById = new Map((brands ?? []).map((brand) => [brand.id, brand]));
  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const brandImageReviews = (brands ?? []).flatMap((brand) => {
    const reviews: AdminMarketplaceImageReview[] = [];

    if (brand.logo_url) {
      reviews.push({
        id: `${brand.id}-logo`,
        imageUrl: brand.logo_url,
        imageType: "brand_logo",
        moderationStatus: brand.logo_moderation_status,
        brandName: brand.name,
        brandId: brand.id,
      });
    }

    if (brand.banner_url) {
      reviews.push({
        id: `${brand.id}-banner`,
        imageUrl: brand.banner_url,
        imageType: "brand_banner",
        moderationStatus: brand.banner_moderation_status,
        brandName: brand.name,
        brandId: brand.id,
      });
    }

    return reviews;
  });
  const productImageReviews = (images ?? []).map((image: AdminMarketplaceProductImage) => {
    const product = productsById.get(image.product_id);
    const brand = product ? brandsById.get(product.brand_id) : null;

    return {
      id: image.id,
      imageUrl: image.image_url,
      imageType: "product_image" as const,
      moderationStatus: image.moderation_status,
      brandName: brand?.name ?? "Unknown brand",
      productName: product?.name ?? "Unknown product",
      productImageId: image.id,
    };
  });

  return [...brandImageReviews, ...productImageReviews].sort((a, b) => {
    if (a.moderationStatus === b.moderationStatus) {
      return a.brandName.localeCompare(b.brandName);
    }

    return a.moderationStatus === "pending" ? -1 : 1;
  });
}

export async function updateMarketplaceImageModeration(review: AdminMarketplaceImageReview, moderationStatus: ImageModerationStatus) {
  const supabase = createBrowserSupabaseClient();
  const reviewedAt = new Date().toISOString();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  const reviewerId = userData.user?.id ?? null;

  if (review.imageType === "brand_logo" && review.brandId) {
    const { error } = await supabase
      .from("brands")
      .update({
        logo_moderation_status: moderationStatus,
        logo_reviewed_at: reviewedAt,
        logo_reviewed_by: reviewerId,
        updated_at: reviewedAt,
      })
      .eq("id", review.brandId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if (review.imageType === "brand_banner" && review.brandId) {
    const { error } = await supabase
      .from("brands")
      .update({
        banner_moderation_status: moderationStatus,
        banner_reviewed_at: reviewedAt,
        banner_reviewed_by: reviewerId,
        updated_at: reviewedAt,
      })
      .eq("id", review.brandId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if (review.productImageId) {
    const { error } = await supabase
      .from("product_images")
      .update({
        moderation_status: moderationStatus,
        reviewed_at: reviewedAt,
        reviewed_by: reviewerId,
      })
      .eq("id", review.productImageId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
