import { describe, it, expect } from "vitest";
import {
  extractBoardErrorMessage,
  formatProgressEvent,
  isBoardErrorLog,
} from "../../src/renderer/lib/scout-progress";
import type { ProgressEvent } from "../../src/renderer/types/progress";

describe("scout-progress", () => {
  const ts = "2026-06-08T12:00:00.000Z";

  describe("formatProgressEvent", () => {
    it("formats log events with message", () => {
      const event: ProgressEvent = {
        type: "log",
        timestamp: ts,
        message: "Starting scrape",
      };
      expect(formatProgressEvent(event)).toBe("Starting scrape");
    });

    it("formats keyword_start events", () => {
      const event: ProgressEvent = {
        type: "keyword_start",
        timestamp: ts,
        boardId: 1,
        keywordId: 2,
        keyword: "typescript",
      };
      expect(formatProgressEvent(event)).toBe(
        "Searching board 1: typescript"
      );
    });

    it("formats matching_start events", () => {
      const event: ProgressEvent = {
        type: "matching_start",
        timestamp: ts,
        runId: 1,
      };
      expect(formatProgressEvent(event)).toBe("AI matching started");
    });

    it("formats matching_phase events with optional detail", () => {
      const event: ProgressEvent = {
        type: "matching_phase",
        timestamp: ts,
        phase: 2,
        status: "scoring",
        detail: "batch mode",
      };
      expect(formatProgressEvent(event)).toBe(
        "Phase 2: scoring — batch mode"
      );
    });

    it("formats matching_batch events", () => {
      const event: ProgressEvent = {
        type: "matching_batch",
        timestamp: ts,
        batch: 2,
        totalBatches: 5,
        jobCount: 5,
      };
      expect(formatProgressEvent(event)).toBe(
        "Scoring batch 2/5 (5 jobs)"
      );
    });

    it("formats matching_complete events", () => {
      const event: ProgressEvent = {
        type: "matching_complete",
        timestamp: ts,
        runId: 1,
        totalMatched: 12,
      };
      expect(formatProgressEvent(event)).toBe(
        "Matching complete: 12 strong matches"
      );
    });

    it("formats run_complete summary", () => {
      const event: ProgressEvent = {
        type: "run_complete",
        timestamp: ts,
        runId: 1,
        totalScraped: 40,
        totalNew: 10,
        totalMatched: 5,
      };
      expect(formatProgressEvent(event)).toBe(
        "Run complete — scraped: 40, new: 10, matched: 5"
      );
    });

    it("returns null for board_start events", () => {
      const event: ProgressEvent = {
        type: "board_start",
        timestamp: ts,
        boardId: 1,
        boardName: "Indeed",
      };
      expect(formatProgressEvent(event)).toBeNull();
    });
  });

  describe("isBoardErrorLog", () => {
    it("detects board error log events", () => {
      const event: ProgressEvent = {
        type: "log",
        timestamp: ts,
        boardId: 3,
        message: "Board error: timeout waiting for selector",
      };
      expect(isBoardErrorLog(event)).toBe(true);
    });

    it("rejects logs without boardId", () => {
      const event: ProgressEvent = {
        type: "log",
        timestamp: ts,
        message: "Board error: something",
      };
      expect(isBoardErrorLog(event)).toBe(false);
    });

    it("rejects non-error log events", () => {
      const event: ProgressEvent = {
        type: "log",
        timestamp: ts,
        boardId: 1,
        message: "Navigating to board",
      };
      expect(isBoardErrorLog(event)).toBe(false);
    });
  });

  describe("extractBoardErrorMessage", () => {
    it("strips Board error prefix", () => {
      expect(
        extractBoardErrorMessage("Board error: navigation failed")
      ).toBe("navigation failed");
    });

    it("returns message unchanged when no prefix", () => {
      expect(extractBoardErrorMessage("plain error")).toBe("plain error");
    });
  });
});
