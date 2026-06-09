import type { Locator, Page } from "playwright";

export const SEARCH_HEURISTICS: readonly string[] = [
  'input[type="search"]',
  'input[name="q"]',
  'input[name="search"]',
  'input[placeholder*="Search"]',
  'input[aria-label*="search"]',
  "#search",
];

let selectorTimeoutMs = 5000;

export function setSelectorTimeoutMs(ms: number): void {
  selectorTimeoutMs = ms;
}

async function trySelector(page: Page, selector: string): Promise<Locator | null> {
  const locator = page.locator(selector).first();
  try {
    await locator.waitFor({ state: "visible", timeout: selectorTimeoutMs });
    const disabled = await locator.isDisabled();
    if (disabled) {
      return null;
    }
    return locator;
  } catch {
    return null;
  }
}

export async function resolveSearchInput(
  page: Page,
  savedSelector: string | null
): Promise<Locator | null> {
  if (savedSelector) {
    const saved = await trySelector(page, savedSelector);
    if (saved) {
      return saved;
    }
  }

  for (const selector of SEARCH_HEURISTICS) {
    const locator = await trySelector(page, selector);
    if (locator) {
      return locator;
    }
  }

  return null;
}

export async function submitSearch(
  page: Page,
  locator: Locator,
  keyword: string
): Promise<void> {
  await locator.fill("");
  await locator.fill(keyword);
  await locator.press("Enter");

  try {
    await page.waitForLoadState("networkidle", { timeout: 2000 });
    return;
  } catch {
    // Fall through to submit button click
  }

  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Search")',
  ];

  for (const selector of submitSelectors) {
    const submit = page.locator(selector).first();
    try {
      await submit.waitFor({ state: "visible", timeout: 1000 });
      await submit.click();
      break;
    } catch {
      continue;
    }
  }

  await page.waitForLoadState("networkidle", { timeout: 30000 });
}
