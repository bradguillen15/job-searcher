import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

import { db, openDatabase } from "../../../src/main/db.js";
import type { ProgressEvent } from "../../../src/main/scraper/types.js";
import {
  SEARCH_HEURISTICS,
  setSelectorTimeoutMs,
} from "../../../src/main/scraper/search-bar.js";
import {
  getRunState,
  provideSelector,
  resetRunState,
  runScraper,
  ScraperBusyError,
  ScraperNotWaitingError,
  setBrowserFactory,
} from "../../../src/main/scraper/run.js";

function makeLocator(visible = true): Locator {
  return {
    waitFor: async () => {},
    isDisabled: async () => false,
    fill: async () => {},
    press: async () => {},
    click: async () => {},
    count: async () => (visible ? 1 : 0),
    first: () => makeLocator(visible),
    nth: () => makeLocator(visible),
    getAttribute: async () => null,
    textContent: async () => "",
  } as unknown as Locator;
}

let searchResolvable = true;

describe("runScraper orchestrator", () => {
  const events: ProgressEvent[] = [];
  const emit = (event: ProgressEvent) => {
    events.push(event);
  };

  beforeEach(() => {
    openDatabase(":memory:");
    resetRunState();
    setSelectorTimeoutMs(10);
    events.length = 0;
    searchResolvable = true;

    setBrowserFactory(async () => {
      const page = {
        url: () => "https://board.example.com/",
        goto: async () => {},
        waitForLoadState: async () => {},
        screenshot: async () => Buffer.from("png"),
        locator: (selector: string) => {
          const isSearch =
            (SEARCH_HEURISTICS as readonly string[]).includes(selector) ||
            selector === "#custom-search";
          const isNext =
            selector.includes("next") ||
            selector.includes("Next") ||
            selector.includes('rel="next"');

          if (isSearch) {
            return {
              first: () => ({
                waitFor: async () => {
                  if (!searchResolvable) {
                    throw new Error("not found");
                  }
                },
                isDisabled: async () => false,
                fill: async () => {},
                press: async () => {},
                getAttribute: async () => "search",
              }),
            };
          }

          if (isNext) {
            return {
              first: () => ({
                waitFor: async () => {
                  throw new Error("no next");
                },
                isDisabled: async () => true,
                click: async () => {},
              }),
            };
          }

          return makeLocator();
        },
      } as unknown as Page;

      return {
        goto: async () => {},
        getPage: () => page,
        screenshotPng: async () => Buffer.from("screenshot"),
        close: async () => {},
      };
    });
  });

  afterEach(() => {
    resetRunState();
    setSelectorTimeoutMs(5000);
  });

  it("throws ScraperBusyError on concurrent run", async () => {
    db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
      "B",
      "https://board.example.com"
    );
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "dev",
      1
    );

    const first = runScraper({ dateRange: "7d" }, emit);
    await assert.rejects(
      () => runScraper({ dateRange: "7d" }, emit),
      ScraperBusyError
    );
    await first;
  });

  it("completes with zero jobs when no boards exist", async () => {
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "dev",
      1
    );

    const result = await runScraper({ dateRange: "7d" }, emit);

    assert.ok("runId" in result);
    if ("runId" in result) {
      assert.equal(result.totalScraped, 0);
      assert.equal(result.totalNew, 0);
    }

    const run = db
      .prepare("SELECT finished_at, total_scraped FROM runs WHERE id = ?")
      .get((result as { runId: number }).runId) as {
      finished_at: string;
      total_scraped: number;
    };
    assert.ok(run.finished_at);
    assert.equal(run.total_scraped, 0);
    assert.ok(events.some((e) => e.type === "run_complete"));
  });

  it("completes with zero jobs when no active keywords exist", async () => {
    db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
      "B",
      "https://board.example.com"
    );
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "dev",
      0
    );

    const result = await runScraper({ dateRange: "7d" }, emit);

    assert.ok("runId" in result);
    if ("runId" in result) {
      assert.equal(result.totalScraped, 0);
      assert.equal(result.totalNew, 0);
    }
  });

  it("emits selector_required and resumes with provided selector", async () => {
    const boardResult = db
      .prepare("INSERT INTO boards (name, url, search_selector) VALUES (?, ?, ?)")
      .run("B", "https://board.example.com", null);
    const boardId = Number(boardResult.lastInsertRowid);
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "dev",
      1
    );

    searchResolvable = false;

    const runPromise = runScraper({ dateRange: "7d" }, emit);

    await new Promise((r) => setTimeout(r, 200));
    assert.equal(getRunState(), "awaiting_selector");
    assert.ok(events.some((e) => e.type === "selector_required"));

    searchResolvable = true;
    provideSelector({ boardId, selector: "#custom-search" });

    const result = await runPromise;
    assert.ok("runId" in result);

    const board = db
      .prepare("SELECT search_selector FROM boards WHERE id = ?")
      .get(boardId) as { search_selector: string };
    assert.equal(board.search_selector, "#custom-search");
  });

  it("skips board when selector is cancelled", async () => {
    const boardResult = db
      .prepare("INSERT INTO boards (name, url) VALUES (?, ?)")
      .run("B", "https://board.example.com");
    const boardId = Number(boardResult.lastInsertRowid);
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "dev",
      1
    );
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "rust",
      1
    );

    searchResolvable = false;

    const runPromise = runScraper({ dateRange: "7d" }, emit);
    await new Promise((r) => setTimeout(r, 200));

    provideSelector({ boardId, cancelled: true });
    const result = await runPromise;

    assert.ok("runId" in result);
    assert.ok(events.some((e) => e.type === "board_done"));
    assert.ok(events.some((e) => e.type === "log"));
  });

  it("provideSelector throws when not waiting", () => {
    assert.throws(() => provideSelector({ boardId: 1, selector: "#x" }), ScraperNotWaitingError);
  });

  it("emits run_error and returns error on unrecoverable failure", async () => {
    db.prepare("INSERT INTO boards (name, url, search_selector) VALUES (?, ?, ?)").run(
      "B",
      "https://board.example.com",
      'input[type="search"]'
    );
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "dev",
      1
    );

    setBrowserFactory(async () => {
      throw new Error("browser launch failed");
    });

    const result = await runScraper({ dateRange: "7d" }, emit);

    assert.ok("error" in result);
    if ("error" in result) {
      assert.equal(result.error, "browser launch failed");
    }

    const runError = events.find((e) => e.type === "run_error");
    assert.ok(runError);
    if (runError?.type === "run_error") {
      assert.equal(runError.message, "browser launch failed");
    }

    const run = db.prepare("SELECT finished_at FROM runs ORDER BY id DESC LIMIT 1").get() as {
      finished_at: string | null;
    };
    assert.ok(run.finished_at);
  });

  it("emits lifecycle progress events", async () => {
    db.prepare("INSERT INTO boards (name, url, search_selector) VALUES (?, ?, ?)").run(
      "B",
      "https://board.example.com",
      'input[type="search"]'
    );
    db.prepare("INSERT INTO keywords (keyword, active) VALUES (?, ?)").run(
      "dev",
      1
    );

    await runScraper({ dateRange: "7d" }, emit);

    const types = events.map((e) => e.type);
    assert.ok(types.includes("board_start"));
    assert.ok(types.includes("keyword_start"));
    assert.ok(types.includes("board_done"));
    assert.ok(types.includes("run_complete"));
  });
});
