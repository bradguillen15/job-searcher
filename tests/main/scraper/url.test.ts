import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { sanitizeJobUrl } from "../../../src/main/scraper/url.js";
import { ScraperError } from "../../../src/main/scraper/types.js";

describe("sanitizeJobUrl", () => {
  it("lowercases hostname", () => {
    const result = sanitizeJobUrl("https://EXAMPLE.COM/jobs/1");
    assert.equal(result, "https://example.com/jobs/1");
  });

  it("strips utm and tracking query params", () => {
    const result = sanitizeJobUrl(
      "https://example.com/jobs/1?utm_source=email&ref=home&fbclid=abc&keep=yes"
    );
    assert.equal(result, "https://example.com/jobs/1?keep=yes");
  });

  it("removes hash fragment", () => {
    const result = sanitizeJobUrl("https://example.com/jobs/1#section");
    assert.equal(result, "https://example.com/jobs/1");
  });

  it("removes trailing slash from pathname", () => {
    const result = sanitizeJobUrl("https://example.com/jobs/1/");
    assert.equal(result, "https://example.com/jobs/1");
  });

  it("preserves root pathname slash", () => {
    const result = sanitizeJobUrl("https://example.com/");
    assert.equal(result, "https://example.com/");
  });

  it("throws ScraperError for invalid URLs", () => {
    assert.throws(() => sanitizeJobUrl("not-a-url"), ScraperError);
  });
});
