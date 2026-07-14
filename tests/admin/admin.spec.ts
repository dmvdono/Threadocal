import { expect, test } from "@playwright/test";
import { loginWithEnvAccount } from "../helpers/auth";

test.describe("admin access", () => {
  test("logged-out users cannot see admin controls", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).not.toContainText(/Approve brand|Resolve for customer|Approve image/i);
  });

  test("admin can enter through normal login when env credentials are provided", async ({ page }, testInfo) => {
    await loginWithEnvAccount(page, "admin", testInfo);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator("body")).toContainText(/Admin/i);
  });
});
