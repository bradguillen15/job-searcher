export type DateRangeKey = "24h" | "7d" | "30d" | "60d" | "90d";

export interface ScraperRunPayload {
  dateRange: DateRangeKey;
}

export type ScraperRunResult =
  | {
      runId: number;
      totalScraped: number;
      totalNew: number;
      boardErrors: Array<{ boardId: number; message: string }>;
    }
  | { error: string };

export type ScraperProvideSelectorPayload =
  | { boardId: number; selector: string }
  | { boardId: number; cancelled: true };

export interface ScrapedJob {
  title: string;
  company: string | null;
  location: string | null;
  postedDate: string | null;
  description: string | null;
  url: string;
}

export interface BoardRow {
  id: number;
  name: string;
  url: string;
  search_selector: string | null;
}

export interface KeywordRow {
  id: number;
  keyword: string;
  active: number;
}

export type ProgressEventBase = {
  timestamp: string;
};

export type ProgressEvent =
  | (ProgressEventBase & {
      type: "log";
      message: string;
      boardId?: number;
      keywordId?: number;
    })
  | (ProgressEventBase & {
      type: "board_start";
      boardId: number;
      boardName: string;
    })
  | (ProgressEventBase & {
      type: "board_done";
      boardId: number;
      scraped: number;
      new: number;
    })
  | (ProgressEventBase & {
      type: "keyword_start";
      boardId: number;
      keywordId: number;
      keyword: string;
    })
  | (ProgressEventBase & {
      type: "selector_required";
      boardId: number;
      boardName: string;
      screenshotBase64: string;
    })
  | (ProgressEventBase & {
      type: "run_complete";
      runId: number;
      totalScraped: number;
      totalNew: number;
    })
  | (ProgressEventBase & {
      type: "run_error";
      message: string;
    });

export type ProgressEmitter = (event: ProgressEvent) => void;

export class ScraperBusyError extends Error {
  constructor() {
    super("A scrape run is already in progress");
    this.name = "ScraperBusyError";
  }
}

export class ScraperNotWaitingError extends Error {
  constructor() {
    super("Scraper is not waiting for a selector");
    this.name = "ScraperNotWaitingError";
  }
}

export class ScraperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScraperError";
  }
}
