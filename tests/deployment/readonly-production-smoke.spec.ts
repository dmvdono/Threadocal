import { expect, test } from "@playwright/test";
import { isProductionLike } from "../helpers/env";

test.describe("production-safe smoke", () => {
  test("external production run is read-only", async ({ page, baseURL }, testInfo) => {
    test.skip(!isProductionLike(baseURL), "Only relevant when TEST_BASE_URL points at production or a Vercel preview.");

    await page.goto("/");
    await expect(page.locator("body")).toContainText(/THREADOCAL/i);
    await page.goto("/shop");
    await expect(page.locator("body")).not.toContainText(/404|This page could not be found/i);
    testInfo.annotations.push({ type: "safety", description: "No writes performed in this production smoke test." });
  });
});
