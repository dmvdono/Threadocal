import { expect, test } from "@playwright/test";
import path from "node:path";

test.describe("brand profile editor", () => {
  test("does not save an empty brand and shows required field validation", async ({ page }) => {
    await page.goto("/brand-dashboard");
    await expect(page.getByRole("heading", { name: "Storefront identity" })).toBeVisible();
    await page.getByRole("button", { name: "Save Brand Profile" }).click();
    await expect(page.locator(".auth-message")).toContainText(/Brand name and username are required|Brand name is required/i);
    await expect(page.locator("body")).not.toContainText(/null value in column|not-null constraint/i);
  });

  test("logo and banner file selections remain visible before save", async ({ page }) => {
    await page.goto("/brand-dashboard");
    const logoPath = path.join(process.cwd(), "public", "threadocal-logo.png");

    await page.getByLabel("Logo image").setInputFiles(logoPath);
    await expect(page.locator("body")).toContainText(/threadocal-logo\.png/i);
    await expect(page.getByAltText("Brand logo preview")).toBeVisible();
  });
});
