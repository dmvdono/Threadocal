import { expect, test } from "@playwright/test";
import { signupThroughUI } from "../helpers/auth";

test.describe("authentication UI", () => {
  test("signup query parameters preselect account role", async ({ page }) => {
    await page.goto("/signup?role=brand_owner");
    await expect(page.getByRole("radio", { name: "Brand owner" })).toBeChecked();

    await page.goto("/signup?role=customer");
    await expect(page.getByRole("radio", { name: "Customer" })).toBeChecked();
  });

  test("login query parameter preserves matching create-account role", async ({ page }) => {
    await page.goto("/login?role=brand_owner");
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/\/signup\?role=brand_owner/);
    await expect(page.getByRole("radio", { name: "Brand owner" })).toBeChecked();
  });

  test("signup shows friendly validation for mismatched passwords", async ({ page }) => {
    await page.goto("/signup?role=customer");
    await page.getByLabel("Full name").fill("Threadocal Test");
    await page.getByLabel("Email").fill("threadocal-mismatch@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password-one");
    await page.getByLabel("Confirm password").fill("password-two");
    await page.locator("form").getByRole("button", { name: "Sign Up" }).click();
    await expect(page.locator(".auth-message.error")).toContainText(/password/i);
  });

  test("duplicate/customer/brand real signup requires destructive E2E flag", async ({ page }, testInfo) => {
    await signupThroughUI(page, "customer", testInfo);
  });
});
