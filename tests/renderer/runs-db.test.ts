import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getLastCompletedRun,
  LAST_COMPLETED_RUN_SQL,
  RunsDbErrorClass,
} from "../../src/renderer/lib/runs-db";

const mockInvoke = vi.fn();

beforeEach(() => {
  mockInvoke.mockReset();
  Object.defineProperty(window, "api", {
    configurable: true,
    value: { invoke: mockInvoke },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runs-db", () => {
  describe("getLastCompletedRun", () => {
    it("invokes db:query with parameterized SQL ordered by finished_at", async () => {
      const row = {
        id: 5,
        started_at: "2026-06-08T10:00:00.000Z",
        finished_at: "2026-06-08T11:00:00.000Z",
        total_scraped: 20,
        total_new: 8,
        total_matched: 3,
      };
      mockInvoke.mockResolvedValue([row]);

      const result = await getLastCompletedRun();

      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: LAST_COMPLETED_RUN_SQL,
        params: [],
      });
      expect(result).toEqual(row);
    });

    it("returns null when no completed runs exist", async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await getLastCompletedRun();

      expect(result).toBeNull();
    });

    it("throws RunsDbErrorClass when db:query returns error", async () => {
      mockInvoke.mockResolvedValue({ error: "database locked" });

      await expect(getLastCompletedRun()).rejects.toThrow(RunsDbErrorClass);
      await expect(getLastCompletedRun()).rejects.toThrow("database locked");
    });
  });
});
