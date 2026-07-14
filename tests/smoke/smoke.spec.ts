import { expect, test } from "@playwright/test";
import { captureDiagnostics } from "../helpers/env";

const smokeRoutes = [
  { path: "/", text: /THREADOCAL/i },
  { path: "/shop", text: /Shop/i },
  { path: "/brands", text: /Brands/i },
  { path: "/promotions", text: /Promotions/i },
  { path: "/how-it-works", text: /How It Works/i },
  { path: "/signup", text: /Sign Up/i },
  { path: "/login", text: /Log In/i },
  { path: "/cart", text: /cart/i },
  { path: "/checkout", text: /checkout|No checkout items/i },
  { path: "/dashboard", text: /Log In|Dashboard|Access|Loading your account/i },
  { path: "/account", text: /Account/i },
  { path: "/brand-dashboard", text: /Brand dashboard/i },
  { path: "/brand-dashboard/products", text: /Products/i },
  { path: "/brand-dashboard/inventory", text: /Inventory/i },
  { path: "/brand-dashboard/orders", text: /Orders/i },
  { path: "/brand-dashboard/coupons", text: /Coupons/i },
  { path: "/brand-dashboard/analytics", text: /Analytics/i },
  { path: "/admin", text: /Admin|Access Denied|Log In|Loading your account/i },
];

test.describe("smoke", () => {
  test("critical routes render without unexpected 404s", async ({ page }) => {
    const diagnostics = captureDiagnostics(page);

    for (const route of smokeRoutes) {
      await page.goto(route.path);
      await expect(page.locator("body")).not.toContainText(/404|This page could not be found/i);
      await expect(page.locator("body")).toContainText(route.text);
    }

    await diagnostics.expectClean();
  });

  test("protected admin route is not publicly usable", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).toContainText(/Log In|Access Denied|Admin|Loading your account/i);
    await expect(page.locator("body")).not.toContainText(/Approve brand|Image moderation queue/i);
  });
});
