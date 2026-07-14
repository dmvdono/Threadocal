import { expect, test } from "@playwright/test";

test.describe("navigation and dropdowns", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("main navigation and footer links do not 404", async ({ page }) => {
    const links = [
      { name: "Home", url: "/" },
      { name: "Shop", url: "/shop" },
      { name: "Promotions", url: "/promotions" },
      { name: "How It Works", url: "/how-it-works" },
      { name: "Shopping cart", url: "/cart" },
      { name: "Customer Login", url: "/login?role=customer" },
      { name: "Brand Login", url: "/login?role=brand_owner" },
      { name: "Customer Sign Up", url: "/signup?role=customer" },
      { name: "Brand Sign Up", url: "/signup?role=brand_owner" },
    ];

    for (const link of links) {
      await page.goto(link.url);
      await expect(page.locator("body")).not.toContainText(/404|This page could not be found/i);
    }
  });

  test("desktop hover opens Brands, Sign Up, Log In, and account menus", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Hover behavior is covered on the desktop Chromium project.");

    await page.getByRole("button", { name: "Brands", exact: true }).hover();
    await expect(page.getByRole("menuitem", { name: "Browse Brands" })).toBeVisible();

    await page.getByRole("button", { name: "Sign Up", exact: true }).hover();
    await expect(page.getByRole("menuitem", { name: "Customer Sign Up" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Brand Sign Up" })).toBeVisible();

    await page.getByRole("button", { name: "Log In", exact: true }).hover();
    await expect(page.getByRole("menuitem", { name: "Customer Login" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Brand Login" })).toBeVisible();

    await page.getByRole("button", { name: "Customer account" }).hover();
    await expect(page.getByRole("menuitem", { name: "My Account" })).toBeVisible();
  });

  test("tap opens dropdowns and menu item clicks register", async ({ page }) => {
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await page.getByRole("menuitem", { name: "Brand Sign Up" }).click();
    await expect(page).toHaveURL(/\/signup\?role=brand_owner/);
    await expect(page.getByRole("radio", { name: "Brand owner" })).toBeChecked();

    await page.goto("/");
    await page.getByRole("button", { name: "Log In", exact: true }).click();
    await page.getByRole("menuitem", { name: "Customer Login" }).click();
    await expect(page).toHaveURL(/\/login\?role=customer/);
  });
});
