"use client";

import { defaultBrandSubmission, demoBrands } from "@/lib/demo/marketplace";
import { getBrandProducts } from "@/services/brand-portal";
import { getDemoOrders } from "@/services/orders";
import type { DemoBrandSubmission } from "@/types/brand";
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
