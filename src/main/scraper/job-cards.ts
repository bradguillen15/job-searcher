import type { Page } from "playwright";
import { parsePostedDate } from "./dates";
import type { ScrapedJob } from "./types";

export const JOB_CARD_ROOT_SELECTORS: readonly string[] = [
  "article",
  '[class*="job-card"]',
  '[class*="JobCard"]',
  '[data-testid*="job"]',
  "li.result",
];

const TITLE_SELECTORS = [
  "h2 a",
  "h3 a",
  "h2",
  "h3",
  'a[class*="title"]',
];

const COMPANY_SELECTORS = [
  '[class*="company"]',
  '[data-testid*="company"]',
];

const LOCATION_SELECTORS = [
  '[class*="location"]',
  '[data-testid*="location"]',
];

const DATE_SELECTORS = [
  "time[datetime]",
  "time",
  '[class*="date"]',
  '[class*="posted"]',
];

const DESCRIPTION_SELECTORS = [
  '[class*="snippet"]',
  '[class*="description"]',
  "p",
];

const URL_SELECTORS = [
  "h2 a[href]",
  "h3 a[href]",
  'a[class*="title"][href]',
];

async function firstNonEmptyText(
  root: ReturnType<Page["locator"]>,
  selectors: string[]
): Promise<string | null> {
  for (const selector of selectors) {
    const locator = root.locator(selector).first();
    const count = await locator.count();
    if (count === 0) {
      continue;
    }
    const text = (await locator.textContent())?.trim() ?? "";
    if (text) {
      return text;
    }
  }
  return null;
}

async function extractUrl(
  root: ReturnType<Page["locator"]>,
  pageUrl: string
): Promise<string | null> {
  for (const selector of URL_SELECTORS) {
    const locator = root.locator(selector).first();
    const count = await locator.count();
    if (count === 0) {
      continue;
    }
    const href = await locator.getAttribute("href");
    if (href) {
      return new URL(href, pageUrl).toString();
    }
  }
  return null;
}

async function extractPostedDate(
  root: ReturnType<Page["locator"]>
): Promise<string | null> {
  for (const selector of DATE_SELECTORS) {
    const locator = root.locator(selector).first();
    const count = await locator.count();
    if (count === 0) {
      continue;
    }
    const datetime = await locator.getAttribute("datetime");
    const raw = datetime ?? (await locator.textContent())?.trim() ?? "";
    if (!raw) {
      continue;
    }
    const parsed = parsePostedDate(raw);
    if (parsed) {
      return parsed.toISOString();
    }
  }
  return null;
}

async function extractDescription(
  root: ReturnType<Page["locator"]>
): Promise<string | null> {
  for (const selector of DESCRIPTION_SELECTORS) {
    const locator = root.locator(selector).first();
    const count = await locator.count();
    if (count === 0) {
      continue;
    }
    const text = (await locator.textContent())?.trim() ?? "";
    if (text.length >= 20) {
      return text;
    }
  }
  return null;
}

async function findCardRoots(page: Page): Promise<ReturnType<Page["locator"]>> {
  for (const selector of JOB_CARD_ROOT_SELECTORS) {
    const roots = page.locator(selector);
    const count = await roots.count();
    if (count > 0) {
      return roots;
    }
  }
  return page.locator("__no_match__");
}

export async function extractJobCards(page: Page): Promise<ScrapedJob[]> {
  const pageUrl = page.url();
  const roots = await findCardRoots(page);
  const count = await roots.count();
  const jobs: ScrapedJob[] = [];

  for (let i = 0; i < count; i++) {
    const root = roots.nth(i);
    const title = await firstNonEmptyText(root, TITLE_SELECTORS);
    const url = await extractUrl(root, pageUrl);

    if (!title || !url) {
      continue;
    }

    const company = await firstNonEmptyText(root, COMPANY_SELECTORS);
    const location = await firstNonEmptyText(root, LOCATION_SELECTORS);
    const postedDate = await extractPostedDate(root);
    const description = await extractDescription(root);

    jobs.push({
      title,
      company,
      location,
      postedDate,
      description,
      url,
    });
  }

  return jobs;
}
