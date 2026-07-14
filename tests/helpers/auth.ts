import { expect, type Page, type TestInfo } from "@playwright/test";
import { requireDestructiveE2E } from "./env";

export type TestRole = "customer" | "brand_owner" | "admin";

export function uniqueEmail(role: TestRole) {
  return `threadocal-e2e-${role}-${Date.now()}-${Math.round(Math.random() * 100000)}@example.com`;
}

export async function loginWithEnvAccount(page: Page, role: TestRole, testInfo: TestInfo) {
  const prefix = `E2E_${role.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];

  if (!email || !password) {
    testInfo.skip(true, `${prefix}_EMAIL and ${prefix}_PASSWORD are required for this authenticated test.`);
    throw new Error(`${prefix}_EMAIL and ${prefix}_PASSWORD are required for this authenticated test.`);
  }

  await page.goto(`/login?role=${role === "brand_owner" ? "brand_owner" : "customer"}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
}

export async function signupThroughUI(page: Page, role: Exclude<TestRole, "admin">, testInfo: TestInfo) {
  requireDestructiveE2E(testInfo);
  const email = uniqueEmail(role);
  const password = process.env.E2E_TEST_PASSWORD ?? `Threadocal-${Date.now()}!`;

  await page.goto(`/signup?role=${role}`);
  await page.getByRole("radio", { name: role === "brand_owner" ? "Brand owner" : "Customer" }).check();
  await page.getByLabel("Full name").fill(`Threadocal E2E ${role}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByLabel("City").fill("Fredericksburg");
  await page.getByLabel("State").fill("VA");
  await page.getByLabel("ZIP code").fill("22405");
  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page).toHaveURL(role === "brand_owner" ? /brand-dashboard/ : /dashboard/);
  return { email, password };
}
