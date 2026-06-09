import type { Locator, Page } from "playwright";
import { dateRangeToCutoff, shouldStopPagination } from "./dates";
import { extractJobCards } from "./job-cards";
import {
  createRun,
  finishRun,
  insertJob,
  loadActiveKeywords,
  loadBoards,
  updateBoardSearchSelector,
} from "./jobs-db";
import { goToNextPage, MAX_PAGES } from "./pagination";
import { resolveSearchInput, submitSearch } from "./search-bar";
import { sanitizeJobUrl } from "./url";
import type { BrowserSession } from "./browser";
import { launchBrowser } from "./browser";
import type {
  BoardRow,
  ProgressEmitter,
  ScraperProvideSelectorPayload,
  ScraperRunPayload,
  ScraperRunResult,
} from "./types";
import { runMatching } from "../matcher/run";
import type { MatchingResult } from "../matcher/types";
import {
  ScraperBusyError,
  ScraperNotWaitingError,
} from "./types";

export { ScraperBusyError, ScraperNotWaitingError } from "./types";
export { ScraperError } from "./types";

type RunState = "idle" | "running" | "awaiting_selector";

let runState: RunState = "idle";
let selectorWaiter: {
  boardId: number;
  resolve: (payload: ScraperProvideSelectorPayload) => void;
} | null = null;

export type BrowserFactory = () => Promise<BrowserSession>;

let browserFactory: BrowserFactory = launchBrowser;

type MatchingRunner = (
  runId: number,
  emit: ProgressEmitter
) => Promise<MatchingResult>;

let matchingRunner: MatchingRunner = runMatching;

export function setBrowserFactory(factory: BrowserFactory): void {
  browserFactory = factory;
}

export function setMatchingRunner(runner: MatchingRunner): void {
  matchingRunner = runner;
}

export function resetMatchingRunner(): void {
  matchingRunner = runMatching;
}

export function resetRunState(): void {
  runState = "idle";
  selectorWaiter = null;
}

export function getRunState(): RunState {
  return runState;
}

export function provideSelector(payload: ScraperProvideSelectorPayload): void {
  if (runState !== "awaiting_selector" || !selectorWaiter) {
    throw new ScraperNotWaitingError();
  }
  if (selectorWaiter.boardId !== payload.boardId) {
    throw new ScraperNotWaitingError();
  }
  const resolve = selectorWaiter.resolve;
  selectorWaiter = null;
  runState = "running";
  resolve(payload);
}

function waitForSelector(boardId: number): Promise<ScraperProvideSelectorPayload> {
  return new Promise((resolve) => {
    selectorWaiter = { boardId, resolve };
  });
}

async function resolveSearchWithFallback(
  page: Page,
  board: BoardRow,
  emit: ProgressEmitter,
  session: BrowserSession
): Promise<Locator | "skip_board" | null> {
  let savedSelector = board.search_selector;

  while (true) {
    const locator = await resolveSearchInput(page, savedSelector);
    if (locator) {
      return locator;
    }

    const screenshot = await session.screenshotPng();
    runState = "awaiting_selector";
    emit({
      type: "selector_required",
      timestamp: new Date().toISOString(),
      boardId: board.id,
      boardName: board.name,
      screenshotBase64: screenshot.toString("base64"),
    });

    const response = await waitForSelector(board.id);

    if ("cancelled" in response) {
      emit({
        type: "log",
        timestamp: new Date().toISOString(),
        message: `Search selector cancelled for board ${board.name}`,
        boardId: board.id,
      });
      return "skip_board";
    }

    const selector = response.selector.trim();
    if (!selector) {
      continue;
    }

    updateBoardSearchSelector(board.id, selector);
    savedSelector = selector;
    board.search_selector = selector;
  }
}

