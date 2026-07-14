import { expect, test } from "@playwright/test";
import path from "node:path";

test.describe("brand product creator", () => {
  test("draft product creator exposes core marketplace fields", async ({ page }) => {
    await page.goto("/brand-dashboard/products");
    await expect(page.getByRole("heading", { name: /Create product/i })).toBeVisible();

    await expect(page.getByLabel("Product name")).toBeVisible();
    await expect(page.getByLabel("Product images")).toBeVisible();
    await expect(page.getByLabel("SKU")).toBeVisible();
    await expect(page.getByLabel("Release date")).toBeVisible();
    await expect(page.getByLabel("Tags")).toBeVisible();
    await expect(page.getByLabel("Starting inventory per size/color")).toBeVisible();
    await expect(page.getByLabel("Status")).toHaveValue("draft");
  });

  test("multiple selected product images show filenames and previews before save", async ({ page }) => {
    await page.goto("/brand-dashboard/products");
    const logoPath = path.join(process.cwd(), "public", "threadocal-logo.png");

    await page.getByLabel("Product images").setInputFiles([logoPath, logoPath]);
    await expect(page.locator("body")).toContainText(/2 images ready/i);
    await expect(page.getByLabel("Selected product image previews").locator("img")).toHaveCount(2);
  });
});
