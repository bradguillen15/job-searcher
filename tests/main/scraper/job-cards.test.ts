import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { chromium, type Browser } from "playwright";

import { extractJobCards } from "../../../src/main/scraper/job-cards.js";

const FIXTURES_DIR = path.join(import.meta.dirname, "..", "..", "fixtures", "boards");

describe("extractJobCards", () => {
  let browser: Browser;

  it("setup browser", async () => {
    browser = await chromium.launch({ headless: true });
  });

  it("extracts complete job cards and skips incomplete ones", async () => {
    const page = await browser.newPage();
    await page.goto(`file://${path.join(FIXTURES_DIR, "with-job-cards.html")}`);

    const jobs = await extractJobCards(page);

    assert.equal(jobs.length, 2);

    const senior = jobs.find((j) => j.title === "Senior Engineer");
    assert.ok(senior);
    assert.equal(senior.company, "Acme Corp");
    assert.equal(senior.location, "Remote");
    assert.ok(senior.postedDate);
    assert.match(senior.description ?? "", /TypeScript/);
    assert.match(senior.url, /senior-engineer/);

    const designer = jobs.find((j) => j.title === "Product Designer");
    assert.ok(designer);
    assert.equal(designer.company, "Design Co");
    assert.equal(designer.location, null);
    assert.ok(designer.postedDate);
    assert.equal(designer.description, null);
    assert.equal(designer.url, "https://other.com/jobs/designer/");

    await page.close();
  });

  after(async () => {
    await browser.close();
  });
});
