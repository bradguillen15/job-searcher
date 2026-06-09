import { useEffect } from "react";
import {
  extractBoardErrorMessage,
  formatProgressEvent,
  isBoardErrorLog,
} from "@/lib/scout-progress";
import type { ProgressEvent } from "@/types/progress";
import type { LogLine, RunSummary, SelectorRequiredState } from "@/types/scout";

export interface ScraperProgressHandlers {
  onLogLine: (line: LogLine) => void;
  onBoardStart: (boardId: number, boardName: string) => void;
  onBoardDone: (boardId: number, scraped: number, newCount: number) => void;
  onSelectorRequired: (state: SelectorRequiredState) => void;
  onRunComplete: (summary: RunSummary) => void;
  onRunError: (message: string) => void;
  onBoardLogError: (boardId: number, message: string) => void;
}

function formatLogTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function createLogLine(event: ProgressEvent, text: string): LogLine {
  return {
    id: `${event.timestamp}-${text}`,
    timestamp: formatLogTimestamp(event.timestamp),
    text,
  };
}

function handleProgressEvent(
  event: ProgressEvent,
  handlers: ScraperProgressHandlers
): void {
  if (isBoardErrorLog(event)) {
    handlers.onBoardLogError(
      event.boardId,
      extractBoardErrorMessage(event.message)
    );
  }

  const formatted = formatProgressEvent(event);
  if (formatted !== null) {
    handlers.onLogLine(createLogLine(event, formatted));
  }

  switch (event.type) {
    case "board_start":
      handlers.onBoardStart(event.boardId, event.boardName);
      break;
    case "board_done":
      handlers.onBoardDone(event.boardId, event.scraped, event.new);
      break;
    case "selector_required":
      handlers.onSelectorRequired({
        boardId: event.boardId,
        boardName: event.boardName,
        screenshotBase64: event.screenshotBase64,
      });
      break;
    case "run_complete":
      handlers.onRunComplete({
        totalScraped: event.totalScraped,
        totalNew: event.totalNew,
        totalMatched: event.totalMatched,
      });
      break;
    case "run_error":
      handlers.onRunError(event.message);
      break;
    default:
      break;
  }
}

export function useScraperProgress(handlers: ScraperProgressHandlers): void {
  useEffect(() => {
    const unsub = window.api.on("scraper:progress", (...args: unknown[]) => {
      const event = args[0] as ProgressEvent;
      handleProgressEvent(event, handlers);
    });
    return unsub;
  }, [handlers]);
}
