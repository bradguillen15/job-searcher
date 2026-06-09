import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { chromium, type Browser } from "playwright";

import type { Locator, Page } from "playwright";

import {
  resolveSearchInput,
  setSelectorTimeoutMs,
  submitSearch,
} from "../../../src/main/scraper/search-bar.js";

const FIXTURES_DIR = path.join(import.meta.dirname, "..", "..", "fixtures", "boards");

function fixtureUrl(name: string): string {
  return `file://${path.join(FIXTURES_DIR, name)}`;
}

describe("resolveSearchInput", () => {
  let browser: Browser;

  it("setup browser", async () => {
    setSelectorTimeoutMs(2000);
    browser = await chromium.launch({ headless: true });
  });

  it("prefers saved selector over heuristics", async () => {
    const page = await browser.newPage();
    await page.goto(fixtureUrl("with-search-input.html"));
    const locator = await resolveSearchInput(page, "#custom-search");
    assert.ok(locator);
    const id = await locator!.getAttribute("id");
    assert.equal(id, "custom-search");
    await page.close();
  });

  it("falls back to heuristic cascade", async () => {
    const page = await browser.newPage();
    await page.goto(fixtureUrl("with-heuristic-search.html"));
    const locator = await resolveSearchInput(page, null);
    assert.ok(locator);
    const type = await locator!.getAttribute("type");
    assert.equal(type, "search");
    await page.close();
  });

  it("returns null when no search input exists", async () => {
    setSelectorTimeoutMs(50);
    const page = await browser.newPage();
    await page.goto(fixtureUrl("no-search-input.html"));
    const locator = await resolveSearchInput(page, null);
    assert.equal(locator, null);
    await page.close();
  });

  after(async () => {
    await browser.close();
  });
});

describe("submitSearch", () => {
  it("clears field, types keyword, presses Enter, and waits for networkidle", async () => {
    const fillCalls: string[] = [];
    const pressCalls: string[] = [];
    const loadStates: string[] = [];

    const locator = {
      fill: async (text: string) => {
        fillCalls.push(text);
      },
      press: async (key: string) => {
        pressCalls.push(key);
      },
    } as unknown as Locator;

    const page = {
      waitForLoadState: async (state: string) => {
        loadStates.push(state);
      },
      locator: () => ({
        first: () => ({
          waitFor: async () => {},
          click: async () => {},
        }),
      }),
    } as unknown as Page;

    await submitSearch(page, locator, "engineer");

    assert.deepEqual(fillCalls, ["", "engineer"]);
    assert.deepEqual(pressCalls, ["Enter"]);
    assert.deepEqual(loadStates, ["networkidle"]);
  });

  it("falls back to submit control when Enter does not reach networkidle quickly", async () => {
    const fillCalls: string[] = [];
    let enterNetworkIdleAttempts = 0;
    let submitClicked = false;
    const loadStates: string[] = [];

    const locator = {
      fill: async (text: string) => {
        fillCalls.push(text);
      },
      press: async () => {},
    } as unknown as Locator;

    const page = {
      waitForLoadState: async (state: string, options?: { timeout?: number }) => {
        loadStates.push(state);
        if (state === "networkidle" && options?.timeout === 2000) {
          enterNetworkIdleAttempts++;
          throw new Error("Enter did not settle");
        }
      },
      locator: (selector: string) => ({
        first: () => ({
          waitFor: async () => {
            if (selector === 'button[type="submit"]') {
              return;
            }
            throw new Error("not found");
          },
          click: async () => {
            if (selector === 'button[type="submit"]') {
              submitClicked = true;
            }
          },
        }),
      }),
    } as unknown as Page;

    await submitSearch(page, locator, "rust");

    assert.deepEqual(fillCalls, ["", "rust"]);
    assert.equal(enterNetworkIdleAttempts, 1);
    assert.equal(submitClicked, true);
    assert.deepEqual(loadStates, ["networkidle", "networkidle"]);
  });
});
