import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ScoutScreen from "../../src/renderer/screens/ScoutScreen";
import { LAST_COMPLETED_RUN_SQL } from "../../src/renderer/lib/runs-db";
import { SCOUT_DEFAULT_DATE_RANGE_KEY } from "../../src/renderer/lib/scout-settings";
import type { Board } from "../../src/renderer/types/board";
import type { ProgressEvent } from "../../src/renderer/types/progress";

const mockInvoke = vi.fn();
let progressCallback: ((event: ProgressEvent) => void) | null = null;

const sampleBoards: Board[] = [
  {
    id: 1,
    name: "Indeed",
    url: "https://indeed.com",
    search_selector: null,
    created_at: "2026-06-08T12:00:00.000Z",
  },
  {
    id: 2,
    name: "LinkedIn",
    url: "https://linkedin.com/jobs",
    search_selector: null,
    created_at: "2026-06-08T12:00:00.000Z",
  },
];

function handleDbQuery(payload: {
  sql: string;
  params?: unknown[];
}): Promise<unknown> {
  if (
    payload.sql.includes("FROM boards") &&
    payload.sql.includes("ORDER BY name ASC")
  ) {
    return Promise.resolve(sampleBoards);
  }
  if (
    payload.sql.includes("FROM settings") &&
    payload.params?.[0] === SCOUT_DEFAULT_DATE_RANGE_KEY
  ) {
    return Promise.resolve([{ value: "30d" }]);
  }
  if (payload.sql === LAST_COMPLETED_RUN_SQL) {
    return Promise.resolve([
      {
        id: 9,
        started_at: "2026-06-08T10:00:00.000Z",
        finished_at: "2026-06-08T11:30:00.000Z",
        total_scraped: 15,
        total_new: 4,
        total_matched: 2,
      },
    ]);
  }
  return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
}

function emitProgress(event: ProgressEvent): void {
  progressCallback?.(event);
}

