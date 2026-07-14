import { expect, test } from "@playwright/test";
import { loginWithEnvAccount } from "../helpers/auth";
import { requireDestructiveE2E } from "../helpers/env";

const productSlug = process.env.E2E_PRODUCT_SLUG ?? "";

async function addConfiguredProduct(page: import("@playwright/test").Page, fulfillment: "Ship" | "Local Pickup") {
  await page.evaluate(() => window.localStorage.clear());

  if (!productSlug) {
    test.skip(true, "E2E_PRODUCT_SLUG is required for Supabase checkout tests.");
  }

  await page.goto(`/product/${productSlug}`);
  const sizeFieldset = page.locator("fieldset").filter({ hasText: "Size" });
  const colorFieldset = page.locator("fieldset").filter({ hasText: "Color" });

  if (await sizeFieldset.count()) {
    await sizeFieldset.first().getByRole("button").first().click();
  }

  if (await colorFieldset.count()) {
    await colorFieldset.first().getByRole("button").first().click();
  }

  await page.getByRole("button", { name: fulfillment }).click();
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("status")).toContainText(/Added to cart/i);
}

test.describe("checkout fulfillment language", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("shipping checkout requires address and avoids pickup status language", async ({ page }, testInfo) => {
    requireDestructiveE2E(testInfo);
    await loginWithEnvAccount(page, "customer", testInfo);
    await addConfiguredProduct(page, "Ship");
    await page.goto("/checkout");
    await expect(page.locator("body")).toContainText(/Shipping order/i);
    await expect(page.getByRole("heading", { name: "Shipping address" })).toBeVisible();
    await page.getByRole("button", { name: "Pay with Stripe" }).click();
    await expect(page.locator(".auth-message.error")).toContainText(/shipping address/i);
    await expect(page.locator("body")).not.toContainText(/Ready for pickup|Pickup location/i);
  });

  test("pickup checkout shows pickup location and pickup order language", async ({ page }, testInfo) => {
    requireDestructiveE2E(testInfo);
    await loginWithEnvAccount(page, "customer", testInfo);
    await addConfiguredProduct(page, "Local Pickup");
    await page.goto("/checkout");
    await expect(page.locator("body")).toContainText(/Pickup order/i);
    await expect(page.getByRole("heading", { name: "Pickup location" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Shipping address/i);
  });
});

test.describe("Stripe and Supabase order lifecycle", () => {
  test("shipping order can move from checkout through shipped, delivered, and completed", async ({ page }, testInfo) => {
    requireDestructiveE2E(testInfo);
    test.skip(!process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY is required for Stripe test-mode checkout.");
    await loginWithEnvAccount(page, "customer", testInfo);
    await addConfiguredProduct(page, "Ship");
    await page.goto("/checkout");
    await page.getByPlaceholder("Full name").fill("Threadocal E2E Customer");
    await page.getByPlaceholder("Address line 1").fill("123 Test Street");
    await page.getByPlaceholder("City").fill("Fredericksburg");
    await page.getByPlaceholder("State").fill("VA");
    await page.getByPlaceholder("ZIP").fill("22405");
    await page.getByRole("button", { name: "Pay with Stripe" }).click();

    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    await page.getByLabel(/Email/).fill(process.env.E2E_CUSTOMER_EMAIL ?? "threadocal-e2e@example.com");
    await page.getByLabel(/Card number/).fill("4242424242424242");
    await page.getByLabel(/Expiration/).fill("1234");
    await page.getByLabel(/CVC/).fill("123");
    await page.getByLabel(/Cardholder name/).fill("Threadocal E2E Customer");
    await page.getByRole("button", { name: /Pay/ }).click();
    await expect(page).toHaveURL(/checkout\/success/);
    await expect(page.getByRole("link", { name: "Track Order" })).toBeVisible({ timeout: 30000 });
    await page.getByRole("link", { name: "Track Order" }).click();
    await expect(page.locator("body")).toContainText(/Shipping order/i);

    const orderUrl = page.url();
    await loginWithEnvAccount(page, "brand_owner", testInfo);
    await page.goto("/brand-dashboard/orders");
    await page.getByRole("button", { name: "Preparing shipment" }).first().click();
    await page.getByPlaceholder("Add tracking when shipped").first().fill("E2E-TRACK-123");
    await page.getByRole("button", { name: "Shipped" }).first().click();
    await page.getByRole("button", { name: "Delivered" }).first().click();

    await loginWithEnvAccount(page, "customer", testInfo);
    await page.goto(orderUrl);
    await expect(page.locator("body")).toContainText(/Delivered/i);
    await page.getByRole("button", { name: "Everything went fine" }).click();
    await expect(page.locator("body")).toContainText(/Completed/i);
  });

  test("pickup order can move from checkout through ready, picked up, and completed", async ({ page }, testInfo) => {
    requireDestructiveE2E(testInfo);
    test.skip(!process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY is required for Stripe test-mode checkout.");
    await loginWithEnvAccount(page, "customer", testInfo);
    await addConfiguredProduct(page, "Local Pickup");
    await page.goto("/checkout");
    await page.getByRole("button", { name: "Pay with Stripe" }).click();

    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    await page.getByLabel(/Email/).fill(process.env.E2E_CUSTOMER_EMAIL ?? "threadocal-e2e@example.com");
    await page.getByLabel(/Card number/).fill("4242424242424242");
    await page.getByLabel(/Expiration/).fill("1234");
    await page.getByLabel(/CVC/).fill("123");
    await page.getByLabel(/Cardholder name/).fill("Threadocal E2E Customer");
    await page.getByRole("button", { name: /Pay/ }).click();
    await expect(page).toHaveURL(/checkout\/success/);
    await expect(page.getByRole("link", { name: "Track Order" })).toBeVisible({ timeout: 30000 });
    await page.getByRole("link", { name: "Track Order" }).click();
    await expect(page.locator("body")).toContainText(/Pickup order/i);

    const orderUrl = page.url();
    await loginWithEnvAccount(page, "brand_owner", testInfo);
    await page.goto("/brand-dashboard/orders");
    await page.getByRole("button", { name: "Preparing pickup" }).first().click();
    await page.getByRole("button", { name: "Ready for pickup" }).first().click();

    await loginWithEnvAccount(page, "customer", testInfo);
    await page.goto(orderUrl);
    await page.getByRole("button", { name: "Confirm pickup" }).click();
    await expect(page.locator("body")).toContainText(/Picked up/i);
    await page.getByRole("button", { name: "Everything went fine" }).click();
    await expect(page.locator("body")).toContainText(/Completed/i);
  });
});
