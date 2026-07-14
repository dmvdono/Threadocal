import { expect, test } from "@playwright/test";

test.describe("customer demo experience", () => {
  test("account page surfaces orders, favorites, following, addresses, notifications, and settings", async ({ page }) => {
    await page.goto("/account");
    for (const section of ["Orders", "Favorites", "Following Brands", "Addresses", "Notifications", "Settings"]) {
      await expect(page.locator("body")).toContainText(section);
    }
  });
});
