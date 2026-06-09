import type { Locator, Page } from "playwright";

export const PAGINATION_SELECTORS: readonly string[] = [
  'a[rel="next"]',
  'a[aria-label="Next"]',
  'button[aria-label="Next"]',
  'a:has-text("Next")',
  'button:has-text("Next")',
];

export const MAX_PAGES = 50;

export async function findNextPageLocator(page: Page): Promise<Locator | null> {
  for (const selector of PAGINATION_SELECTORS) {
    const locator = page.locator(selector).first();
    try {
      await locator.waitFor({ state: "visible", timeout: 2000 });
      const disabled = await locator.isDisabled().catch(() => false);
      if (disabled) {
        continue;
      }
      return locator;
    } catch {
      continue;
    }
  }
  return null;
}

export async function goToNextPage(page: Page): Promise<boolean> {
  const next = await findNextPageLocator(page);
  if (!next) {
    return false;
  }
  await next.click();
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  return true;
}