beforeEach(() => {
  mockInvoke.mockReset();
  progressCallback = null;

  mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
    if (channel === "db:query") {
      return handleDbQuery(payload as { sql: string; params?: unknown[] });
    }
    if (channel === "scraper:run") {
      return Promise.resolve({
        runId: 10,
        totalScraped: 5,
        totalNew: 2,
        totalMatched: 1,
        boardErrors: [{ boardId: 2, message: "Scrape failed on LinkedIn" }],
      });
    }
    if (channel === "scraper:provideSelector") {
      return Promise.resolve(undefined);
    }
    return Promise.reject(new Error(`unexpected channel: ${channel}`));
  });

  Object.defineProperty(window, "api", {
    configurable: true,
    value: {
      invoke: mockInvoke,
      on: vi.fn((_channel: string, cb: (...args: unknown[]) => void) => {
        progressCallback = (event: ProgressEvent) => cb(event);
        return () => {
          progressCallback = null;
        };
      }),
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ScoutScreen", () => {
  it("renders Scout heading and last run timestamp from database", async () => {
    render(<ScoutScreen />);

    expect(await screen.findByRole("heading", { name: "Scout" })).toBeTruthy();
    expect(screen.getByText(/^Last run:/)).toBeTruthy();
    expect(screen.getByText(/^Last run:/).textContent).not.toContain("Never");
  });

  it("shows Last run: Never when no completed runs exist", async () => {
    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "db:query") {
        const p = payload as { sql: string; params?: unknown[] };
        if (p.sql === LAST_COMPLETED_RUN_SQL) {
          return Promise.resolve([]);
        }
        return handleDbQuery(p);
      }
      return Promise.reject(new Error("unexpected"));
    });

    render(<ScoutScreen />);

    expect(await screen.findByText("Last run: Never")).toBeTruthy();
  });

  it("renders five date range options", async () => {
    render(<ScoutScreen />);

    await screen.findByRole("heading", { name: "Scout" });

    for (const label of ["24 hours", "7 days", "30 days", "60 days", "90 days"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("invokes scraper:run with selected date range", async () => {
    const user = userEvent.setup();
    render(<ScoutScreen />);

    await screen.findByRole("heading", { name: "Scout" });
    await user.click(screen.getByRole("button", { name: "7 days" }));
    await user.click(screen.getByRole("button", { name: "Run Scout" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("scraper:run", { dateRange: "7d" });
    });
  });

  it("disables Run Scout and date range while running", async () => {
    const user = userEvent.setup();
    let resolveRun: ((value: unknown) => void) | undefined;
    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "scraper:run") {
        return new Promise((resolve) => {
          resolveRun = resolve;
        });
      }
      if (channel === "db:query") {
        return handleDbQuery(payload as { sql: string; params?: unknown[] });
      }
      return Promise.reject(new Error("unexpected"));
    });

    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    const runButton = screen.getByRole("button", { name: "Run Scout" });
    await user.click(runButton);

    await waitFor(() => {
      expect((runButton as HTMLButtonElement).disabled).toBe(true);
    });
    expect((screen.getByRole("button", { name: "30 days" }) as HTMLButtonElement).disabled).toBe(true);

    resolveRun?.({
      runId: 1,
      totalScraped: 0,
      totalNew: 0,
      totalMatched: 0,
      boardErrors: [],
    });

    await waitFor(() => {
      expect((runButton as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it("appends progress log lines and updates board status from IPC events", async () => {
    const user = userEvent.setup();
    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    emitProgress({
      type: "board_start",
      timestamp: "2026-06-08T12:00:01.000Z",
      boardId: 1,
      boardName: "Indeed",
    });

    const list = screen.getByTestId("board-status-list");
    await waitFor(() => {
      const indeedRowAfterStart = within(list).getByText("Indeed").closest("li");
      expect(indeedRowAfterStart?.textContent).toContain("Running");
    });

    emitProgress({
      type: "keyword_start",
      timestamp: "2026-06-08T12:00:02.000Z",
      boardId: 1,
      keywordId: 1,
      keyword: "react",
    });
    emitProgress({
      type: "board_done",
      timestamp: "2026-06-08T12:00:03.000Z",
      boardId: 1,
      scraped: 12,
      new: 3,
    });

    expect(await screen.findByText(/Searching board 1: react/)).toBeTruthy();

    const indeedRow = within(list).getByText("Indeed").closest("li");
    expect(indeedRow?.textContent).toContain("Done");
    expect(indeedRow?.textContent).toContain("12 scraped");
  });

  it("shows run_complete summary in log and re-enables controls via IPC", async () => {
    const user = userEvent.setup();
    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "scraper:run") {
        return new Promise(() => {
          /* pending — re-enable via run_complete IPC, not scraper:run resolve */
        });
      }
      if (channel === "db:query") {
        return handleDbQuery(payload as { sql: string; params?: unknown[] });
      }
      return Promise.reject(new Error("unexpected"));
    });

    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    const runButton = screen.getByRole("button", { name: "Run Scout" });
    const dateButton = screen.getByRole("button", { name: "30 days" });
    await user.click(runButton);

    await waitFor(() => {
      expect((runButton as HTMLButtonElement).disabled).toBe(true);
    });

    emitProgress({
      type: "run_complete",
      timestamp: "2026-06-08T12:00:10.000Z",
      runId: 10,
      totalScraped: 40,
      totalNew: 10,
      totalMatched: 5,
    });

    expect(
      await screen.findByText(
        /Run complete — scraped: 40, new: 10, matched: 5/
      )
    ).toBeTruthy();

    await waitFor(() => {
      expect((runButton as HTMLButtonElement).disabled).toBe(false);
      expect((dateButton as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it("shows inline board error from progress log and scraper result", async () => {
    const user = userEvent.setup();
    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    emitProgress({
      type: "log",
      timestamp: "2026-06-08T12:00:04.000Z",
      boardId: 1,
      message: "Board error: CAPTCHA blocked navigation",
    });

    expect(
      (await screen.findByTestId("board-error-1")).textContent
    ).toContain("CAPTCHA blocked navigation");

    await user.click(screen.getByRole("button", { name: "Run Scout" }));

    await waitFor(() => {
      expect(screen.getByTestId("board-error-2").textContent).toContain(
        "Scrape failed on LinkedIn"
      );
    });
  });

  it("shows global error on run_error progress event", async () => {
    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    emitProgress({
      type: "run_error",
      timestamp: "2026-06-08T12:00:05.000Z",
      message: "Playwright crashed",
    });

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Playwright crashed"
    );
  });

  it("handles ScraperBusyError without entering running state", async () => {
    const user = userEvent.setup();
    const busyError = new Error("A scrape run is already in progress");
    busyError.name = "ScraperBusyError";

    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "scraper:run") {
        return Promise.reject(busyError);
      }
      if (channel === "db:query") {
        return handleDbQuery(payload as { sql: string; params?: unknown[] });
      }
      return Promise.reject(new Error("unexpected"));
    });

    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    const runButton = screen.getByRole("button", { name: "Run Scout" });
    await user.click(runButton);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "A scout session is already in progress."
    );
    expect((runButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows error result from scraper:run resolve", async () => {
    const user = userEvent.setup();
    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "scraper:run") {
        return Promise.resolve({ error: "No active keywords" });
      }
      if (channel === "db:query") {
        return handleDbQuery(payload as { sql: string; params?: unknown[] });
      }
      return Promise.reject(new Error("unexpected"));
    });

    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });
    await user.click(screen.getByRole("button", { name: "Run Scout" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "No active keywords"
    );
  });

  it("opens selector dialog and submits provideSelector IPC", async () => {
    const user = userEvent.setup();
    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    emitProgress({
      type: "selector_required",
      timestamp: "2026-06-08T12:00:06.000Z",
      boardId: 1,
      boardName: "Indeed",
      screenshotBase64: "abc123",
    });

    expect(
      await screen.findByText("Search bar required — Indeed")
    ).toBeTruthy();

    const input = screen.getByLabelText("CSS selector");
    await user.type(input, "input.search");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("scraper:provideSelector", {
        boardId: 1,
        selector: "input.search",
      });
    });
  });

  it("cancels selector dialog via provideSelector cancelled IPC", async () => {
    const user = userEvent.setup();
    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    emitProgress({
      type: "selector_required",
      timestamp: "2026-06-08T12:00:07.000Z",
      boardId: 2,
      boardName: "LinkedIn",
      screenshotBase64: "xyz",
    });

    await screen.findByText("Search bar required — LinkedIn");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("scraper:provideSelector", {
        boardId: 2,
        cancelled: true,
      });
    });
  });

  it("clears progress log on a new scout session", async () => {
    const user = userEvent.setup();
    render(<ScoutScreen />);
    await screen.findByRole("heading", { name: "Scout" });

    emitProgress({
      type: "log",
      timestamp: "2026-06-08T12:00:08.000Z",
      message: "First session line",
    });
    expect(await screen.findByText("First session line")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Run Scout" }));

    await waitFor(() => {
      expect(screen.queryByText("First session line")).toBeNull();
    });
  });

  it("refreshes last run after successful scraper:run", async () => {
    const user = userEvent.setup();
    let runQueryCount = 0;

    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "db:query") {
        const p = payload as { sql: string; params?: unknown[] };
        if (p.sql === LAST_COMPLETED_RUN_SQL) {
          runQueryCount += 1;
          if (runQueryCount === 1) {
            return Promise.resolve([]);
          }
          return Promise.resolve([
            {
              id: 11,
              started_at: "2026-06-08T14:00:00.000Z",
              finished_at: "2026-06-08T15:00:00.000Z",
              total_scraped: 1,
              total_new: 1,
              total_matched: 0,
            },
          ]);
        }
        return handleDbQuery(p);
      }
      if (channel === "scraper:run") {
        return Promise.resolve({
          runId: 11,
          totalScraped: 1,
          totalNew: 1,
          totalMatched: 0,
          boardErrors: [],
        });
      }
      return Promise.reject(new Error("unexpected"));
    });

    render(<ScoutScreen />);
    expect(await screen.findByText("Last run: Never")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Run Scout" }));

    await waitFor(() => {
      expect(screen.getByText(/^Last run:/).textContent).not.toContain("Never");
    });
  });
});
