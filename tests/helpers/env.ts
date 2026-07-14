import { expect, type Page, type TestInfo } from "@playwright/test";

export const destructiveE2EAllowed = process.env.ALLOW_DESTRUCTIVE_E2E === "true";
export const productionWritesAllowed = process.env.ALLOW_PRODUCTION_E2E_WRITES === "true";

export function isProductionLike(baseURL?: string) {
  return Boolean(baseURL && /threadocal\.(com|vercel\.app)|threadocal-[^.]+\.vercel\.app/.test(baseURL));
}

export function requireDestructiveE2E(testInfo: TestInfo) {
  if (!destructiveE2EAllowed) {
    testInfo.skip(true, "Destructive E2E writes require ALLOW_DESTRUCTIVE_E2E=true.");
  }
}

export async function clearBrowserState(page: Page) {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

export async function expectPageReady(page: Page, titleOrHeading: RegExp | string) {
  await expect(page.locator("body")).not.toContainText(/404|This page could not be found/i);
  await expect(page.getByRole("heading", { name: titleOrHeading }).first()).toBeVisible();
}

export function captureDiagnostics(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (!/favicon|ResizeObserver/.test(text)) {
        consoleErrors.push(text);
      }
    }
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    const errorText = request.failure()?.errorText ?? "";

    if (errorText === "cancelled") {
      return;
    }

    if (!/\.(png|jpg|jpeg|webp|svg|ico|woff2?)($|\?)/i.test(url)) {
      failedRequests.push(`${request.method()} ${url} ${request.failure()?.errorText ?? ""}`.trim());
    }
  });

  return {
    expectClean: async () => {
      expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
      expect(failedRequests, `Failed critical requests:\n${failedRequests.join("\n")}`).toEqual([]);
    },
  };
}
