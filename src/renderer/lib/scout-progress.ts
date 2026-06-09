import type { ProgressEvent } from "@/types/progress";

const BOARD_ERROR_PREFIX = "Board error:";

export function isBoardErrorLog(
  event: ProgressEvent
): event is ProgressEvent & {
  type: "log";
  boardId: number;
  message: string;
} {
  return (
    event.type === "log" &&
    event.boardId !== undefined &&
    event.message.startsWith(BOARD_ERROR_PREFIX)
  );
}

export function extractBoardErrorMessage(message: string): string {
  if (message.startsWith(BOARD_ERROR_PREFIX)) {
    return message.slice(BOARD_ERROR_PREFIX.length).trim();
  }
  return message;
}

export function formatProgressEvent(event: ProgressEvent): string | null {
  switch (event.type) {
    case "log":
      return event.message;
    case "keyword_start":
      return `Searching board ${event.boardId}: ${event.keyword}`;
    case "matching_start":
      return "AI matching started";
    case "matching_phase": {
      const detail = event.detail ? ` — ${event.detail}` : "";
      return `Phase ${event.phase}: ${event.status}${detail}`;
    }
    case "matching_batch":
      return `Scoring batch ${event.batch}/${event.totalBatches} (${event.jobCount} jobs)`;
    case "matching_complete":
      return `Matching complete: ${event.totalMatched} strong matches`;
    case "run_complete":
      return `Run complete — scraped: ${event.totalScraped}, new: ${event.totalNew}, matched: ${event.totalMatched}`;
    default:
      return null;
  }
}
