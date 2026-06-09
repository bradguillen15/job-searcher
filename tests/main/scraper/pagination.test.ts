import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { chromium, type Browser } from "playwright";

import {
  findNextPageLocator,
  goToNextPage,
} from "../../../src/main/scraper/pagination.js";

const FIXTURES_DIR = path.join(import.meta.dirname, "..", "..", "fixtures", "boards");

function fixtureUrl(name: string): string {
  return `file://${path.join(FIXTURES_DIR, name)}`;
}

describe("pagination heuristics", () => {
  let browser: Browser;

  it("setup browser", async () => {
    browser = await chromium.launch({ headless: true });
  });

  it("findNextPageLocator finds rel=next control on fixture page", async () => {
    const page = await browser.newPage();
    await page.goto(fixtureUrl("with-pagination.html"));

    const next = await findNextPageLocator(page);

    assert.ok(next);
    const rel = await next!.getAttribute("rel");
    assert.equal(rel, "next");
    await page.close();
  });

  it("goToNextPage clicks next control and waits for updated results", async () => {
    const page = await browser.newPage();
    await page.goto(fixtureUrl("with-pagination.html"));

    assert.ok(await page.locator('a[href="/jobs/recent"]').count());

    const navigated = await goToNextPage(page);

    assert.equal(navigated, true);
    assert.ok(await page.locator('a[href="/jobs/page2"]').count());
    await page.close();
  });

  after(async () => {
    await browser.close();
  });
});
