export type DateRangeKey = "24h" | "7d" | "30d" | "60d" | "90d";

export const DATE_RANGE_OPTIONS: readonly DateRangeKey[] = [
  "24h",
  "7d",
  "30d",
  "60d",
  "90d",
];

export interface CompletedRun {
  id: number;
  started_at: string;
  finished_at: string;
  total_scraped: number;
  total_new: number;
  total_matched: number;
}

export type BoardRunPhase = "idle" | "running" | "done" | "error";

export interface BoardRunStatus {
  boardId: number;
  name: string;
  phase: BoardRunPhase;
  scraped?: number;
  newCount?: number;
}

export interface LogLine {
  id: string;
  timestamp: string;
  text: string;
}

export interface SelectorRequiredState {
  boardId: number;
  boardName: string;
  screenshotBase64: string;
}

export interface RunSummary {
  totalScraped: number;
  totalNew: number;
  totalMatched: number;
}

export type ScraperRunSuccess = {
  runId: number;
  totalScraped: number;
  totalNew: number;
  totalMatched: number;
  boardErrors: Array<{ boardId: number; message: string }>;
};

export type ScraperRunResult = ScraperRunSuccess | { error: string };

export function isScraperErrorResult(
  result: ScraperRunResult
): result is { error: string } {
  return "error" in result;
}

export function isScraperBusyError(err: unknown): boolean {
  return err instanceof Error && err.name === "ScraperBusyError";
}