async function scrapeBoardKeyword(
  session: BrowserSession,
  board: BoardRow,
  keyword: { id: number; keyword: string },
  runId: number,
  cutoff: Date,
  emit: ProgressEmitter
): Promise<{ scraped: number; new: number; skipBoard: boolean }> {
  const page = session.getPage();
  let scraped = 0;
  let newCount = 0;
  let pageNum = 1;

  await session.goto(board.url);

  emit({
    type: "keyword_start",
    timestamp: new Date().toISOString(),
    boardId: board.id,
    keywordId: keyword.id,
    keyword: keyword.keyword,
  });

  const searchInput = await resolveSearchWithFallback(page, board, emit, session);
  if (searchInput === "skip_board") {
    return { scraped, new: newCount, skipBoard: true };
  }
  if (!searchInput) {
    return { scraped, new: newCount, skipBoard: false };
  }

  await submitSearch(page, searchInput, keyword.keyword);

  while (pageNum <= MAX_PAGES) {
    const cards = await extractJobCards(page);
    scraped += cards.length;

    for (const card of cards) {
      const sanitized = sanitizeJobUrl(card.url);
      const result = insertJob({
        boardId: board.id,
        keywordId: keyword.id,
        runId,
        title: card.title,
        company: card.company,
        location: card.location,
        postedDate: card.postedDate,
        description: card.description,
        url: sanitized,
      });
      if (result === "inserted") {
        newCount++;
      }
    }

    if (shouldStopPagination(cards, cutoff)) {
      break;
    }

    const hasNext = await goToNextPage(page);
    if (!hasNext) {
      break;
    }

    pageNum++;
    if (pageNum > MAX_PAGES) {
      emit({
        type: "log",
        timestamp: new Date().toISOString(),
        message: `Pagination cap (${MAX_PAGES}) reached`,
        boardId: board.id,
        keywordId: keyword.id,
      });
      break;
    }
  }

  return { scraped, new: newCount, skipBoard: false };
}

export async function runScraper(
  payload: ScraperRunPayload,
  emit: ProgressEmitter
): Promise<ScraperRunResult> {
  if (runState === "running" || runState === "awaiting_selector") {
    throw new ScraperBusyError();
  }

  runState = "running";
  let runId: number | null = null;
  let browser: BrowserSession | null = null;
  const boardErrors: Array<{ boardId: number; message: string }> = [];
  let totalScraped = 0;
  let totalNew = 0;

  try {
    runId = createRun();
    const boards = loadBoards();
    const keywords = loadActiveKeywords();

    if (boards.length === 0 || keywords.length === 0) {
      finishRun(runId, { totalScraped: 0, totalNew: 0, totalMatched: 0 });
      emit({
        type: "run_complete",
        timestamp: new Date().toISOString(),
        runId,
        totalScraped: 0,
        totalNew: 0,
        totalMatched: 0,
      });
      runState = "idle";
      return {
        runId,
        totalScraped: 0,
        totalNew: 0,
        totalMatched: 0,
        boardErrors: [],
      };
    }

    const cutoff = dateRangeToCutoff(payload.dateRange);
    browser = await browserFactory();

    for (const board of boards) {
      emit({
        type: "board_start",
        timestamp: new Date().toISOString(),
        boardId: board.id,
        boardName: board.name,
      });

      let boardScraped = 0;
      let boardNew = 0;

      try {
        for (const keyword of keywords) {
          const result = await scrapeBoardKeyword(
            browser,
            board,
            keyword,
            runId,
            cutoff,
            emit
          );
          boardScraped += result.scraped;
          boardNew += result.new;

          if (result.skipBoard) {
            break;
          }
        }
      } catch (err) {
        const message = (err as Error).message;
        boardErrors.push({ boardId: board.id, message });
        emit({
          type: "log",
          timestamp: new Date().toISOString(),
          message: `Board error: ${message}`,
          boardId: board.id,
        });
      }

      totalScraped += boardScraped;
      totalNew += boardNew;

      emit({
        type: "board_done",
        timestamp: new Date().toISOString(),
        boardId: board.id,
        scraped: boardScraped,
        new: boardNew,
      });
    }

    const matching = await matchingRunner(runId, emit);

    finishRun(runId, {
      totalScraped,
      totalNew,
      totalMatched: matching.totalMatched,
    });
    emit({
      type: "run_complete",
      timestamp: new Date().toISOString(),
      runId,
      totalScraped,
      totalNew,
      totalMatched: matching.totalMatched,
    });

    return {
      runId,
      totalScraped,
      totalNew,
      totalMatched: matching.totalMatched,
      boardErrors,
    };
  } catch (err) {
    const message = (err as Error).message;
    emit({
      type: "run_error",
      timestamp: new Date().toISOString(),
      message,
    });

    if (runId !== null) {
      finishRun(runId, { totalScraped, totalNew, totalMatched: 0 });
    }

    return { error: message };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    runState = "idle";
    selectorWaiter = null;
  }
}
