import { expect, test } from "@playwright/test";

const productSlug = process.env.E2E_PRODUCT_SLUG ?? "";

test.describe("cart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("requires size before adding a sized product to cart", async ({ page }) => {
    test.skip(!productSlug, "E2E_PRODUCT_SLUG is required for Supabase product cart tests.");
    await page.goto(`/product/${productSlug}`);
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.locator(".auth-message.error")).toContainText(/Select a size|Select a color/i);
  });

  test("shipping cart item persists after refresh", async ({ page }) => {
    test.skip(!productSlug, "E2E_PRODUCT_SLUG is required for Supabase product cart tests.");
    await page.goto(`/product/${productSlug}`);
    const sizeFieldset = page.locator("fieldset").filter({ hasText: "Size" });
    const colorFieldset = page.locator("fieldset").filter({ hasText: "Color" });

    if (await sizeFieldset.count()) {
      await sizeFieldset.first().getByRole("button").first().click();
    }

    if (await colorFieldset.count()) {
      await colorFieldset.first().getByRole("button").first().click();
    }

    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.getByRole("status")).toContainText(/Added to cart/i);

    await page.goto("/cart");
    await expect(page.locator("body")).toContainText(/Shipping order/i);
    await page.reload();
    await expect(page.locator("body")).toContainText(/Shipping order/i);
  });
});
